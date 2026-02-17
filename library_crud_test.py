import requests
import sys
from datetime import datetime
import json

class LibraryAPITester:
    def __init__(self, base_url="https://immersive-lit.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = "test_session_1771271641101"  # From auth setup
        self.tests_run = 0
        self.tests_passed = 0
        self.created_books = []  # Track created books for cleanup

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth(self):
        """Test authentication"""
        success, response = self.run_test(
            "Authentication",
            "GET",
            "auth/me",
            200
        )
        if success:
            print(f"   User: {response.get('name', 'Unknown')}")
            return True
        return False

    def test_get_books_empty(self):
        """Test getting books (should be empty initially)"""
        success, response = self.run_test(
            "Get Books (Empty)",
            "GET",
            "books",
            200
        )
        if success:
            print(f"   Found {len(response)} books")
            return True
        return False

    def test_create_book(self, title, author, genre, status="want_to_read", cover_url=None):
        """Create a book and return book_id if successful"""
        book_data = {
            "title": title,
            "author": author,
            "genre": genre,
            "status": status
        }
        if cover_url:
            book_data["cover_url"] = cover_url

        success, response = self.run_test(
            f"Create Book: {title}",
            "POST",
            "books",
            200,
            data=book_data
        )
        
        if success and 'book_id' in response:
            book_id = response['book_id']
            self.created_books.append(book_id)
            print(f"   Created book with ID: {book_id}")
            print(f"   Status: {response.get('status')}")
            return book_id
        return None

    def test_get_book(self, book_id):
        """Get a specific book by ID"""
        success, response = self.run_test(
            f"Get Book {book_id}",
            "GET",
            f"books/{book_id}",
            200
        )
        if success:
            print(f"   Title: {response.get('title')}")
            print(f"   Status: {response.get('status')}")
            return response
        return None

    def test_update_book(self, book_id, update_data):
        """Update a book"""
        success, response = self.run_test(
            f"Update Book {book_id}",
            "PUT",
            f"books/{book_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Updated title: {response.get('title')}")
            print(f"   Updated status: {response.get('status')}")
            return response
        return None

    def test_delete_book(self, book_id):
        """Delete a book"""
        success, response = self.run_test(
            f"Delete Book {book_id}",
            "DELETE",
            f"books/{book_id}",
            200
        )
        if success:
            # Remove from tracking list
            if book_id in self.created_books:
                self.created_books.remove(book_id)
            return True
        return False

    def test_get_books_with_data(self):
        """Test getting books when there should be data"""
        success, response = self.run_test(
            "Get Books (With Data)",
            "GET",
            "books",
            200
        )
        if success:
            print(f"   Found {len(response)} books")
            for book in response:
                print(f"   - {book.get('title')} by {book.get('author')} ({book.get('status')})")
            return response
        return []

    def cleanup_books(self):
        """Clean up any remaining test books"""
        print(f"\n🧹 Cleaning up {len(self.created_books)} test books...")
        for book_id in self.created_books[:]:  # Copy list to avoid modification during iteration
            self.test_delete_book(book_id)

def main():
    print("🚀 Starting Library CRUD API Tests")
    print("=" * 50)
    
    tester = LibraryAPITester()
    
    try:
        # Test 1: Authentication
        if not tester.test_auth():
            print("❌ Authentication failed, stopping tests")
            return 1

        # Test 2: Get empty books list
        tester.test_get_books_empty()

        # Test 3: Create books in different statuses
        book1_id = tester.test_create_book(
            "The Great Gatsby", 
            "F. Scott Fitzgerald", 
            "Fiction", 
            "want_to_read"
        )
        
        book2_id = tester.test_create_book(
            "1984", 
            "George Orwell", 
            "Fiction", 
            "currently_reading",
            "https://covers.openlibrary.org/b/id/7222246-L.jpg"
        )
        
        book3_id = tester.test_create_book(
            "To Kill a Mockingbird", 
            "Harper Lee", 
            "Fiction", 
            "completed"
        )

        if not all([book1_id, book2_id, book3_id]):
            print("❌ Failed to create test books")
            return 1

        # Test 4: Get books with data
        books = tester.test_get_books_with_data()
        if len(books) < 3:
            print(f"❌ Expected at least 3 books, got {len(books)}")

        # Test 5: Get individual books
        tester.test_get_book(book1_id)
        tester.test_get_book(book2_id)
        tester.test_get_book(book3_id)

        # Test 6: Update book details
        tester.test_update_book(book1_id, {
            "title": "The Great Gatsby (Updated)",
            "author": "F. Scott Fitzgerald",
            "genre": "Historical Fiction"
        })

        # Test 7: Move book between statuses
        tester.test_update_book(book1_id, {"status": "currently_reading"})
        tester.test_update_book(book2_id, {"status": "completed"})
        tester.test_update_book(book3_id, {"status": "want_to_read"})

        # Test 8: Update with cover URL
        tester.test_update_book(book1_id, {
            "cover_url": "https://covers.openlibrary.org/b/id/6979861-L.jpg"
        })

        # Test 9: Verify final state
        final_books = tester.test_get_books_with_data()

        # Test 10: Delete one book
        tester.test_delete_book(book1_id)

        # Test 11: Verify deletion
        success, _ = tester.run_test(
            f"Verify Book {book1_id} Deleted",
            "GET",
            f"books/{book1_id}",
            404
        )

        # Test 12: Get books after deletion
        remaining_books = tester.test_get_books_with_data()
        if len(remaining_books) != len(final_books) - 1:
            print(f"❌ Expected {len(final_books) - 1} books after deletion, got {len(remaining_books)}")

        # Test 13: Test error cases
        # Try to create book with missing required fields
        tester.run_test(
            "Create Book (Missing Title)",
            "POST",
            "books",
            422,  # Validation error
            data={"author": "Test Author", "genre": "Fiction"}
        )

        # Try to update non-existent book
        tester.run_test(
            "Update Non-existent Book",
            "PUT",
            "books/nonexistent_id",
            404,
            data={"title": "Updated Title"}
        )

        # Try to delete non-existent book
        tester.run_test(
            "Delete Non-existent Book",
            "DELETE",
            "books/nonexistent_id",
            404
        )

    finally:
        # Cleanup remaining books
        tester.cleanup_books()

    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())