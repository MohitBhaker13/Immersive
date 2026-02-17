import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { X, Volume2, VolumeX, StickyNote, Volume1 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { SOUND_THEMES, getRandomTrack } from '@/utils/constants';
import audioManager from '@/utils/audioManager';

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
  const [noteContent, setNoteContent] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerRef = useRef(null);
  const sessionRef = useRef(null);
  const hasLoaded = useRef(false);

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await audioManager.stop(1000);

    try {
      await api.post(`/sessions/${sessionId}/complete`, {
        actual_minutes: sessionRef.current?.duration_minutes,
      });
      toast.success('Session completed!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to complete session');
    }
  }, [sessionId, navigate]);

  // Separate effect for the actual timer ticker
  useEffect(() => {
    if (!session || timeRemaining <= 0) return;

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      // We don't clear here to allow it to persist through small re-renders,
      // only if the component unmounts or explicitly stopped.
    };
  }, [session, timeRemaining <= 0, handleComplete]);

  const loadSession = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

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
      setTimeRemaining(currentSession.duration_minutes * 60);

      const sessionBook = booksRes.data.find((b) => b.book_id === currentSession.book_id);
      setBook(sessionBook);

      if (currentSession.sound_theme && SOUND_THEMES[currentSession.sound_theme]) {
        const track = getRandomTrack(currentSession.sound_theme);
        if (track) {
          await audioManager.play(currentSession.sound_theme, track.url, 2000);
          setSoundEnabled(true);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session');
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    loadSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioManager.cleanup();
    };
  }, [sessionId, loadSession]);

  const toggleSound = useCallback(() => {
    const newMutedState = audioManager.toggleMute();
    setSoundEnabled(!newMutedState);
  }, []);

  const handleVolumeChange = useCallback((newVolume) => {
    const vol = newVolume[0] / 100; // Convert 0-100 to 0-1
    setVolume(vol);
    audioManager.setVolume(vol);
  }, []);

  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await audioManager.stop(500); // Quick fade out

    const minutesSpent = Math.ceil((sessionRef.current?.duration_minutes * 60 - timeRemaining) / 60);

    try {
      if (minutesSpent > 0) {
        await api.post(`/sessions/${sessionId}/complete`, {
          actual_minutes: minutesSpent,
        });
      }
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

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture relative">
      {/* Subtle background based on mood */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: session.mood === 'Horror'
            ? 'linear-gradient(180deg, rgba(200,195,188,0.3) 0%, rgba(248,246,241,1) 100%)'
            : session.mood === 'Romance'
              ? 'linear-gradient(180deg, rgba(255,245,235,0.4) 0%, rgba(248,246,241,1) 100%)'
              : 'transparent',
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
        <div className="text-[#6A645C] text-xs md:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          {session.mood} Atmosphere
        </div>

        <div
          data-testid="timer-display"
          className="text-xl md:text-2xl font-medium text-[#2C2A27]"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {formatTime(timeRemaining)}
        </div>

        <button
          data-testid="exit-session-btn"
          onClick={handleExit}
          className="text-[#6A645C] active:text-[#2C2A27] transition-colors p-2"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Reading Area */}
      <div className="relative z-10 max-w-[720px] mx-auto px-6 md:px-12 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold text-[#2C2A27] mb-3"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {book.title}
          </h1>
          <p className="text-[#6A645C] text-base md:text-lg" style={{ fontFamily: 'Lora, serif' }}>
            by {book.author}
          </p>
        </div>

        {/* Reading Content Placeholder */}
        <div
          className="reading-mode space-y-5 md:space-y-6 text-[#2C2A27]"
          style={{
            fontFamily: 'Lora, serif',
            fontSize: '17px',
            lineHeight: '1.7',
          }}
        >
          <p>
            Welcome to your immersive reading session. This is where your book content would appear.
            The interface is designed to be minimal and distraction-free, allowing you to focus entirely
            on the text.
          </p>
          <p>
            The warm paper tones and carefully chosen typography create a comfortable reading environment.
            The ambient soundscape enhances the mood without being intrusive.
          </p>
          <p>
            Use this time to immerse yourself fully in your book. When thoughts arise, capture them
            with the note button. The timer will gently remind you when your session is complete.
          </p>
          <p>
            This space is yours. No notifications, no distractions. Just you and the story.
          </p>
        </div>
      </div>

      {/* Floating Controls - Mobile Optimized */}
      <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-20 flex flex-col space-y-3">
        {/* Volume Control */}
        <div
          className="relative group"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            data-testid="toggle-sound-btn"
            onClick={toggleSound}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSound();
            }}
            className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-white border border-[#E8E3D9] flex items-center justify-center shadow-lg active:border-[#A68A64] transition-colors"
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? (
              volume > 0.5 ? (
                <Volume2 className="w-6 h-6 md:w-5 md:h-5 text-[#2C2A27]" />
              ) : (
                <Volume1 className="w-6 h-6 md:w-5 md:h-5 text-[#2C2A27]" />
              )
            ) : (
              <VolumeX className="w-6 h-6 md:w-5 md:h-5 text-[#9B948B]" />
            )}
          </button>

          {/* Volume Slider - Desktop Only */}
          {showVolumeSlider && (
            <div
              className="hidden md:block absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-white border border-[#E8E3D9] rounded-lg p-3 shadow-lg"
              style={{ display: window.matchMedia('(pointer: coarse)').matches ? 'none' : 'block' }}
            >
              <div className="flex items-center space-x-3">
                <VolumeX className="w-4 h-4 text-[#9B948B]" />
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-24"
                />
                <Volume2 className="w-4 h-4 text-[#2C2A27]" />
              </div>
              {/* Invisible bridge to prevent mouse-out when moving between button and slider */}
              <div className="absolute top-0 -right-4 w-4 h-full" />
            </div>
          )}
        </div>

        <button
          data-testid="add-note-btn"
          onClick={() => setShowNoteDialog(true)}
          className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-[#A68A64] flex items-center justify-center shadow-lg active:bg-[#8F7556] transition-colors"
          title="Add note"
        >
          <StickyNote className="w-6 h-6 md:w-5 md:h-5 text-white" />
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
    </div>
  );
};

export default ImmersiveSession;
