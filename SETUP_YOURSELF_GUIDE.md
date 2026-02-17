# Step-by-Step Setup Guide - Do It Yourself in 15 Minutes

## Security First! 🔒
**NEVER share passwords or API keys with anyone, including me.**  
You'll paste credentials directly into the `.env` files yourself.

---

## Phase 1: MongoDB Atlas Setup (5 minutes)

### Step 1: Create MongoDB Atlas Account
1. Open: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your Google account (easiest)
3. Complete registration

### Step 2: Create Free Cluster
1. Click **"Create"** or **"Build a Database"**
2. Choose **FREE** (M0 Sandbox) - look for the green "FREE" label
3. Cloud Provider: Choose **AWS** (recommended)
4. Region: Choose closest to you (e.g., `US East (N. Virginia)`)
5. Cluster Name: `immersive` or keep default
6. Click **"Create Cluster"** (takes 3-5 minutes to provision)

### Step 3: Create Database User
While cluster is creating:

1. Left sidebar → **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `immersive_admin` (remember this!)
5. Password: Click **"Autogenerate Secure Password"** → **Copy it!** (save somewhere safe)
6. Database User Privileges: Select **"Built-in Role"** → **"Atlas Admin"**
7. Click **"Add User"**

**✏️ Write down:**
- Username: `immersive_admin`
- Password: `[paste your auto-generated password here]`

### Step 4: Allow Network Access
1. Left sidebar → **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for testing - we'll secure this later)
   - This adds `0.0.0.0/0`
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go back to **Database** (left sidebar)
2. Your cluster should be ready (green "Active" status)
3. Click **"Connect"** button
4. Choose **"Connect your application"**
5. Driver: **Python** | Version: **3.12 or later**
6. Copy the connection string - looks like:
```
mongodb+srv://immersive_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 6: Prepare Your Connection String
1. Replace `<password>` with your actual password from Step 3
2. Add database name before the `?` - change:
   ```
   mongodb.net/?retryWrites=true
   ```
   to:
   ```
   mongodb.net/immersive?retryWrites=true
   ```

**Final string should look like:**
```
mongodb+srv://immersive_admin:YourActualPassword@cluster0.xxxxx.mongodb.net/immersive?retryWrites=true&w=majority
```

**✅ MongoDB Atlas Done!** Keep this connection string - you'll paste it in Step 11.

---

## Phase 2: Google OAuth Setup (8 minutes)

### Step 7: Create Google Cloud Project
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account
3. Top bar: Click project dropdown → **"New Project"**
4. Project name: `Immersive Reading App`
5. Location: Leave as default or choose your organization
6. Click **"Create"**
7. Wait 10 seconds, then select your new project from the dropdown

### Step 8: Enable Google Identity API
1. Left sidebar → **APIs & Services** → **Library**
2. Search for: `Google Identity`
3. Click **"Google Identity Toolkit API"** or **"Google+ API"**
4. Click **"Enable"**

### Step 9: Configure OAuth Consent Screen
1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. User Type: Select **"External"** 
3. Click **"Create"**

**App information:**
- App name: `Immersive`
- User support email: `[your-email@gmail.com]`
- App logo: Skip for now

**App domain (scroll down):**
- Application home page: `http://localhost:3000` (for testing)
- Privacy policy: `http://localhost:3000/privacy` (can add later)
- Terms of service: `http://localhost:3000/terms` (can add later)

**Developer contact information:**
- Email addresses: `[your-email@gmail.com]`

Click **"Save and Continue"**

**Scopes:**
- Click **"Add or Remove Scopes"**
- Search and select these 3:
  - ☑️ `../auth/userinfo.email`
  - ☑️ `../auth/userinfo.profile`  
  - ☑️ `openid`
- Click **"Update"**
- Click **"Save and Continue"**

**Test users:**
- Click **"Add Users"**
- Add your email: `[your-email@gmail.com]`
- Click **"Add"**
- Click **"Save and Continue"**

Click **"Back to Dashboard"**

### Step 10: Create OAuth Credentials
1. Left sidebar → **APIs & Services** → **Credentials**
2. Top bar: Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Immersive Web Client`

**Authorized JavaScript origins:**
- Click **"+ Add URI"**
- Add: `http://localhost:3000`
- Click **"+ Add URI"** again
- Add: `https://your-production-domain.com` (if you have one, or skip)

**Authorized redirect URIs:**
- Click **"+ Add URI"**
- Add: `http://localhost:3000` (yes, same as origin for this implementation)

5. Click **"Create"**

