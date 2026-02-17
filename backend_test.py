#!/usr/bin/env python3
"""
Backend API Testing for Immersive Reading Sessions
Tests all CRUD operations and audio-related session functionality
"""

import requests
import sys
import json
from datetime import datetime

class ImmersiveReadingAPITester:
    def __init__(self, base_url="https://immersive-lit.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1771272357753"  # From auth setup
        self.user_id = "test-user-1771272357753"
        self.tests_run = 0
        self.tests_passed = 0
        self.book_id = None
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth header
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth(self):
        """Test authentication"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and response.get('user_id') == self.user_id:
            print(f"✅ Auth working - User ID: {response.get('user_id')}")
            return True
        else:
            print("❌ Auth failed")
            return False

    def test_books_crud(self):
        """Test book CRUD operations"""
        print("\n" + "="*50)
        print("TESTING BOOKS CRUD")
        print("="*50)
        
        # Create book
        book_data = {
            "title": "Test Audio Book",
            "author": "Test Author",
            "genre": "Fiction",
            "status": "want_to_read"
        }
        
        success, response = self.run_test(
            "Create Book",
            "POST",
            "books",
            200,
            data=book_data
        )
        
        if success and response.get('book_id'):
            self.book_id = response['book_id']
            print(f"✅ Book created with ID: {self.book_id}")
        else:
            print("❌ Failed to create book")
            return False
            
        # Get books
        success, response = self.run_test(
            "Get Books",
            "GET",
            "books",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"✅ Retrieved {len(response)} books")
        else:
            print("❌ Failed to get books")
            return False
            
        # Get specific book
        success, response = self.run_test(
            "Get Specific Book",
            "GET",
            f"books/{self.book_id}",
            200
        )
        
        if success and response.get('book_id') == self.book_id:
            print(f"✅ Retrieved specific book: {response.get('title')}")
        else:
            print("❌ Failed to get specific book")
            return False
            
        return True

    def test_sessions_with_audio(self):
        """Test session creation with different audio themes"""
        print("\n" + "="*50)
        print("TESTING AUDIO SESSIONS")
        print("="*50)
        
        if not self.book_id:
            print("❌ No book ID available for session testing")
            return False
            
        # Test different mood themes
        audio_themes = [
            {"mood": "Focus", "sound_theme": "Focus"},
            {"mood": "Calm", "sound_theme": "Calm"},
            {"mood": "Cozy", "sound_theme": "Cozy"},
            {"mood": "Epic", "sound_theme": "Epic"},
            {"mood": "Horror", "sound_theme": "Horror"},
            {"mood": "Romance", "sound_theme": "Romance"},
            {"mood": "Thriller", "sound_theme": "Thriller"}
        ]
        
        for theme in audio_themes:
            session_data = {
                "book_id": self.book_id,
                "mood": theme["mood"],
                "sound_theme": theme["sound_theme"],
                "duration_minutes": 25
            }
            
            success, response = self.run_test(
                f"Create {theme['mood']} Session",
                "POST",
                "sessions",
                200,
                data=session_data
            )
            
            if success and response.get('session_id'):
                if not self.session_id:  # Keep first session for further testing
                    self.session_id = response['session_id']
                print(f"✅ {theme['mood']} session created: {response['session_id']}")
            else:
                print(f"❌ Failed to create {theme['mood']} session")
                return False
                
        return True

    def test_session_completion(self):
        """Test session completion"""
        print("\n" + "="*50)
        print("TESTING SESSION COMPLETION")
        print("="*50)
        
        if not self.session_id:
            print("❌ No session ID available for completion testing")
            return False
            
        completion_data = {
            "actual_minutes": 20
        }
        
        success, response = self.run_test(
            "Complete Session",
            "POST",
            f"sessions/{self.session_id}/complete",
            200,
            data=completion_data
        )
        
        if success:
            print(f"✅ Session completed successfully")
            return True
        else:
            print("❌ Failed to complete session")
            return False

    def test_notes(self):
        """Test note creation"""
        print("\n" + "="*50)
        print("TESTING NOTES")
        print("="*50)
        
        if not self.session_id or not self.book_id:
            print("❌ Missing session_id or book_id for note testing")
            return False
            
        note_data = {
            "session_id": self.session_id,
            "book_id": self.book_id,
            "content": "This is a test note about the audio experience during reading."
        }
        
        success, response = self.run_test(
            "Create Note",
            "POST",
            "notes",
            200,
            data=note_data
        )
        
        if success and response.get('note_id'):
            print(f"✅ Note created: {response['note_id']}")
        else:
            print("❌ Failed to create note")
            return False
            
        # Get notes
        success, response = self.run_test(
            "Get Notes",
            "GET",
            f"notes?book_id={self.book_id}",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"✅ Retrieved {len(response)} notes")
            return True
        else:
            print("❌ Failed to get notes")
            return False

    def test_streak_and_calendar(self):
        """Test streak and calendar endpoints"""
        print("\n" + "="*50)
        print("TESTING STREAK & CALENDAR")
        print("="*50)
        
        # Test streak
        success, response = self.run_test(
            "Get Streak",
            "GET",
            "streak",
            200
        )
        
        if success:
            print(f"✅ Streak data retrieved: {response}")
        else:
            print("❌ Failed to get streak")
            return False
            
        # Test calendar
        success, response = self.run_test(
            "Get Calendar",
            "GET",
            "calendar",
            200
        )
        
        if success:
            print(f"✅ Calendar data retrieved")
            return True
        else:
            print("❌ Failed to get calendar")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Immersive Reading API Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"Session Token: {self.session_token}")
        
        # Run test suites
        auth_ok = self.test_auth()
        if not auth_ok:
            print("\n❌ Authentication failed - stopping tests")
            return 1
            
        books_ok = self.test_books_crud()
        sessions_ok = self.test_sessions_with_audio()
        completion_ok = self.test_session_completion()
        notes_ok = self.test_notes()
        streak_ok = self.test_streak_and_calendar()
        
        # Print results
        print("\n" + "="*50)
        print("TEST RESULTS")
        print("="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if auth_ok:
            print("✅ Authentication: PASSED")
        else:
            print("❌ Authentication: FAILED")
            
        if books_ok:
            print("✅ Books CRUD: PASSED")
        else:
            print("❌ Books CRUD: FAILED")
            
        if sessions_ok:
            print("✅ Audio Sessions: PASSED")
        else:
            print("❌ Audio Sessions: FAILED")
            
        if completion_ok:
            print("✅ Session Completion: PASSED")
        else:
            print("❌ Session Completion: FAILED")
            
        if notes_ok:
            print("✅ Notes: PASSED")
        else:
            print("❌ Notes: FAILED")
            
        if streak_ok:
            print("✅ Streak & Calendar: PASSED")
        else:
            print("❌ Streak & Calendar: FAILED")
        
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = ImmersiveReadingAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())