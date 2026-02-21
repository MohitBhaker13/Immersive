from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Request
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests
import json
from google import genai
from google.genai import types
from collections import defaultdict
import time
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import Google OAuth handler
try:
    from auth_google import google_oauth
    GOOGLE_OAUTH_ENABLED = bool(os.getenv('GOOGLE_CLIENT_ID'))
except ImportError:
    GOOGLE_OAUTH_ENABLED = False
    print("⚠️  Google OAuth not configured. Using Emergent managed auth only.")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    daily_goal_minutes: int = 30
    default_mood: str = "Focus"
    sound_enabled: bool = True
    reading_type: Optional[str] = None
    created_at: datetime

class SessionData(BaseModel):
    session_id: str

class Book(BaseModel):
    model_config = ConfigDict(extra="ignore")
    book_id: str
    user_id: str
    title: str
    author: str
    genre: str
    cover_url: Optional[str] = None
    status: str  # want_to_read, currently_reading, completed
    total_minutes: int = 0
    total_sessions: int = 0
    description: Optional[str] = None
    page_count: Optional[int] = None
    google_books_id: Optional[str] = None
    preferred_theme: Optional[str] = None
    created_at: datetime

class BookCreate(BaseModel):
    title: str
    author: str
    genre: Optional[str] = "General"
    cover_url: Optional[str] = None
    description: Optional[str] = None
    page_count: Optional[int] = None
    status: str = "want_to_read"
    google_books_id: Optional[str] = None
    preferred_theme: Optional[str] = None

class BookDiscovery(BaseModel):
    id: str
    title: str
    authors: List[str]
    description: Optional[str] = None
    cover_url: Optional[str] = None
    page_count: Optional[int] = None
    categories: List[str]
    published_date: Optional[str] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    genre: Optional[str] = None
    cover_url: Optional[str] = None
    status: Optional[str] = None
    preferred_theme: Optional[str] = None

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    book_id: str
    mood: str
    sound_theme: str
    duration_minutes: int
    actual_minutes: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    notes_count: int = 0

class SessionCreate(BaseModel):
    book_id: str
    mood: str
    sound_theme: str
    duration_minutes: int

class SessionComplete(BaseModel):
    actual_minutes: Optional[int] = None

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    note_id: str
    session_id: str
    book_id: str
    user_id: str
    content: str
    created_at: datetime

class NoteCreate(BaseModel):
    session_id: str
    book_id: str
    content: str

