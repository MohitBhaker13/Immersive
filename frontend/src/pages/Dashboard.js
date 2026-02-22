import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, Play, Plus, Flame, Calendar as CalendarIcon, Search, Loader2, Music, Volume2, Pause } from 'lucide-react';
import BookSearchItem from '@/components/BookSearchItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENRE_OPTIONS, GENRE_TO_THEME, MOOD_OPTIONS, SOUND_THEMES, getRandomTrack } from '@/utils/constants';
import audioManager from '@/utils/audioManager';

const BOOK_QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin", book: "A Dance with Dragons" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway", book: "The Old Man and the Sea" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis", book: "Shadowlands" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King", book: "On Writing" },
  { text: "That is part of the beauty of all literature. You discover that your longings are universal longings, that you're not lonely and isolated from anyone.", author: "F. Scott Fitzgerald" },
  { text: "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.", author: "Haruki Murakami", book: "Norwegian Wood" },
  { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
  { text: "Fairy tales are more than true: not because they tell us that dragons exist, but because they tell us that dragons can be beaten.", author: "Neil Gaiman", book: "Coraline" },
];

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewBook, setShowNewBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    sound_theme: 'Focus',
    duration_minutes: user?.daily_goal_minutes || 30,
  });

  const [dailyQuote, setDailyQuote] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBookDetail, setShowBookDetail] = useState(false);
  const [selectedSearchBook, setSelectedSearchBook] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(null); // stores theme name

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadDashboardData();
    setDailyQuote(BOOK_QUOTES[Math.floor(Math.random() * BOOK_QUOTES.length)]);
  }, []);

  // Sync sound theme when selected book changes
  useEffect(() => {
    if (selectedBook) {
      // Respect preferred_theme if it exists, otherwise auto-match
      const theme = selectedBook.preferred_theme || GENRE_TO_THEME[selectedBook.genre] || 'Focus';
      setSessionForm(prev => ({
        ...prev,
        sound_theme: theme
      }));
    }
  }, [selectedBook]);

  // Preload suggested theme when dialog opens
  useEffect(() => {
    if (showNewSession) {
      const suggestedTheme = selectedBook?.preferred_theme || GENRE_TO_THEME[selectedBook?.genre] || 'Focus';
      const track = getRandomTrack(suggestedTheme);
      if (track) {
        audioManager.preload(suggestedTheme, track.url);
      }
    }
  }, [showNewSession, selectedBook]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioManager.cleanup();
    };
  }, []);

  const handlePreview = async (themeName) => {
    if (isPlayingPreview === themeName) {
      // Instantly silence so the button responds immediately
      audioManager.stopImmediate();
      setIsPlayingPreview(null);
      return;
    }

    const theme = SOUND_THEMES[themeName];
    if (!theme || !theme.tracks.length) return;

    const track = getRandomTrack(themeName);
    if (track) {
      setIsPlayingPreview(themeName);
      // Non-blocking — UI responds before audio even starts
      audioManager.play(themeName, track.url, 800);

      // Auto stop preview after 15 seconds
      setTimeout(() => {
        setIsPlayingPreview(prev => {
          if (prev === themeName) {
            audioManager.stop(400);
            return null;
          }
          return prev;
        });
      }, 15000);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [booksRes, sessionsRes, streakRes] = await Promise.all([
        api.get('/books'),
        api.get('/sessions'),
        api.get('/streak'),
      ]);
      setBooks(booksRes.data);
      setSessions(sessionsRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const currentlyReading = books.filter((b) => b.status === 'currently_reading');
  const completedSessions = sessions.filter((s) => s.ended_at);
  const totalMinutesRead = completedSessions.reduce((acc, s) => acc + (s.actual_minutes || 0), 0);

  const lastSession = sessions[0];
  const continueBook = lastSession ? books.find((b) => b.book_id === lastSession.book_id) : currentlyReading[0];

  const handleStartSession = async () => {
    if (!selectedBook) {
      toast.error('Please select a book');
      return;
    }

    // Stop preview if playing
    if (isPlayingPreview) {
      audioManager.stopImmediate();
      setIsPlayingPreview(null);
    }

    try {
      const response = await api.post('/sessions', {
        book_id: selectedBook.book_id,
        mood: selectedBook.genre,
        sound_theme: sessionForm.sound_theme, // Use the (possibly overridden) theme
        duration_minutes: sessionForm.duration_minutes,
      });

      // Update preferred theme in background
      if (selectedBook.preferred_theme !== sessionForm.sound_theme) {
        api.patch(`/books/${selectedBook.book_id}`, { preferred_theme: sessionForm.sound_theme });
      }

      navigate(`/session/${response.data.session_id}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    }
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    try {
      const response = await api.get(`/books/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedSearchBook(book);
    setShowBookDetail(true);
  };

  const handleCreateBook = async () => {
    try {
      await api.post('/books', {
        title: selectedSearchBook.title,
        author: selectedSearchBook.authors.join(', '),
        genre: selectedSearchBook.categories[0] || 'Fiction',
        cover_url: selectedSearchBook.cover_url,
        description: selectedSearchBook.description,
        page_count: selectedSearchBook.page_count,
        google_books_id: selectedSearchBook.id,
        status: 'currently_reading'
      });
      toast.success('Book added to library!');
      setShowBookDetail(false);
      setShowNewBook(false);
      setSearchQuery('');
      setSearchResults([]);
      loadDashboardData();
    } catch (error) {
      console.error('Failed to create book:', error);
      toast.error('Failed to add book');
    }
  };

  const handleContinueReading = () => {
    if (!continueBook) {
      toast.error('No book to continue');
      return;
    }
    setSelectedBook(continueBook);
    setShowNewSession(true);
  };

  const getWeekDates = () => {
    const today = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      week.push(date);
    }
    return week;
  };

  const hasSessionOnDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.some((s) => {
      if (!s.ended_at) return false;
      const sessionDate = new Date(s.started_at).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navigation currentPage="dashboard" />
        <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-12">
          {/* Greeting skeleton */}
          <div className="mb-8 md:mb-12">
            <div className="skeleton h-10 w-64 mb-3"></div>
            <div className="skeleton h-5 w-48"></div>
          </div>
          {/* Streak card skeleton */}
          <div className="card-paper p-4 md:p-8 mb-6 md:mb-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="skeleton w-14 h-14 md:w-16 md:h-16 rounded-full"></div>
                <div>
                  <div className="skeleton h-9 w-12 mb-2"></div>
                  <div className="skeleton h-3 w-20"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                {[...Array(7)].map((_, i) => <div key={i} className="skeleton w-8 h-8 md:w-11 md:h-11 rounded-full"></div>)}
              </div>
            </div>
          </div>
          {/* Continue reading skeleton */}
          <div className="card-paper p-4 md:p-8 mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="skeleton h-3 w-28 mb-2"></div>
                <div className="skeleton h-7 w-48 mb-2"></div>
                <div className="skeleton h-4 w-32 mb-4"></div>
                <div className="skeleton h-10 w-28 rounded-md"></div>
              </div>
              <div className="skeleton w-16 h-24 md:w-32 md:h-44 rounded"></div>
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="card-paper p-4 md:p-6"><div className="skeleton h-8 w-10 mb-2"></div><div className="skeleton h-4 w-20"></div></div>
            <div className="card-paper p-4 md:p-6"><div className="skeleton h-8 w-10 mb-2"></div><div className="skeleton h-4 w-20"></div></div>
            <div className="card-paper p-4 md:p-6"><div className="skeleton h-8 w-10 mb-2"></div><div className="skeleton h-4 w-20"></div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture pb-20 md:pb-0">
      <Navigation currentPage="dashboard" />

      <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-12 page-enter">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-[#2C2A27] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h1>
          <p className="text-[#6A645C] text-base md:text-lg mb-6 md:mb-8" style={{ fontFamily: 'Lora, serif' }}>Ready to immerse yourself?</p>

          {dailyQuote && (
            <div className="bg-[#fcfaf7] border border-[#E8E3D9]/60 rounded-xl p-4 md:p-6 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#A68A64]/10 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100"></div>
              <div className="relative">
                <span className="text-[#A68A64] text-2xl md:text-3xl absolute -top-1 -left-1 opacity-50 font-serif">"</span>
                <p className="text-[#6A645C] text-sm md:text-base italic leading-relaxed pl-4 pr-2" style={{ fontFamily: 'Lora, serif' }}>
                  {dailyQuote.text}
                </p>
                <div className="mt-3 md:mt-4 pl-4 text-xs md:text-sm">
                  <span className="font-semibold text-[#2C2A27]" style={{ fontFamily: 'Playfair Display, serif' }}>— {dailyQuote.author}</span>
                  {dailyQuote.book && (
                    <span className="text-[#9B948B] ml-1">
                      in <cite style={{ fontFamily: 'Lora, serif' }}>{dailyQuote.book}</cite>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card-paper p-4 md:p-8 mb-6 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#A68A64] opacity-20 blur-xl rounded-full animate-pulse transition-opacity group-hover:opacity-30"></div>
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#fdfaf6] border border-[#e8e3d9] flex items-center justify-center shadow-inner overflow-hidden">
                  <Flame
                    className={`w-7 h-7 md:w-8 md:h-8 transition-all duration-1000 ${streak?.current_streak > 0 ? 'text-[#A68A64] scale-110' : 'text-[#9B948B]'}`}
                    style={{
                      filter: streak?.current_streak > 0 ? 'drop-shadow(0 0 8px rgba(166, 138, 100, 0.3))' : 'none'
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#2C2A27]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {streak?.current_streak || 0}
                </div>
                <div className="text-[10px] md:text-sm uppercase tracking-widest text-[#A68A64] font-medium">Day Streak</div>
              </div>
            </div>

            <div className="w-full md:w-auto mt-2 md:mt-0">
              <div className="text-[10px] uppercase tracking-widest text-[#9B948B] mb-3 text-center md:text-right font-medium">Weekly Activity</div>
              <div className="flex items-center justify-center md:justify-end space-x-1.5 md:space-x-2">
                {getWeekDates().map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const hasSession = hasSessionOnDate(date);
                  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                  const dayNum = date.getDay();

                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center space-y-1.5 animate-in fade-in slide-in-from-right-1 duration-500"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <span className={`text-[9px] md:text-[10px] font-bold ${isToday ? 'text-[#A68A64]' : 'text-[#9B948B]'}`}>
                        {days[dayNum]}
                      </span>
                      <div
                        className={`w-8 h-8 md:w-11 md:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-500 border ${hasSession
                          ? 'bg-[#A68A64] text-white border-[#A68A64] shadow-md scale-105 md:scale-110'
                          : isToday
                            ? 'bg-white text-[#2C2A27] border-[#A68A64] border-2 ring-2 md:ring-4 ring-[#A68A64]/5 shadow-sm'
                            : 'bg-[#fdfaf6] text-[#9B948B] border-[#E8E3D9] opacity-60'
                          }`}
                      >
                        <span className="text-[10px] md:text-[11px] font-medium">{date.getDate()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {continueBook && (
          <div className="card-paper p-4 md:p-8 mb-6 md:mb-8 overflow-hidden">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] md:text-sm uppercase tracking-wider text-[#A68A64] font-medium mb-1">Continue Reading</div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#2C2A27] mb-0.5 md:mb-1 line-clamp-1 md:line-clamp-none" style={{ fontFamily: 'Playfair Display, serif' }}>{continueBook.title}</h2>
                <p className="text-xs md:text-lg text-[#6A645C] mb-2 md:mb-4 italic line-clamp-1" style={{ fontFamily: 'Lora, serif' }}>by {continueBook.author}</p>
                <div className="flex items-center space-x-2 md:space-x-3 text-[10px] md:text-sm text-[#9B948B] mb-3 md:mb-6 uppercase tracking-tight">
                  <span>{continueBook.total_sessions} sess</span>
                  <span className="opacity-30">|</span>
                  <span>{continueBook.total_minutes} mins</span>
                </div>
                <button onClick={handleContinueReading} className="btn-paper-accent flex items-center justify-center space-x-2 py-1.5 px-3 md:py-3 md:px-6 text-xs md:text-base">
                  <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                  <span>Continue</span>
                </button>
              </div>
              {continueBook.cover_url && (
                <div className="flex-shrink-0">
                  <img
                    src={continueBook.cover_url}
                    alt={continueBook.title}
                    className="w-16 h-24 md:w-32 md:h-44 object-cover rounded shadow-md border border-[#E8E3D9]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card-paper p-6 md:p-8 mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-[#2C2A27] mb-3 md:mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Start New Session</h3>
          <p className="text-[#6A645C] mb-4 md:mb-6" style={{ fontFamily: 'Lora, serif' }}>Choose a book and set the mood</p>
          <div className="flex flex-col md:flex-row gap-3 md:space-x-4">
            <button onClick={() => setShowNewSession(true)} className="btn-paper flex items-center justify-center space-x-2 w-full md:w-auto">
              <BookOpen className="w-4 h-4" />
              <span>Choose Book</span>
            </button>
            <button onClick={() => setShowNewBook(true)} className="btn-paper flex items-center justify-center space-x-2 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
          <div className="card-paper p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{books.length}</div>
            <div className="text-[#6A645C] text-xs md:text-sm">Books</div>
          </div>
          <div className="card-paper p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{completedSessions.length}</div>
            <div className="text-[#6A645C] text-xs md:text-sm">Sessions</div>
          </div>
          <div className="card-paper p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{totalMinutesRead}</div>
            <div className="text-[#6A645C] text-xs md:text-sm">Minutes</div>
          </div>
        </div>

        <button onClick={() => navigate('/calendar')} className="w-full card-paper p-5 md:p-6 flex items-center justify-between active:border-[#A68A64] transition-colors">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-[#A68A64]" />
            <span className="text-[#2C2A27] font-medium">View Full Calendar</span>
          </div>
          <span className="text-[#9B948B]">→</span>
        </button>
      </div>

      <Dialog open={showNewSession} onOpenChange={(open) => {
        if (!open) {
          // Stop any preview audio when dialog is dismissed
          audioManager.stop(300);
          setIsPlayingPreview(null);
        }
        setShowNewSession(open);
      }}>
        <DialogContent className="bg-white border-[#E8E3D9]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Start Reading Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#2C2A27]">Book</Label>
              <Select value={selectedBook?.book_id} onValueChange={(val) => setSelectedBook(books.find((b) => b.book_id === val))}>
                <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
                <SelectContent>
                  {currentlyReading.map((book) => (
                    <SelectItem key={book.book_id} value={book.book_id}>{book.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label className="text-[#2C2A27]">Atmosphere</Label>
                {selectedBook && (
                  <span className="text-[10px] uppercase tracking-wider text-[#A68A64] font-medium bg-[#F4F1EA] px-1.5 py-0.5 rounded">
                    Suggestions: {GENRE_TO_THEME[selectedBook.genre] || 'Focus'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 py-1 custom-scrollbar">
                {MOOD_OPTIONS.map((mood) => (
                  <div
                    key={mood.value}
                    onClick={() => setSessionForm({ ...sessionForm, sound_theme: mood.value })}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group
                      ${sessionForm.sound_theme === mood.value
                        ? 'bg-[#F4F1EA] border-[#A68A64] shadow-sm'
                        : 'bg-white border-[#E8E3D9] hover:border-[#A68A64]'}
                    `}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3 grayscale group-hover:grayscale-0 transition-all">
                        {mood.icon}
                      </span>
                      <div className="text-left">
                        <div className="font-semibold text-sm text-[#2C2A27]">
                          {mood.label}
                        </div>
                        <div className="text-[10px] text-[#6A645C] line-clamp-1">
                          {mood.description}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(mood.value);
                      }}
                      className={`
                        w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm
                        ${isPlayingPreview === mood.value
                          ? 'bg-[#A68A64] text-white'
                          : 'bg-white border border-[#E8E3D9] text-[#9B948B] hover:border-[#A68A64] hover:text-[#A68A64]'}
                      `}
                    >
                      {isPlayingPreview === mood.value ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[#2C2A27]">Duration (minutes)</Label>
              <Select value={sessionForm.duration_minutes.toString()} onValueChange={(val) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(val) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 15, 30, 45, 60, 90, 120].map((min) => (
                    <SelectItem key={min} value={min.toString()}>{min} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button onClick={handleStartSession} className="w-full btn-paper-accent py-3">Start Session</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewBook} onOpenChange={(open) => {
        setShowNewBook(open);
        if (!open) { setSearchQuery(''); setSearchResults([]); }
      }}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-lg p-0 overflow-hidden">
          <div className="p-6 border-b border-[#E8E3D9]">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Find your next book</DialogTitle>
            <p className="text-[#6A645C] text-sm mt-1">Search millions of books to add to your library</p>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B948B]" />
              <Input
                placeholder="Title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F8F6F1] border-[#E8E3D9] h-12 text-base"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#A68A64]" />
                </div>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 min-h-[200px]">
            {isSearching ? (
              <div className="space-y-4 p-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#A68A64] mx-auto mb-2" />
                <p className="text-sm text-[#9B948B]">Searching Google Books...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((book) => (
                  <BookSearchItem key={book.id} book={book} onSelect={handleSelectBook} onInfo={handleSelectBook} />
                ))}
              </div>
            ) : searchQuery.length > 2 && !isSearching ? (
              <div className="py-12 text-center text-[#9B948B]">No books found for "{searchQuery}"</div>
            ) : (
              <div className="py-12 text-center">
                <BookOpen className="w-8 h-8 text-[#E8E3D9] mx-auto mb-3" />
                <p className="text-[#9B948B] text-sm italic">"A room without books is like a body without a soul."</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBookDetail} onOpenChange={setShowBookDetail}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-md">
          {selectedSearchBook && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-24 h-36 flex-shrink-0 bg-[#E8E3D9] rounded shadow-md overflow-hidden">
                  {selectedSearchBook.cover_url && <img src={selectedSearchBook.cover_url} alt={selectedSearchBook.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl leading-tight">{selectedSearchBook.title}</DialogTitle>
                  <p className="text-[#6A645C] mt-1 italic">{selectedSearchBook.authors.join(', ')}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedSearchBook.categories.map(cat => (
                      <span key={cat} className="text-[10px] uppercase tracking-wider bg-[#F4F1EA] text-[#A68A64] px-2 py-1 rounded">{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#2C2A27] mb-1 uppercase tracking-tighter">About</h4>
                <p className="text-sm text-[#6A645C] line-clamp-4 leading-relaxed">{selectedSearchBook.description || "No description available."}</p>
                {selectedSearchBook.page_count && <p className="text-xs text-[#9B948B] mt-2">{selectedSearchBook.page_count} pages</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBookDetail(false)} className="flex-1 btn-paper">Cancel</button>
                <button onClick={handleCreateBook} className="flex-[2] btn-paper-accent py-3 font-semibold">Add to Library</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
