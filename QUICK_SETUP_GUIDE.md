# Quick Start: Your Own MongoDB + Google OAuth

## Current Setup
**Data Storage:** MongoDB at `localhost:27017` (database: `test_database`)  
**Authentication:** Emergent-managed Google Auth (works out of the box)

## Switch to Your Own Setup

### Option 1: Quick Setup (MongoDB Atlas + Keep Emergent Auth)
This is the **easiest** - just move your data to cloud MongoDB.

```bash
# 1. Create free MongoDB Atlas cluster
# Go to: https://www.mongodb.com/cloud/atlas/register
# Follow wizard → Create M0 Free cluster
# Get connection string (looks like this):
# mongodb+srv://username:password@cluster.xxxxx.mongodb.net/immersive

# 2. Update /app/backend/.env
MONGO_URL="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/immersive"
DB_NAME="immersive"

# 3. Restart backend
sudo supervisorctl restart backend

# Done! Your data is now in MongoDB Atlas
# Authentication still uses Emergent (zero config needed)
```

**Benefits:**
- ✅ 5 minutes to set up
- ✅ Cloud-hosted database (free 512MB)
- ✅ Automatic backups (on paid tiers)
- ✅ No Google OAuth configuration needed

---

### Option 2: Full Custom Setup (MongoDB Atlas + Your Google OAuth)
Complete control over both database and authentication.

**Step 1: MongoDB Atlas (same as Option 1)**
```bash
# Get MongoDB Atlas connection string
MONGO_URL="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/immersive"
```

**Step 2: Google OAuth Setup**
```bash
# 1. Go to: https://console.cloud.google.com/
# 2. Create new project: "Immersive"
# 3. Enable Google+ API
# 4. OAuth consent screen:
#    - User Type: External
#    - App name: Immersive
#    - Authorized domains: yourdomain.com
# 5. Create credentials:
#    - Type: OAuth client ID
#    - Application type: Web application
#    - Authorized redirect URIs: 
#      * http://localhost:3000/auth/callback
#      * https://yourdomain.com/auth/callback
# 6. Save your credentials:
#    Client ID: 123456789-abc123.apps.googleusercontent.com
#    Client Secret: GOCSPX-xxxxx
```

**Step 3: Update Environment Variables**

Backend (`/app/backend/.env`):
```bash
# MongoDB
MONGO_URL="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/immersive"
DB_NAME="immersive"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"

# Security
SESSION_SECRET="generate-random-string-here"
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

Frontend (`/app/frontend/.env`):
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.com
REACT_APP_USE_GOOGLE_OAUTH=true
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**Step 4: Install Dependencies**
```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip freeze > requirements.txt
```

**Step 5: Update App.js to use new Login**
```javascript
// /app/frontend/src/App.js
import LoginWithGoogle from '@/pages/LoginWithGoogle';

// Replace the Login import
// OLD: import Login from '@/pages/Login';
// NEW: Already done - use LoginWithGoogle
```

**Step 6: Restart Services**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

**Step 7: Test**
- Go to http://localhost:3000
- Click "Sign in with Google"
- Should see Google's OAuth consent screen
- After login → redirects to dashboard

---

## Testing Your Setup

### Test MongoDB Connection
```bash
cd /app/backend
python -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    try:
        client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
        db = client[os.getenv('DB_NAME')]
        
        # Test write
        await db.test_collection.insert_one({'test': 'data'})
        print('✅ MongoDB write successful')
        
        # Test read
        doc = await db.test_collection.find_one({'test': 'data'})
        print(f'✅ MongoDB read successful: {doc}')
        
        # Cleanup
        await db.test_collection.delete_one({'test': 'data'})
        print('✅ MongoDB connected successfully!')
    except Exception as e:
        print(f'❌ MongoDB connection failed: {e}')