class Streak(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_active_date: Optional[str] = None

class OnboardingData(BaseModel):
    reading_type: str
    daily_goal_minutes: int
    default_mood: str
    sound_enabled: bool

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    book_id: str
    question: str
    history: List[ChatMessage] = []
    spoiler_unlocked: bool = False  # Sent from frontend spoiler lock toggle

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> dict:
    """Get user from session token (cookie or header)"""
    token = session_token
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/google")
async def google_login(request: Request, response: Response):
    """
    Google OAuth login - accepts Google ID token from frontend
    This is for standard Google OAuth (not Emergent managed)
    """
    if not GOOGLE_OAUTH_ENABLED:
        raise HTTPException(
            status_code=501, 
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment."
        )
    
    try:
        body = await request.json()
        id_token = body.get('token') or body.get('credential')
        
        if not id_token:
            raise HTTPException(status_code=400, detail="No token provided")
        
        # Verify Google token
        user_info = google_oauth.verify_token(id_token)
        
        if not user_info.get('email_verified'):
            raise HTTPException(status_code=400, detail="Email not verified")
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": user_info["email"]},
            {"_id": 0}
        )
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": user_info.get("name", existing_user.get("name")),
                    "picture": user_info.get("picture", existing_user.get("picture"))
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": user_info["email"],
                "name": user_info.get("name", ""),
                "picture": user_info.get("picture"),
                "daily_goal_minutes": 30,
                "default_mood": "Focus",
                "sound_enabled": True,
                "reading_type": None,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
            
            # Initialize streak
            await db.streaks.insert_one({
                "user_id": user_id,
                "current_streak": 0,
                "longest_streak": 0,
                "last_active_date": None
            })
        
        # Create session
        session_token = google_oauth.generate_session_token()
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": google_oauth.create_session_expiry(7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        # Get user data
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return {
            "user": user_doc,
            "session_token": session_token
        }
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logging.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.post("/auth/session")
async def exchange_session(session_data: SessionData, response: Response):
    """
    Emergent managed auth - Exchange session_id for user data and set cookie
    This maintains backwards compatibility with Emergent's authentication
    """
    try:
        # Call Emergent Auth API
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_data.session_id},
            timeout=10
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        auth_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": auth_data["email"]},
            {"_id": 0}
        )
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": auth_data.get("name", existing_user.get("name")),
                    "picture": auth_data.get("picture", existing_user.get("picture"))
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": auth_data["email"],
                "name": auth_data.get("name", ""),
                "picture": auth_data.get("picture"),
                "daily_goal_minutes": 30,
                "default_mood": "Focus",
                "sound_enabled": True,
                "reading_type": None,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
            
            # Initialize streak
            await db.streaks.insert_one({
                "user_id": user_id,
                "current_streak": 0,
                "longest_streak": 0,
                "last_active_date": None
            })
        
        # Store session
        session_token = auth_data["session_token"]
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        # Get updated user
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        return user_doc
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info"""
    user = await get_current_user(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}

@api_router.post("/auth/onboarding")
async def complete_onboarding(data: OnboardingData, request: Request, session_token: Optional[str] = Cookie(None)):
    """Complete user onboarding"""
    user = await get_current_user(request, session_token)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "reading_type": data.reading_type,
            "daily_goal_minutes": data.daily_goal_minutes,
            "default_mood": data.default_mood,
            "sound_enabled": data.sound_enabled
        }}
    )
    
    return {"message": "Onboarding complete"}

# ==================== BOOK ROUTES ====================

@api_router.get("/books", response_model=List[Book])
async def get_books(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get all books for current user"""
    user = await get_current_user(request, session_token)
    
    books = await db.books.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    for book in books:
        if isinstance(book.get("created_at"), str):
            book["created_at"] = datetime.fromisoformat(book["created_at"])
    
    return books

