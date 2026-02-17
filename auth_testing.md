# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Get session token from step 1
SESSION_TOKEN="YOUR_SESSION_TOKEN_HERE"

# Test auth endpoint
curl -X GET "https://immersive-lit.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer $SESSION_TOKEN"

# Test books endpoint
curl -X GET "https://immersive-lit.preview.emergentagent.com/api/books" \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

## Step 3: Browser Testing
Use the session token from step 1 to set cookie manually in browser DevTools:
```javascript
document.cookie = "session_token=YOUR_SESSION_TOKEN; path=/; secure; samesite=none";
```
Then navigate to dashboard.

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('test_database');
db.users.find().limit(2).pretty();
db.user_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] User document has user_id field (custom UUID)
- [ ] Session user_id matches user's user_id exactly
- [ ] All queries use `{"_id": 0}` projection
- [ ] Backend queries use user_id (not _id)
- [ ] API returns user data with user_id field
- [ ] Browser loads dashboard

## Success Indicators
✅ /api/auth/me returns user data
✅ Dashboard loads without redirect
✅ Reading sessions work