asyncio.run(test())
"
```

### Test Google OAuth
```bash
# Check if credentials are loaded
cd /app/backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('Google Client ID:', os.getenv('GOOGLE_CLIENT_ID'))
print('Configured:', bool(os.getenv('GOOGLE_CLIENT_ID')))
"
```

### Test Full Auth Flow
1. Open browser: `http://localhost:3000`
2. Should see "Sign in with Google" button
3. Click → Google OAuth consent screen appears
4. Approve → Redirected back to app
5. Check browser DevTools → Application → Cookies
6. Should see `session_token` cookie
7. Dashboard should load

---

## Data Migration (Optional)

If you have existing data in local MongoDB and want to move it to Atlas:

```bash
# Export from local
mongodump --uri="mongodb://localhost:27017/test_database" --out=/tmp/backup

# Import to Atlas
mongorestore --uri="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/immersive" /tmp/backup/test_database
```

---

## Troubleshooting

**MongoDB Connection Issues:**
```bash
# Error: "Authentication failed"
# Fix: Check username/password in connection string

# Error: "Network error"
# Fix: Check Network Access in MongoDB Atlas
#      Add your IP address or use 0.0.0.0/0 for testing

# Error: "Database does not exist"
# Fix: MongoDB creates database automatically on first write
```

**Google OAuth Issues:**
```bash
# Error: "redirect_uri_mismatch"
# Fix: Add exact redirect URI to Google Console
#      Must match: http://localhost:3000/auth/callback

# Error: "invalid_client"
# Fix: Check GOOGLE_CLIENT_ID in .env file

# Error: "Access blocked: This app's request is invalid"
# Fix: Configure OAuth consent screen in Google Console
#      Add your email as test user
```

**Backend Not Starting:**
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Common issues:
# 1. Missing dependencies → pip install google-auth
# 2. Invalid MONGO_URL → Check connection string
# 3. Syntax error → Check server.py
```

---

## Production Checklist

Before going live:

- [ ] MongoDB Atlas: Use paid tier (M10+) for backups
- [ ] MongoDB Atlas: Enable IP whitelisting (not 0.0.0.0/0)
- [ ] Google OAuth: Submit app for verification
- [ ] Google OAuth: Remove "Testing" mode
- [ ] Environment variables: Use secrets manager (not .env)
- [ ] HTTPS: Enable SSL on your domain
- [ ] CORS: Update to specific domains (not *)
- [ ] Rate limiting: Add to API endpoints
- [ ] Monitoring: Set up error tracking (Sentry)
- [ ] Backups: Enable automated backups
- [ ] Legal: Add Privacy Policy & Terms of Service

---

## Cost Breakdown

**Option 1 (Atlas + Emergent Auth):**
- MongoDB Atlas: $0 (M0 Free tier)
- Emergent Auth: $0 (included in platform)
- **Total: $0/month** ✨

**Option 2 (Atlas + Google OAuth):**
- MongoDB Atlas: $0 (M0 Free tier)
- Google OAuth: $0 (free forever)
- **Total: $0/month** ✨

**When to upgrade:**
- Storage >500MB → M10 cluster ($57/month)
- Need backups → M2+ ($9/month)
- Heavy traffic → Dedicated cluster

---

## Which Option Should You Choose?

**Choose Option 1 if:**
- ✅ You want the quickest setup
- ✅ You're prototyping/testing
- ✅ You don't need custom OAuth flow
- ✅ You trust Emergent's authentication

**Choose Option 2 if:**
- ✅ You want complete control
- ✅ You're preparing for production
- ✅ You need custom branding
- ✅ You want to understand the full stack

---

## Next Steps

1. **Choose your option** (I recommend starting with Option 1)
2. **Create MongoDB Atlas account** (5 minutes)
3. **Update .env files** (2 minutes)
4. **Test locally** (5 minutes)
5. **Deploy to production** (see PRODUCTION_GUIDE.md)

Need help? Check:
- Full guide: `/app/MONGODB_GOOGLE_SETUP.md`
- Production guide: `/app/PRODUCTION_GUIDE.md`
- Code files: `/app/backend/auth_google.py`, `/app/frontend/src/pages/LoginWithGoogle.js`
