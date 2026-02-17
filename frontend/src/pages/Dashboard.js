import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, Play, Plus, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOOD_OPTIONS, GENRE_OPTIONS, SOUND_THEMES, GENRE_TO_THEME } from '@/utils/constants';

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
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    author: '',
    genre: 'Fiction',
    status: 'currently_reading',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sync sound theme when selected book changes
  useEffect(() => {
    if (selectedBook) {
      const theme = GENRE_TO_THEME[selectedBook.genre] || 'Focus';
      setSessionForm(prev => ({
        ...prev,
        sound_theme: theme
      }));
    }
  }, [selectedBook]);

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
  const lastSession = sessions[0];
  const continueBook = lastSession ? books.find((b) => b.book_id === lastSession.book_id) : currentlyReading[0];

  const handleStartSession = async () => {
    if (!selectedBook) {
      toast.error('Please select a book');
      return;
    }

    try {
      const theme = GENRE_TO_THEME[selectedBook.genre] || 'Focus';
      const response = await api.post('/sessions', {
        book_id: selectedBook.book_id,
        mood: selectedBook.genre, // Automatically use genre as mood label
        sound_theme: theme,
        duration_minutes: sessionForm.duration_minutes,
      });

      navigate(`/session/${response.data.session_id}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();

    try {
      await api.post('/books', newBookForm);
      toast.success('Book added!');
      setShowNewBook(false);
      setNewBookForm({ title: '', author: '', genre: 'Fiction', status: 'currently_reading' });
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

  // Get week dates for calendar strip
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
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A68A64] border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture pb-20 md:pb-0">
      <Navigation currentPage="dashboard" />

      <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Greeting */}
        <div className="mb-8 md:mb-12">
          <h1
            className="text-3xl md:text-5xl font-bold text-[#2C2A27] mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h1>
          <p className="text-[#6A645C] text-base md:text-lg" style={{ fontFamily: 'Lora, serif' }}>
            Ready to immerse yourself?
          </p>
        </div>

        {/* Streak & Week Calendar */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Flame className="w-6 h-6 text-[#A68A64]" />
            <div>
              <div className="text-2xl font-bold text-[#2C2A27]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {streak?.current_streak || 0} day{streak?.current_streak !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-[#6A645C]">Current streak</div>
            </div>
          </div>

          {/* Week Strip - Scrollable on mobile */}
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar w-full md:w-auto">
            {getWeekDates().map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const hasSession = hasSessionOnDate(date);
              return (
                <div
                  key={i}
                  className={`min-w-[44px] h-[44px] rounded-md flex flex-col items-center justify-center text-xs border ${hasSession
                    ? 'bg-[#A68A64] text-white border-[#A68A64]'
                    : isToday
                      ? 'bg-white text-[#2C2A27] border-[#A68A64]'
                      : 'bg-white text-[#9B948B] border-[#E8E3D9]'
                    }`}
                >
                  <div className="font-medium">{date.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Reading Card */}
        {continueBook && (
          <div className="card-paper p-6 md:p-8 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="text-sm text-[#6A645C] mb-2">Continue Reading</div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {continueBook.title}
                </h2>
                <p className="text-[#6A645C] mb-3 md:mb-4" style={{ fontFamily: 'Lora, serif' }}>
                  by {continueBook.author}
                </p>
                <div className="flex items-center space-x-4 text-sm text-[#9B948B] mb-4 md:mb-6">
                  <span>{continueBook.total_sessions} sessions</span>
                  <span>•</span>
                  <span>{continueBook.total_minutes} minutes</span>
                </div>
                <button
                  data-testid="continue-reading-btn"
                  onClick={handleContinueReading}
                  className="btn-paper-accent flex items-center justify-center space-x-2 w-full md:w-auto"
                >
                  <Play className="w-4 h-4" />
                  <span>Continue</span>
                </button>
              </div>
              {continueBook.cover_url && (
                <img
                  src={continueBook.cover_url}
                  alt={continueBook.title}
                  className="w-20 h-28 md:w-24 md:h-32 object-cover rounded-md border border-[#E8E3D9] self-center md:self-start"
                />
              )}
            </div>
          </div>
        )}

        {/* Start New Session */}
        <div className="card-paper p-6 md:p-8 mb-6 md:mb-8">
          <h3
            className="text-xl md:text-2xl font-bold text-[#2C2A27] mb-3 md:mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Start New Session
          </h3>
          <p className="text-[#6A645C] mb-4 md:mb-6" style={{ fontFamily: 'Lora, serif' }}>
            Choose a book and set the mood
          </p>
          <div className="flex flex-col md:flex-row gap-3 md:space-x-4">
            <button
              data-testid="new-session-btn"
              onClick={() => setShowNewSession(true)}
              className="btn-paper flex items-center justify-center space-x-2 w-full md:w-auto"
            >
              <BookOpen className="w-4 h-4" />
              <span>Choose Book</span>
            </button>
            <button
              data-testid="add-book-btn"
              onClick={() => setShowNewBook(true)}
              className="btn-paper flex items-center justify-center space-x-2 w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="card-paper p-5 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {books.length}
            </div>
            <div className="text-[#6A645C] text-sm">Books in library</div>
          </div>
          <div className="card-paper p-5 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-[#2C2A27] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {sessions.length}
            </div>
            <div className="text-[#6A645C] text-sm">Total sessions</div>
          </div>
        </div>

        {/* Quick Calendar Access */}
        <button
          data-testid="view-calendar-btn"
          onClick={() => navigate('/calendar')}
          className="w-full card-paper p-5 md:p-6 flex items-center justify-between active:border-[#A68A64] transition-colors"
        >
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-[#A68A64]" />
            <span className="text-[#2C2A27] font-medium">View Full Calendar</span>
          </div>
          <span className="text-[#9B948B]">→</span>
        </button>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="bg-white border-[#E8E3D9]" aria-describedby="session-dialog-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Start Reading Session</DialogTitle>
          </DialogHeader>
          <p id="session-dialog-description" className="sr-only">Choose a book, mood, and duration for your reading session</p>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#2C2A27]">Book</Label>
              <Select
                value={selectedBook?.book_id}
                onValueChange={(val) => setSelectedBook(books.find((b) => b.book_id === val))}
              >
                <SelectTrigger data-testid="book-select">
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {currentlyReading.map((book) => (
                    <SelectItem key={book.book_id} value={book.book_id}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#2C2A27]">Atmosphere</Label>
              <div className="p-3 bg-[#FBFBFB] border border-[#E8E3D9] rounded-md text-[#6A645C] text-sm italic">
                {selectedBook
                  ? `${selectedBook.genre} (Automatically matched)`
                  : 'Select a book to set atmosphere'}
              </div>
            </div>

            <div>
              <Label className="text-[#2C2A27]">Duration (minutes)</Label>
              <Select
                value={sessionForm.duration_minutes.toString()}
                onValueChange={(val) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(val) })}
              >
                <SelectTrigger data-testid="duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <SelectItem key={min} value={min.toString()}>
                      {min} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              data-testid="start-session-btn"
              onClick={handleStartSession}
              className="w-full btn-paper-accent py-3"
            >
              Start Session
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Book Dialog */}
      <Dialog open={showNewBook} onOpenChange={setShowNewBook}>
        <DialogContent className="bg-white border-[#E8E3D9]" aria-describedby="book-dialog-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add New Book</DialogTitle>
          </DialogHeader>
          <p id="book-dialog-description" className="sr-only">Add a new book to your library</p>
          <form onSubmit={handleCreateBook} className="space-y-4 mt-4">
            <div>
              <Label className="text-[#2C2A27]">Title</Label>
              <Input
                data-testid="book-title-input"
                value={newBookForm.title}
                onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Author</Label>
              <Input
                data-testid="book-author-input"
                value={newBookForm.author}
                onChange={(e) => setNewBookForm({ ...newBookForm, author: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Genre</Label>
              <Select
                value={newBookForm.genre}
                onValueChange={(val) => setNewBookForm({ ...newBookForm, genre: val })}
              >
                <SelectTrigger data-testid="book-genre-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRE_OPTIONS.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="submit"
              data-testid="save-book-btn"
              className="w-full btn-paper-accent py-3"
            >
              Add Book
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