**🎉 Success! A popup appears with your credentials:**
- **Client ID**: Looks like `123456789-abc123def456.apps.googleusercontent.com`
- **Client secret**: Looks like `GOCSPX-abcdef123456`

**✏️ Copy both and save them!**

Click **"OK"** to close popup (you can always view them again from Credentials page)

---

## Phase 3: Update Your App (2 minutes)

### Step 11: Update Backend Environment Variables

Open `/app/backend/.env` and replace it with:

```bash
# MongoDB Atlas
MONGO_URL="mongodb+srv://immersive_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/immersive?retryWrites=true&w=majority"
DB_NAME="immersive"

# Google OAuth
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_CLIENT_SECRET"

# Security
SESSION_SECRET="replace-with-random-string-min-32-chars"
CORS_ORIGINS="http://localhost:3000"
```

**Replace:**
- `MONGO_URL`: Paste your connection string from Step 6
- `GOOGLE_CLIENT_ID`: Paste from Step 10
- `GOOGLE_CLIENT_SECRET`: Paste from Step 10
- `SESSION_SECRET`: Generate random string (or use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

### Step 12: Update Frontend Environment Variables

Open `/app/frontend/.env` and add these lines:

```bash
REACT_APP_BACKEND_URL=https://your-app-name.preview.emergentagent.com
REACT_APP_USE_GOOGLE_OAUTH=true
REACT_APP_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
```

**Replace:**
- `REACT_APP_GOOGLE_CLIENT_ID`: Same Client ID from Step 10

### Step 13: Install Dependencies

```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip freeze > requirements.txt
```

### Step 14: Restart Services

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Step 15: Test!

1. Open your browser: http://localhost:3000
2. You should see the login page with Google Sign-In button
3. Click "Sign in with Google"
4. Google OAuth consent screen appears
5. Click your Google account
6. Click "Continue" to approve
7. You should be redirected to the app dashboard!

---

## Verification Checklist

```bash
# 1. Check backend is running
sudo supervisorctl status backend
# Should show: RUNNING

# 2. Check backend logs
tail -f /var/log/supervisor/backend.err.log
# Should NOT show MongoDB connection errors

# 3. Test MongoDB connection
cd /app/backend
python -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio, os
from dotenv import load_dotenv
load_dotenv()

async def test():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    result = await db.test.insert_one({'status': 'connected'})
    print('✅ MongoDB connected! ID:', result.inserted_id)
    await db.test.delete_one({'_id': result.inserted_id})

asyncio.run(test())
"

# 4. Check Google OAuth config
cd /app/backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('Google Client ID:', os.getenv('GOOGLE_CLIENT_ID')[:20] + '...')
print('Configured:', 'Yes' if os.getenv('GOOGLE_CLIENT_ID') else 'No')
"
```

---

## Troubleshooting

### MongoDB Connection Failed
**Error:** `Authentication failed`
- ✅ Check password has no spaces before/after
- ✅ Password special chars must be URL encoded (e.g., `@` → `%40`)
- ✅ Use the exact password from Step 3

**Error:** `Network timeout`
- ✅ Check Network Access allows 0.0.0.0/0
- ✅ Wait 2-3 minutes for changes to propagate

### Google OAuth Failed
**Error:** `redirect_uri_mismatch`
- ✅ Add `http://localhost:3000` to Authorized redirect URIs
- ✅ No trailing slash

**Error:** `invalid_client`
- ✅ Check GOOGLE_CLIENT_ID in `/app/backend/.env`
- ✅ No quotes around the value in .env file

**Error:** `Access blocked: This app's request is invalid`
- ✅ Complete OAuth consent screen
- ✅ Add yourself as test user

### Backend Won't Start
```bash
# Check detailed error
tail -f /var/log/supervisor/backend.err.log

# Common fixes:
pip install google-auth google-auth-oauthlib
sudo supervisorctl restart backend
```

---

## Need Help?

If you get stuck:
1. Check the error message carefully
2. Verify all credentials are correct (no extra spaces)
3. Make sure services are running: `sudo supervisorctl status`
4. Check logs: `tail -f /var/log/supervisor/backend.err.log`

Once everything works, you can:
- Secure MongoDB Network Access (add only your server IPs)
- Deploy to production (see PRODUCTION_GUIDE.md)
- Submit Google app for verification (for public launch)

---

## Time Estimate
- MongoDB Atlas: 5 minutes
- Google OAuth: 8 minutes
- Update config files: 2 minutes
- **Total: ~15 minutes** ⏱️

Good luck! 🚀
