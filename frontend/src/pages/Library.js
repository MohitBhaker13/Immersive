import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, FileText, Edit, Trash2, Plus, StickyNote, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENRE_OPTIONS } from '@/utils/constants';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('currently_reading');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    genre: 'Fiction',
    cover_url: '',
    status: 'want_to_read',
  });
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedBookForNotes, setSelectedBookForNotes] = useState(null);
  const [bookNotes, setBookNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to load books:', error);
      toast.error('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = (status) => {
    return books.filter((b) => b.status === status);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/books', bookForm);
      setBooks([...books, response.data]);
      toast.success('Book added successfully');
      setShowAddDialog(false);
      setBookForm({
        title: '',
        author: '',
        genre: 'Fiction',
        cover_url: '',
        status: 'want_to_read',
      });
    } catch (error) {
      console.error('Failed to add book:', error);
      toast.error('Failed to add book');
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        title: bookForm.title,
        author: bookForm.author,
        genre: bookForm.genre,
        cover_url: bookForm.cover_url,
        status: bookForm.status,
      };

      const response = await api.put(`/books/${editingBook.book_id}`, updateData);

      // Update books list with edited book
      setBooks(books.map(b => b.book_id === editingBook.book_id ? response.data : b));

      toast.success('Book updated successfully');
      setShowEditDialog(false);
      setEditingBook(null);
      setBookForm({
        title: '',
        author: '',
        genre: 'Fiction',
        cover_url: '',
        status: 'want_to_read',
      });
    } catch (error) {
      console.error('Failed to update book:', error);
      toast.error('Failed to update book');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await api.delete(`/books/${bookId}`);
      setBooks(books.filter(b => b.book_id !== bookId));
      toast.success('Book deleted successfully');
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Failed to delete book');
    }
  };

  const handleMoveBook = async (book, newStatus) => {
    try {
      const response = await api.put(`/books/${book.book_id}`, { status: newStatus });

      // Update books list
      setBooks(books.map(b => b.book_id === book.book_id ? response.data : b));

      toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to move book:', error);
      toast.error('Failed to move book');
    }
  };

  const openEditDialog = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      cover_url: book.cover_url || '',
      status: book.status,
    });
    setShowEditDialog(true);
  };

  const handleViewNotes = async (book) => {
    setSelectedBookForNotes(book);
    setShowNotesDialog(true);
    setNotesLoading(true);
    try {
      const response = await api.get(`/notes?book_id=${book.book_id}`);
      setBookNotes(response.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const openAddDialog = () => {
    setBookForm({
      title: '',
      author: '',
      genre: 'Fiction',
      cover_url: '',
      status: activeTab, // Set to current tab
    });
    setShowAddDialog(true);
  };

  const BookCard = ({ book }) => (
    <div className="card-paper p-5 md:p-6 active:border-[#A68A64] transition-colors">
      <div className="flex items-start space-x-4">
        <div className="w-14 h-20 md:w-16 md:h-24 bg-[#F4F1EA] rounded border border-[#E8E3D9] flex items-center justify-center flex-shrink-0">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded" />
          ) : (
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-[#9B948B]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg md:text-xl font-bold text-[#2C2A27] mb-1 truncate"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {book.title}
          </h3>
          <p className="text-[#6A645C] mb-2 md:mb-3 text-sm md:text-base truncate" style={{ fontFamily: 'Lora, serif' }}>
            by {book.author}
          </p>
          <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-[#9B948B] mb-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>{book.total_minutes || 0}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span>{book.total_sessions || 0}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-1 bg-[#F8F6F1] text-[#6A645C] rounded">
              {book.genre}
            </span>
            <div className="flex items-center space-x-2">
              <button
                data-testid={`view-notes-${book.book_id}-btn`}
                onClick={() => handleViewNotes(book)}
                className="p-2 text-[#6A645C] active:text-[#A68A64] rounded-md active:bg-[#F8F6F1] transition-colors"
                title="View notes"
              >
                <StickyNote className="w-4 h-4" />
              </button>
              <button
                data-testid={`edit-book-${book.book_id}-btn`}
                onClick={() => openEditDialog(book)}
                className="p-2 text-[#6A645C] active:text-[#A68A64] rounded-md active:bg-[#F8F6F1] transition-colors"
                title="Edit book"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                data-testid={`delete-book-${book.book_id}-btn`}
                onClick={() => handleDeleteBook(book.book_id)}
                className="p-2 text-[#6A645C] active:text-red-600 rounded-md active:bg-[#F8F6F1] transition-colors"
                title="Delete book"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Move Buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {book.status !== 'want_to_read' && (
              <button
                data-testid={`move-to-want-${book.book_id}-btn`}
                onClick={() => handleMoveBook(book, 'want_to_read')}
                className="text-xs px-3 py-1.5 border border-[#E8E3D9] rounded-md text-[#6A645C] active:border-[#A68A64] active:text-[#A68A64] transition-colors"
              >
                Move to Want to Read
              </button>
            )}
            {book.status !== 'currently_reading' && (
              <button
                data-testid={`move-to-reading-${book.book_id}-btn`}
                onClick={() => handleMoveBook(book, 'currently_reading')}
                className="text-xs px-3 py-1.5 border border-[#E8E3D9] rounded-md text-[#6A645C] active:border-[#A68A64] active:text-[#A68A64] transition-colors"
              >
                Move to Reading
              </button>
            )}
            {book.status !== 'completed' && (
              <button
                data-testid={`move-to-completed-${book.book_id}-btn`}
                onClick={() => handleMoveBook(book, 'completed')}
                className="text-xs px-3 py-1.5 border border-[#E8E3D9] rounded-md text-[#6A645C] active:border-[#A68A64] active:text-[#A68A64] transition-colors"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navigation currentPage="library" />
        <div className="max-w-[920px] mx-auto px-4 md:px-8 py-6 md:py-12">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="skeleton h-10 w-40"></div>
            <div className="skeleton h-10 w-28 rounded-md"></div>
          </div>
          <div className="skeleton h-12 w-full mb-6 md:mb-8 rounded-md"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-paper p-5 md:p-6">
                <div className="flex items-start space-x-4">
                  <div className="skeleton w-14 h-20 md:w-16 md:h-24 rounded"></div>
                  <div className="flex-1">
                    <div className="skeleton h-6 w-48 mb-2"></div>
                    <div className="skeleton h-4 w-32 mb-3"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture pb-20 md:pb-0">
      <Navigation currentPage="library" />

      <div className="max-w-[920px] mx-auto px-4 md:px-8 py-6 md:py-12 page-enter">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <h1
            className="text-3xl md:text-5xl font-bold text-[#2C2A27]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Library
          </h1>
          <button
            data-testid="add-book-library-btn"
            onClick={openAddDialog}
            className="btn-paper-accent flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Book</span>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-[#E8E3D9] mb-6 md:mb-8 w-full grid grid-cols-3 h-auto">
            <TabsTrigger
              value="want_to_read"
              data-testid="tab-want-to-read"
              className="data-[state=active]:bg-[#F8F6F1] data-[state=active]:text-[#A68A64] text-xs md:text-sm py-3"
            >
              <span className="hidden md:inline">Want to Read</span>
              <span className="md:hidden">Want</span> ({filterBooks('want_to_read').length})
            </TabsTrigger>
            <TabsTrigger
              value="currently_reading"
              data-testid="tab-currently-reading"
              className="data-[state=active]:bg-[#F8F6F1] data-[state=active]:text-[#A68A64] text-xs md:text-sm py-3"
            >
              <span className="hidden md:inline">Currently Reading</span>
              <span className="md:hidden">Reading</span> ({filterBooks('currently_reading').length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              data-testid="tab-completed"
              className="data-[state=active]:bg-[#F8F6F1] data-[state=active]:text-[#A68A64] text-xs md:text-sm py-3"
            >
              Completed ({filterBooks('completed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="want_to_read" data-testid="want-to-read-list">
            <div className="space-y-4">
              {filterBooks('want_to_read').length === 0 ? (
                <div className="text-center py-16 text-[#9B948B]" style={{ fontFamily: 'Lora, serif' }}>
                  No books in your want to read list
                </div>
              ) : (
                filterBooks('want_to_read').map((book) => <BookCard key={book.book_id} book={book} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="currently_reading" data-testid="currently-reading-list">
            <div className="space-y-4">
              {filterBooks('currently_reading').length === 0 ? (
                <div className="text-center py-16 text-[#9B948B]" style={{ fontFamily: 'Lora, serif' }}>
                  No books currently being read
                </div>
              ) : (
                filterBooks('currently_reading').map((book) => <BookCard key={book.book_id} book={book} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" data-testid="completed-list">
            <div className="space-y-4">
              {filterBooks('completed').length === 0 ? (
                <div className="text-center py-16 text-[#9B948B]" style={{ fontFamily: 'Lora, serif' }}>
                  No completed books yet
                </div>
              ) : (
                filterBooks('completed').map((book) => <BookCard key={book.book_id} book={book} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Book Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-md" aria-describedby="add-book-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add New Book</DialogTitle>
          </DialogHeader>
          <p id="add-book-description" className="sr-only">Add a new book to your library</p>
          <form onSubmit={handleAddBook} className="space-y-4 mt-4">
            <div>
              <Label className="text-[#2C2A27]">Title *</Label>
              <Input
                data-testid="add-book-title-input"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Author *</Label>
              <Input
                data-testid="add-book-author-input"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
                placeholder="Enter author name"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Genre</Label>
              <Select
                value={bookForm.genre}
                onValueChange={(val) => setBookForm({ ...bookForm, genre: val })}
              >
                <SelectTrigger data-testid="add-book-genre-select" className="bg-white border-[#E8E3D9]">
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

            <div>
              <Label className="text-[#2C2A27]">Cover URL (optional)</Label>
              <Input
                data-testid="add-book-cover-input"
                value={bookForm.cover_url}
                onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })}
                className="bg-white border-[#E8E3D9]"
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Status</Label>
              <Select
                value={bookForm.status}
                onValueChange={(val) => setBookForm({ ...bookForm, status: val })}
              >
                <SelectTrigger data-testid="add-book-status-select" className="bg-white border-[#E8E3D9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_read">Want to Read</SelectItem>
                  <SelectItem value="currently_reading">Currently Reading</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              type="submit"
              data-testid="submit-add-book-btn"
              className="w-full btn-paper-accent py-3"
            >
              Add Book
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-md" aria-describedby="edit-book-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Edit Book</DialogTitle>
          </DialogHeader>
          <p id="edit-book-description" className="sr-only">Edit book details</p>
          <form onSubmit={handleEditBook} className="space-y-4 mt-4">
            <div>
              <Label className="text-[#2C2A27]">Title *</Label>
              <Input
                data-testid="edit-book-title-input"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Author *</Label>
              <Input
                data-testid="edit-book-author-input"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                required
                className="bg-white border-[#E8E3D9]"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Genre</Label>
              <Select
                value={bookForm.genre}
                onValueChange={(val) => setBookForm({ ...bookForm, genre: val })}
              >
                <SelectTrigger data-testid="edit-book-genre-select" className="bg-white border-[#E8E3D9]">
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

            <div>
              <Label className="text-[#2C2A27]">Cover URL (optional)</Label>
              <Input
                data-testid="edit-book-cover-input"
                value={bookForm.cover_url}
                onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })}
                className="bg-white border-[#E8E3D9]"
              />
            </div>

            <div>
              <Label className="text-[#2C2A27]">Status</Label>
              <Select
                value={bookForm.status}
                onValueChange={(val) => setBookForm({ ...bookForm, status: val })}
              >
                <SelectTrigger data-testid="edit-book-status-select" className="bg-white border-[#E8E3D9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_read">Want to Read</SelectItem>
                  <SelectItem value="currently_reading">Currently Reading</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowEditDialog(false)}
                className="flex-1 btn-paper py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-edit-book-btn"
                className="flex-1 btn-paper-accent py-3"
              >
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* View Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="view-notes-description">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Notes: {selectedBookForNotes?.title}
            </DialogTitle>
          </DialogHeader>
          <p id="view-notes-description" className="sr-only">View all notes for this book</p>

          <div className="mt-4 space-y-6">
            {notesLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#A68A64] border-r-transparent"></div>
              </div>
            ) : bookNotes.length === 0 ? (
              <div className="text-center py-12 text-[#9B948B]" style={{ fontFamily: 'Lora, serif' }}>
                No notes found for this book.
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {bookNotes.map((note) => (
                  <div key={note.note_id} className="border-l-2 border-[#A68A64] pl-4 py-1">
                    <p className="text-[#2C2A27] text-base leading-relaxed mb-2" style={{ fontFamily: 'Lora, serif' }}>
                      {note.content}
                    </p>
                    <div className="text-xs text-[#9B948B] flex items-center space-x-2">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{new Date(note.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;