@api_router.post("/books", response_model=Book)
async def create_book(book_data: BookCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create a new book"""
    user = await get_current_user(request, session_token)
    
    book_id = f"book_{uuid.uuid4().hex[:12]}"
    new_book = {
        "book_id": book_id,
        "user_id": user["user_id"],
        "title": book_data.title,
        "author": book_data.author,
        "genre": book_data.genre or "General",
        "cover_url": book_data.cover_url,
        "description": book_data.description,
        "page_count": book_data.page_count,
        "status": book_data.status,
        "google_books_id": book_data.google_books_id,
        "preferred_theme": book_data.preferred_theme,
        "total_minutes": 0,
        "total_sessions": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.books.insert_one(new_book)
    return Book(**new_book)

@api_router.patch("/books/{book_id}", response_model=Book)
async def update_book(book_id: str, book_update: BookUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Partially update a book"""
    user = await get_current_user(request, session_token)
    
    update_data = {k: v for k, v in book_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db.books.update_one(
        {"book_id": book_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
        
    updated_book = await db.books.find_one({"book_id": book_id}, {"_id": 0})
    return Book(**updated_book)

@api_router.get("/books/search", response_model=List[BookDiscovery])
async def search_books(q: str):
    """Search for books using Google Books API"""
    if not q:
        return []
        
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=10"
        # Append API key if available for higher rate limits
        google_books_key = os.environ.get('GOOGLE_BOOKS_API_KEY', '')
        if google_books_key:
            url += f"&key={google_books_key}"
        response = requests.get(url, timeout=10)
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Google Books API rate limit reached. Please wait a moment and try again.")
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get("items", []):
            info = item.get("volumeInfo", {})
            
            # Sanitization logic
            description = info.get("description", "")
            if description:
                # Basic HTML strip
                import re
                description = re.sub('<[^<]+?>', '', description)
            
            # Best possible image
            images = info.get("imageLinks", {})
            cover_url = images.get("extraLarge") or images.get("large") or images.get("thumbnail")
            
            # Switch http to https for covers to avoid mixed content errors
            if cover_url and cover_url.startswith("http://"):
                cover_url = cover_url.replace("http://", "https://")
            
            results.append({
                "id": item.get("id"),
                "title": info.get("title", "Unknown Title"),
                "authors": info.get("authors", ["Unknown Author"]),
                "description": description[:500] if description else None,
                "cover_url": cover_url,
                "page_count": info.get("pageCount"),
                "categories": info.get("categories", ["General"]),
                "published_date": info.get("publishedDate")
            })
            
        return results
    except Exception as e:
        import traceback
        logging.error(f"Google Books API error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch books: {str(e)}")

@api_router.get("/books/{book_id}", response_model=Book)
async def get_book(book_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Get a specific book"""
    user = await get_current_user(request, session_token)
    
    book = await db.books.find_one(
        {"book_id": book_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if isinstance(book.get("created_at"), str):
        book["created_at"] = datetime.fromisoformat(book["created_at"])
    
    return book

@api_router.put("/books/{book_id}", response_model=Book)
async def update_book(book_id: str, book_update: BookUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Update a book"""
    user = await get_current_user(request, session_token)
    
    # Build update dict
    update_data = {k: v for k, v in book_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.books.update_one(
        {"book_id": book_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    updated_book = await db.books.find_one(
        {"book_id": book_id},
        {"_id": 0}
    )
    
    return Book(**updated_book)

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Delete a book"""
    user = await get_current_user(request, session_token)
    
    result = await db.books.delete_one({"book_id": book_id, "user_id": user["user_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return {"message": "Book deleted"}

# ==================== SESSION ROUTES ====================

@api_router.post("/sessions", response_model=Session)
async def start_session(session_data: SessionCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Start a reading session"""
    user = await get_current_user(request, session_token)
    
    # Verify book exists
    book = await db.books.find_one(
        {"book_id": session_data.book_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    new_session = {
        "session_id": session_id,
        "user_id": user["user_id"],
        "book_id": session_data.book_id,
        "mood": session_data.mood,
        "sound_theme": session_data.sound_theme,
        "duration_minutes": session_data.duration_minutes,
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "notes_count": 0
    }
    
    await db.sessions.insert_one(new_session)
    return Session(**new_session)

@api_router.post("/sessions/{session_id}/complete")
async def complete_session(session_id: str, completion: SessionComplete, request: Request, session_token: Optional[str] = Cookie(None)):
    """Complete a reading session"""
    user = await get_current_user(request, session_token)
    
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    ended_at = datetime.now(timezone.utc)
    
    # Calculate actual minutes spent from timestamps
    started_at = session["started_at"]
    if isinstance(started_at, str):
        started_at = datetime.fromisoformat(started_at)
    
    # Calculate difference in minutes
    time_diff = ended_at - started_at
    actual_minutes = max(1, round(time_diff.total_seconds() / 60))
    
    # If client specifically sent a value (e.g. from a client-side timer), use the smaller one to be conservative
    if completion.actual_minutes is not None:
        actual_minutes = min(actual_minutes, completion.actual_minutes)
    
    # Update session
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "ended_at": ended_at,
            "actual_minutes": actual_minutes
        }}
    )
    
    # Update book stats
    await db.books.update_one(
        {"book_id": session["book_id"]},
        {
            "$inc": {
                "total_minutes": actual_minutes,
                "total_sessions": 1
            },
            "$set": {"status": "currently_reading"}
        }
    )
    
    # Update streak
    today = datetime.now(timezone.utc).date().isoformat()
    streak = await db.streaks.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if streak:
        last_active = streak.get("last_active_date")
        current_streak = streak.get("current_streak", 0)
        longest_streak = streak.get("longest_streak", 0)
        
        if last_active == today:
            # Already logged today
            pass
        elif last_active:
            from datetime import date
            last_date = date.fromisoformat(last_active)
            today_date = date.fromisoformat(today)
            days_diff = (today_date - last_date).days
            
            if days_diff == 1:
                # Continue streak
                current_streak += 1
            else:
                # Reset streak
                current_streak = 1
        else:
            # First activity
            current_streak = 1
        
        longest_streak = max(longest_streak, current_streak)
        
        await db.streaks.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_active_date": today
            }}
        )
    
    return {"message": "Session completed", "minutes": actual_minutes}

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions(request: Request, session_token: Optional[str] = Cookie(None), book_id: Optional[str] = None):
    """Get sessions for current user"""
    user = await get_current_user(request, session_token)
    
    query = {"user_id": user["user_id"]}
    if book_id:
        query["book_id"] = book_id
    
    sessions = await db.sessions.find(query, {"_id": 0}).sort("started_at", -1).to_list(1000)
    
    for session in sessions:
        if isinstance(session.get("started_at"), str):
            session["started_at"] = datetime.fromisoformat(session["started_at"])
        if session.get("ended_at") and isinstance(session["ended_at"], str):
            session["ended_at"] = datetime.fromisoformat(session["ended_at"])
    
    return sessions

# ==================== NOTE ROUTES ====================

@api_router.post("/notes", response_model=Note)
async def create_note(note_data: NoteCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Create a note"""
    user = await get_current_user(request, session_token)
    
    note_id = f"note_{uuid.uuid4().hex[:12]}"
    new_note = {
        "note_id": note_id,
        "session_id": note_data.session_id,
        "book_id": note_data.book_id,
        "user_id": user["user_id"],
        "content": note_data.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.notes.insert_one(new_note)
    
    # Update session notes count
    await db.sessions.update_one(
        {"session_id": note_data.session_id},
        {"$inc": {"notes_count": 1}}
    )
    
    return Note(**new_note)

@api_router.get("/notes", response_model=List[Note])
async def get_notes(request: Request, session_token: Optional[str] = Cookie(None), book_id: Optional[str] = None):
    """Get notes for current user"""
    user = await get_current_user(request, session_token)
    
    query = {"user_id": user["user_id"]}
    if book_id:
        query["book_id"] = book_id
    
    notes = await db.notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for note in notes:
        if isinstance(note.get("created_at"), str):
            note["created_at"] = datetime.fromisoformat(note["created_at"])
    
    return notes

# ==================== STREAK ROUTES ====================

@api_router.get("/streak", response_model=Streak)
async def get_streak(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get user's reading streak"""
    user = await get_current_user(request, session_token)
    
    streak = await db.streaks.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if not streak:
        # Initialize if doesn't exist
        new_streak = {
            "user_id": user["user_id"],
            "current_streak": 0,
            "longest_streak": 0,
            "last_active_date": None
        }
        await db.streaks.insert_one(new_streak)
        return Streak(**new_streak)
    
    return Streak(**streak)

# ==================== CALENDAR ROUTES ====================

@api_router.get("/calendar")
async def get_calendar(request: Request, session_token: Optional[str] = Cookie(None), year: int = None, month: int = None):
    """Get reading activity calendar"""
    user = await get_current_user(request, session_token)
    
    # Get all completed sessions
    sessions = await db.sessions.find(
        {"user_id": user["user_id"], "ended_at": {"$ne": None}},
        {"_id": 0, "started_at": 1, "ended_at": 1, "duration_minutes": 1, "actual_minutes": 1}
    ).to_list(10000)
    
    # Aggregate by date
    calendar_data = {}
    for session in sessions:
        started_at = session.get("started_at")
        ended_at = session.get("ended_at")
        
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at)
        if isinstance(ended_at, str):
            ended_at = datetime.fromisoformat(ended_at)
        
        date_key = started_at.date().isoformat()
        
        if date_key not in calendar_data:
            calendar_data[date_key] = {"sessions": 0, "minutes": 0}
        
        calendar_data[date_key]["sessions"] += 1
        
        # Calculate minutes spent from timestamps (most accurate)
        if started_at and ended_at:
            delta = ended_at - started_at
            # Use actual_minutes field if it exists, otherwise use calculated delta
            # Cap it at duration_minutes + 5 to avoid outliers if server was sleeping
            calc_minutes = round(delta.total_seconds() / 60)
            session_total = session.get("actual_minutes", calc_minutes)
            
            # Capping logic to ensure we don't over-report due to server time drift
            planned = session.get("duration_minutes", 30)
            actual = min(session_total, planned)
            
            calendar_data[date_key]["minutes"] += max(1, actual)
        else:
            calendar_data[date_key]["minutes"] += session.get("duration_minutes", 0)
    
    return calendar_data

# ==================== CHAT / BOOK COMPANION ROUTES ====================

# Initialize Gemini client
gemini_api_key = os.environ.get('GEMINI_API_KEY', '')
gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key and gemini_api_key != 'your-gemini-api-key-here' else None

# --- Chat Guardrails ---

# Per-user rate limiting (in-memory)
_chat_rate_limit = defaultdict(list)  # user_id -> [timestamps]
CHAT_RATE_LIMIT = 20       # max requests
CHAT_RATE_WINDOW = 300     # per 5 minutes
MAX_HISTORY = 20           # cap conversation history
MAX_QUESTION_LENGTH = 500  # max user input length

def check_chat_rate_limit(user_id: str):
    """Simple sliding-window rate limiter for the chat endpoint."""
    now = time.time()
    _chat_rate_limit[user_id] = [
        t for t in _chat_rate_limit[user_id] if now - t < CHAT_RATE_WINDOW
    ]
    if len(_chat_rate_limit[user_id]) >= CHAT_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="You've sent too many messages. Please wait a few minutes."
        )
    _chat_rate_limit[user_id].append(now)

def is_post_cutoff_book(book: dict) -> bool:
    """Heuristic: flag books published after the model's training cutoff (2024+)."""
    pub_date = book.get("published_date") or ""
    if not pub_date:
        return False
    try:
        year = int(pub_date[:4])
        return year >= 2025
    except (ValueError, IndexError):
        return False

def fetch_book_context_sync(book: dict) -> str:
    """
    Fetch extended metadata from Google Books API to inject as grounding context.
    Only called for books flagged as potentially unknown.
    """
    google_id = book.get("google_books_id")
    if not google_id:
        return ""
    try:
        url = f"https://www.googleapis.com/books/v1/volumes/{google_id}"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return ""
        data = resp.json()
        info = data.get("volumeInfo", {})

        desc = info.get("description", "")
        if desc:
            desc = re.sub('<[^<]+?>', '', desc)  # strip HTML

        context_parts = []
        if desc:
            context_parts.append(f"Full Description: {desc[:2000]}")
        if info.get("categories"):
            context_parts.append(f"Categories: {', '.join(info['categories'])}")
        if info.get("publishedDate"):
            context_parts.append(f"Published: {info['publishedDate']}")
        if info.get("publisher"):
            context_parts.append(f"Publisher: {info['publisher']}")
        if info.get("pageCount"):
            context_parts.append(f"Pages: {info['pageCount']}")
        return "\n".join(context_parts)
    except Exception:
        return ""

# Chat safety settings — permissive for literary discussion
CHAT_SAFETY_SETTINGS = [
    types.SafetySetting(
        category="HARM_CATEGORY_HATE_SPEECH",
        threshold="BLOCK_ONLY_HIGH",
    ),
    types.SafetySetting(
        category="HARM_CATEGORY_HARASSMENT",
        threshold="BLOCK_ONLY_HIGH",
    ),
    types.SafetySetting(
        category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold="BLOCK_ONLY_HIGH",
    ),
    types.SafetySetting(
        category="HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold="BLOCK_ONLY_HIGH",
    ),
]

@api_router.post("/chat")
async def chat_with_book(chat_req: ChatRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    """AI-powered book companion chat — streams responses via SSE"""
    user = await get_current_user(request, session_token)

    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI chat not configured. Please set GEMINI_API_KEY in .env")

    # --- Guardrail: Per-user rate limiting ---
    check_chat_rate_limit(user["user_id"])

    # --- Guardrail: Input sanitization ---
    question = chat_req.question.strip()[:MAX_QUESTION_LENGTH]
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Fetch book metadata
    book = await db.books.find_one(
        {"book_id": chat_req.book_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # --- Guardrail: Read spoiler toggle state ---
    spoiler_unlocked = chat_req.spoiler_unlocked

    # --- Build hardened system prompt ---
    spoiler_rule = (
        'OFF — the user has unlocked spoilers. You may discuss the full plot freely, '
        'including endings, deaths, betrayals, and twists.'
        if spoiler_unlocked
        else
        'ON (default). Follow these rules:\n'
        '   - If asked "Who is [Character]?", describe their introduction and role only.\n'
        '   - Do NOT reveal deaths, betrayals, or ending twists.\n'
        '   - If a question requires spoiler information to answer properly, respond: '
        '"That would involve spoilers! You can toggle the \U0001f513 Spoiler Lock off '
        'in the chat header to unlock full details."\n'
        '   - If unsure whether info is a spoiler, err on the side of caution.'
    )

    system_prompt = (
        f'Role: Literary Assistant for "{book["title"]}" by {book["author"]}.\n'
        f'Genre: {book.get("genre", "General")}.\n'
        f'Description: {book.get("description", "No description available.")}.\n'
        f'Context: The user is currently reading this book physically.\n'
        f'Goal: Provide context on characters, plot points, and themes '
        f'based on verified literary data.\n\n'

        'Operational Rules:\n'
        '1. HALLUCINATION GUARD: If a detail is not part of the widely accepted '
        f'plot or character summary of "{book["title"]}", state: '
        '"I don\'t have enough specific detail in my records to confirm that. '
        'You might find the answer in your current chapters." '
        'Do NOT invent plot points, character relationships, or quotes.\n\n'

        f'2. SPOILER MANAGEMENT: Spoiler lock is currently {spoiler_rule}\n\n'

        '3. CONCISENESS: Maximum 2 paragraphs. No conversational filler '
        '(e.g., "I\'d be happy to help", "Great question!").\n\n'

        '4. FORMATTING: Use **bold** for character names and *italics* for book '
        'titles. Use bullet points for lists of traits or events.\n\n'

        '5. SCOPE: If the user asks about topics unrelated to '
        f'"{book["title"]}" or literature, respond: '
        f'"I am currently focused on your reading of *{book["title"]}*. '
        'How can I help with the story?"\n\n'

        '6. UNCERTAINTY: When you are not confident about a specific detail, '
        'explicitly say so. Never present uncertain information as fact.'
    )

    # --- Guardrail: Unknown book detection + context injection ---
    is_potentially_unknown = (
        not book.get("google_books_id")
        and not book.get("description")
    )

    if is_potentially_unknown:
        system_prompt += (
            '\n\n7. LOW-CONFIDENCE MODE: This book may not be in your training data. '
            'Be extra cautious. Preface answers with "Based on what I know..." '
            'and recommend the user verify details in their copy.'
        )
        # Long Context Injection — fetch rich metadata from Google Books
        extra_context = fetch_book_context_sync(book)
        if extra_context:
            system_prompt += (
                f'\n\nVERIFIED BOOK DATA (from Google Books — use this as ground truth):\n'
                f'{extra_context}'
            )

    # --- Guardrail: Google Search Grounding for post-cutoff books ---
    tools = None
    if is_post_cutoff_book(book):
        tools = [types.Tool(google_search=types.GoogleSearch())]
        system_prompt += (
            '\n\n8. SEARCH-GROUNDED MODE: This book was published recently. '
            'Use the Google Search tool to verify facts before answering. '
            'Cite sources when referencing reviews or summaries found online.'
        )
        logging.info(f"Chat: Google Search Grounding enabled for post-cutoff book '{book['title']}'")

    # --- Guardrail: Cap conversation history ---
    trimmed_history = chat_req.history[-MAX_HISTORY:]

    # Build conversation for Gemini
    contents = []
    for msg in trimmed_history:
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}]
        })
    contents.append({
        "role": "user",
        "parts": [{"text": question}]
    })

    # Build model config
    gen_config = {
        "system_instruction": system_prompt,
        "temperature": 0.1,
        "max_output_tokens": 2048,
        "safety_settings": CHAT_SAFETY_SETTINGS,
    }
    if tools:
        gen_config["tools"] = tools

    async def generate_stream():
        try:
            response = gemini_client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
                config=gen_config,
            )
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            error_msg = str(e)
            logging.error(f"Gemini API error: {error_msg}")
            # Give user-friendly error messages
            if '429' in error_msg or 'RESOURCE_EXHAUSTED' in error_msg:
                friendly = "The AI is taking a short break (rate limit reached). Please wait a moment and try again."
            elif '403' in error_msg or 'PERMISSION_DENIED' in error_msg:
                friendly = "The AI key doesn't have permission. Please check your Gemini API key."
            elif '400' in error_msg or 'INVALID_ARGUMENT' in error_msg:
                friendly = "Something went wrong with the request. Please try a different question."
            else:
                friendly = f"Something went wrong: {error_msg[:150]}"
            yield f"data: {json.dumps({'error': friendly})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()