import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { X, Volume2, VolumeX, StickyNote, Volume1, Music, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { SOUND_THEMES, getRandomTrack, MOOD_OPTIONS } from '@/utils/constants';
import audioManager from '@/utils/audioManager';
import BookCompanionChat from '@/components/BookCompanionChat';

const ImmersiveSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [book, setBook] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showAtmosphereDialog, setShowAtmosphereDialog] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCompanionChat, setShowCompanionChat] = useState(false);
  const [showMobileVolume, setShowMobileVolume] = useState(false);
  const [prevTheme, setPrevTheme] = useState(null);
  const [themeFading, setThemeFading] = useState(false);
  const sessionRef = useRef(null);
  const hasLoaded = useRef(false);
  const lastTouchTime = useRef(0);
  const muteTimer = useRef(null);
  const muteFired = useRef(false);

  // Keep ref in sync for handlers to use without changing identity
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleComplete = useCallback(async () => {
    await audioManager.stop(1000);

    try {
      const planned = sessionRef.current?.duration_minutes || 30;
      await api.post(`/sessions/${sessionId}/complete`, {
        actual_minutes: Math.max(1, planned),
      });
      toast.success('Session completed!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to complete session');
    }
  }, [sessionId, navigate]);

  // Ticker effect: robust pattern that satisfies ESLint and prevents jank
  useEffect(() => {
    if (!session) return;

    if (timeRemaining <= 0) {
      handleComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, timeRemaining, handleComplete]);

  const loadSession = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // Proactively start loading audio if we have a cached theme for this session
    const savedTheme = sessionStorage.getItem(`theme_${sessionId}`);
    if (savedTheme && SOUND_THEMES[savedTheme]) {
      const track = getRandomTrack(savedTheme);
      if (track) {
        audioManager.play(savedTheme, track.url, 2000);
        setCurrentTheme(savedTheme);
        setSoundEnabled(true);
      }
    }

    try {
      const [sessionRes, booksRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/books'),
      ]);

      const currentSession = sessionRes.data.find((s) => s.session_id === sessionId);
      if (!currentSession) {
        toast.error('Session not found');
        navigate('/dashboard');
        return;
      }

      setSession(currentSession);

      // Calculate exact time remaining based on backend started_at timestamp
      let dateString = currentSession.started_at;
      if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        dateString += 'Z'; // Force UTC parsing if the backend didn't append timezone info
      }
      const startedAt = new Date(dateString);
      const elapsedSeconds = Math.floor((new Date() - startedAt) / 1000);
      const totalSeconds = currentSession.duration_minutes * 60;
      setTimeRemaining(Math.max(0, totalSeconds - elapsedSeconds));

      const sessionBook = booksRes.data.find((b) => b.book_id === currentSession.book_id);
      setBook(sessionBook);

      // Update theme if it differs from the early-hint or if no hint was available
      const themeToPlay = sessionStorage.getItem(`theme_${sessionId}`) || currentSession.sound_theme;

      if (themeToPlay && SOUND_THEMES[themeToPlay] && themeToPlay !== currentTheme) {
        setCurrentTheme(themeToPlay);
        const track = getRandomTrack(themeToPlay);
        if (track) {
          await audioManager.play(themeToPlay, track.url, 2000);
          setSoundEnabled(true);
        }
      } else if (!themeToPlay && !currentTheme) {
        // Fallback for sessions with no theme specified
        setSoundEnabled(false);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session');
      navigate('/dashboard');
    }
  }, [sessionId, navigate, currentTheme]);

  useEffect(() => {
    loadSession();
    return () => {
      audioManager.cleanup();
    };
  }, [sessionId, loadSession]);

  const toggleSound = useCallback(() => {
    const newMutedState = audioManager.toggleMute();
    // Fallback in case Manager wasn't ready yet or is already in sync
    const finalMutedState = newMutedState === undefined ? !soundEnabled : newMutedState;
    setSoundEnabled(!finalMutedState);
  }, [soundEnabled]);

  const handleVolumeChange = useCallback((newVolume) => {
    const vol = newVolume[0] / 100; // Convert 0-100 to 0-1
    setVolume(vol);
    audioManager.setVolume(vol);

    // Auto-unmute if sliding up from 0
    if (vol > 0 && !soundEnabled) {
      setSoundEnabled(true);
      if (audioManager.isMuted) audioManager.toggleMute();
    } else if (vol === 0 && soundEnabled) {
      // Auto-mute if sliding to 0
      setSoundEnabled(false);
      if (!audioManager.isMuted) audioManager.toggleMute();
    }
  }, [soundEnabled]);


  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const handleThemeChange = useCallback(async (themeName) => {
    if (themeName === currentTheme) return;

    // Crossfade: keep old theme visible while new one fades in
    setPrevTheme(currentTheme);
    setThemeFading(true);
    setCurrentTheme(themeName);
    // After the CSS transition completes, remove the old layer
    setTimeout(() => {
      setThemeFading(false);
      setPrevTheme(null);
    }, 800);
    const track = getRandomTrack(themeName);
    if (track) {
      await audioManager.play(themeName, track.url, 1500); // Smooth transition
      setSoundEnabled(true);

      // Store locally so it survives page refreshes during this session
      sessionStorage.setItem(`theme_${sessionId}`, themeName);

      // Persist preference to backend for this book
      if (book) {
        api.patch(`/books/${book.book_id}`, { preferred_theme: themeName }).catch(err => {
          console.error('Failed to save preferred theme:', err);
        });
      }
    }
    setShowAtmosphereDialog(false);
  }, [currentTheme, book, sessionId]);

  const confirmExit = useCallback(async () => {
    await audioManager.stop(500); // Quick fade out

    const totalSeconds = (sessionRef.current?.duration_minutes || 0) * 60 - timeRemaining;
    const minutesSpent = Math.max(1, Math.ceil(totalSeconds / 60));

    try {
      await api.post(`/sessions/${sessionId}/complete`, {
        actual_minutes: minutesSpent,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to exit session:', error);
      navigate('/dashboard');
    }
  }, [sessionId, timeRemaining, navigate]);

  const handleSaveNote = useCallback(async () => {
    if (!noteContent.trim()) return;

    try {
      await api.post('/notes', {
        session_id: sessionId,
        book_id: session?.book_id,
        content: noteContent,
      });
      toast.success('Note saved');
      setNoteContent('');
      setShowNoteDialog(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    }
  }, [sessionId, session?.book_id, noteContent]);

  if (!session || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A68A64] border-r-transparent"></div>
      </div>
    );
  }

  const totalSeconds = (session?.duration_minutes || 1) * 60;
  const elapsedSeconds = totalSeconds - timeRemaining;
  const progress = Math.min(1, elapsedSeconds / totalSeconds);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture relative">
      {/* Tap-anywhere-to-dismiss backdrop (mobile only) */}
      {showMobileVolume && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowMobileVolume(false)}
        />
      )}

      {/* Smooth crossfade background: old theme fades out, new theme fades in */}
      {prevTheme && themeFading && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: SOUND_THEMES[prevTheme]?.ui?.bg || '#F8F6F1',
            opacity: 0,
            transition: 'opacity 800ms ease-in-out',
          }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: SOUND_THEMES[currentTheme]?.ui?.bg || '#F8F6F1',
          opacity: 1,
          transition: 'opacity 800ms ease-in-out',
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
        <div className="text-[#6A645C] text-xs md:text-sm flex items-center space-x-1 transition-colors duration-500"
          style={{ fontFamily: 'Inter, sans-serif', color: SOUND_THEMES[currentTheme]?.ui?.accent }}>
          <Music className="w-3 h-3" />
          <span>{SOUND_THEMES[currentTheme]?.name || 'Ambient'} Atmosphere</span>
        </div>

        {/* Timer with progress ring */}
        <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke={SOUND_THEMES[currentTheme]?.ui?.accent || '#E8E3D9'} strokeWidth="2.5" opacity="0.2" />
            <circle cx="48" cy="48" r="42" fill="none" stroke={SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64'} strokeWidth="2.5"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
          </svg>
          <div
            data-testid="timer-display"
            className="text-lg md:text-xl font-medium transition-colors duration-500"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: SOUND_THEMES[currentTheme]?.ui?.text || '#2C2A27'
            }}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        <button
          data-testid="exit-session-btn"
          onClick={handleExit}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-black/5 active:scale-95 group"
          style={{ color: SOUND_THEMES[currentTheme]?.ui?.accent || '#6A645C' }}
          title="Exit Session"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Reading Area */}
      <div
        className="relative z-10 max-w-[720px] mx-auto px-6 md:px-12 py-8 md:py-16 mt-4 md:mt-8 rounded-2xl transition-all duration-1000 ease-in-out shadow-2xl page-enter"
        style={{
          backgroundColor: SOUND_THEMES[currentTheme]?.ui?.paper || 'rgba(255, 255, 255, 0.9)',
          boxShadow: `0 25px 50px -12px ${SOUND_THEMES[currentTheme]?.ui?.shadow || 'rgba(0, 0, 0, 0.1)'}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="mb-6 md:mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-3 transition-colors duration-500"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: SOUND_THEMES[currentTheme]?.ui?.text || '#2C2A27'
            }}
          >
            {book.title}
          </h1>
          <p className="opacity-80 text-base md:text-lg transition-colors duration-500"
            style={{
              fontFamily: 'Lora, serif',
              color: SOUND_THEMES[currentTheme]?.ui?.text || '#6A645C'
            }}>
            by {book.author}
          </p>
        </div>

        {/* Reading Content Placeholder */}
        <div
          className="reading-mode space-y-5 md:space-y-6 transition-colors duration-500"
          style={{
            fontFamily: 'Lora, serif',
            fontSize: '17px',
            lineHeight: '1.7',
            color: SOUND_THEMES[currentTheme]?.ui?.text || '#2C2A27'
          }}
        >
          <p>
            Welcome to your immersive reading session. This is where your book content would appear.
            The interface is designed to be minimal and distraction-free, allowing you to focus entirely
            on the text.
          </p>
          <p>
            The environment has shifted to match your {SOUND_THEMES[currentTheme]?.name || 'chosen'} atmosphere.
            The colors and sounds are now in perfect harmony to keep you in the zone.
          </p>
          <p>
            Use this time to immerse yourself fully in your book. When thoughts arise, capture them
            with the note button. The timer will gently remind you when your session is complete.
          </p>
        </div>
      </div>

      {/* Floating Controls - Mobile Optimized */}
      <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 flex flex-col space-y-3">
        {/* Atmosphere Button */}
        <button
          onClick={() => setShowAtmosphereDialog(true)}
          className="w-14 h-14 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border duration-500 group"
          style={{
            backgroundColor: showAtmosphereDialog ? (SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64') : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderColor: SOUND_THEMES[currentTheme]?.ui?.accent || '#E8E3D9',
            color: showAtmosphereDialog
              ? (['Horror', 'SciFi', 'Cyberpunk', 'Storm', 'Thriller', 'Epic'].includes(currentTheme) ? '#1e293b' : 'white')
              : (SOUND_THEMES[currentTheme]?.ui?.accent || '#2C2A27')
          }}
          title="Change atmosphere"
        >
          <Music className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
        </button>

        <div
          className="relative group z-50"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >

          <button
            data-testid="toggle-sound-btn"
            onClick={(e) => {
              // Distinguish touch from mouse using timing
              const isTouch = Date.now() - lastTouchTime.current < 600;

              if (isTouch) {
                // On mobile: strictly toggle slider visibility
                setShowMobileVolume(prev => !prev);
              } else {
                // On desktop: toggle mute
                toggleSound();
              }
            }}
            onTouchStart={() => {
              lastTouchTime.current = Date.now();
              muteFired.current = false;
              // Start long-press timer for mute toggle
              muteTimer.current = setTimeout(() => {
                toggleSound();
                muteFired.current = true;
              }, 500);
            }}
            onTouchMove={() => {
              // Cancel mute if moving (prevents accidental mute during scroll)
              clearTimeout(muteTimer.current);
            }}
            onTouchEnd={(e) => {
              clearTimeout(muteTimer.current);
              if (muteFired.current) {
                e.preventDefault(); // prevent onClick from also firing
              }
            }}
            className="w-14 h-14 md:w-12 md:h-12 rounded-full border flex items-center justify-center shadow-lg transition-all duration-500 relative z-20 group"
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderColor: SOUND_THEMES[currentTheme]?.ui?.accent || '#E8E3D9'
            }}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? (
              volume > 0.5 ? (
                <Volume2 className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ml-0.5" style={{ color: SOUND_THEMES[currentTheme]?.ui?.accent || '#2C2A27' }} />
              ) : (
                <Volume1 className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110 ml-0.5" style={{ color: SOUND_THEMES[currentTheme]?.ui?.accent || '#2C2A27' }} />
              )
            ) : (
              <VolumeX className="w-6 h-6 md:w-5 md:h-5 text-[#9B948B] transition-transform group-hover:scale-110" />
            )}
          </button>

          {/* Volume Slider — Desktop: hover, Mobile: tap to expand */}
          {(showVolumeSlider || showMobileVolume) && (
            <div
              className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-white border border-[#E8E3D9] rounded-lg p-3 shadow-lg z-50 transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3">
                <VolumeX
                  className={`w-4 h-4 cursor-pointer transition-colors ${!soundEnabled ? 'text-[#A68A64]' : 'text-[#9B948B]'}`}
                  onClick={() => soundEnabled && toggleSound()}
                />
                <Slider
                  value={[soundEnabled ? volume * 100 : 0]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-24"
                />
                <Volume2
                  className={`w-4 h-4 cursor-pointer transition-colors ${!soundEnabled ? 'text-[#9B948B]' : 'text-[#A68A64]'}`}
                  onClick={() => !soundEnabled && toggleSound()}
                />
              </div>
              {/* Invisible bridge for desktop hover */}
              <div className="absolute top-0 -right-4 w-4 h-full" />
            </div>
          )}
        </div>

        <button
          data-testid="add-note-btn"
          onClick={() => setShowNoteDialog(true)}
          className="w-14 h-14 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 active:scale-95 group"
          style={{
            backgroundColor: SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: ['Horror', 'SciFi', 'Cyberpunk', 'Storm', 'Thriller', 'Epic'].includes(currentTheme) ? '#1e293b' : 'white'
          }}
          title="Add note"
        >
          <StickyNote className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Book Companion Chat Button */}
        <button
          onClick={() => setShowCompanionChat(true)}
          className="w-14 h-14 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 active:scale-95 border-2 group"
          style={{
            backgroundColor: showCompanionChat ? (SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64') : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderColor: SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64',
            color: showCompanionChat
              ? (['Horror', 'SciFi', 'Cyberpunk', 'Storm', 'Thriller', 'Epic'].includes(currentTheme) ? '#1e293b' : 'white')
              : (SOUND_THEMES[currentTheme]?.ui?.accent || '#A68A64')
          }}
          title="Ask about this book"
        >
          <MessageCircle className="w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
        </button>
      </div>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="bg-white border-[#E8E3D9]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              data-testid="note-textarea"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your thoughts..."
              className="min-h-[150px] bg-white border-[#E8E3D9] text-[#2C2A27]"
              style={{ fontFamily: 'Lora, serif' }}
            />
            <button
              data-testid="save-note-btn"
              onClick={handleSaveNote}
              className="w-full btn-paper-accent py-3"
            >
              Save Note
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Atmosphere Selector Dialog */}
      <Dialog open={showAtmosphereDialog} onOpenChange={setShowAtmosphereDialog}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-sm p-4 overflow-hidden">
          <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl mb-4">Change Atmosphere</DialogTitle>
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {MOOD_OPTIONS.map((mood) => (
              <div
                key={mood.value}
                onClick={() => handleThemeChange(mood.value)}
                className={`
                  flex items-center p-3 rounded-xl border transition-all cursor-pointer
                  ${currentTheme === mood.value
                    ? 'bg-[#F4F1EA] border-[#A68A64] shadow-sm'
                    : 'bg-white border-[#E8E3D9] hover:border-[#A68A64]'}
                `}
              >
                <span className="text-xl mr-3">{mood.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-sm text-[#2C2A27]">{mood.label}</div>
                  <div className="text-[10px] text-[#6A645C] line-clamp-1">{mood.description}</div>
                </div>
                {currentTheme === mood.value && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#A68A64] animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="bg-white border-[#E8E3D9]" aria-describedby="exit-dialog-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Exit Session?</DialogTitle>
          </DialogHeader>
          <p id="exit-dialog-description" className="sr-only">Confirm exiting your reading session</p>
          <div className="space-y-4 mt-4">
            <p className="text-[#6A645C]" style={{ fontFamily: 'Lora, serif' }}>
              Your progress will be saved. Are you sure you want to exit?
            </p>
            <div className="flex space-x-3">
              <button
                data-testid="cancel-exit-btn"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 btn-paper py-3"
              >
                Continue Reading
              </button>
              <button
                data-testid="confirm-exit-btn"
                onClick={confirmExit}
                className="flex-1 btn-paper-accent py-3"
              >
                Exit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Companion Chat */}
      <BookCompanionChat
        book={book}
        currentTheme={currentTheme}
        open={showCompanionChat}
        onClose={() => setShowCompanionChat(false)}
      />
    </div>
  );
};

export default ImmersiveSession;
