# Setting Up Your Own MongoDB + Google OAuth

## Part 1: MongoDB Atlas Setup (Free Tier)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/email
3. Choose **Free Shared Cluster** (M0 - Free forever)

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose **M0 Free** tier
3. Select a cloud provider and region (choose closest to your users)
4. Cluster Name: `immersive-cluster` (or your preference)
5. Click "Create"

### Step 3: Security Setup

**Create Database User:**
1. Security → Database Access → Add New Database User
2. Authentication Method: Password
3. Username: `immersive_admin`
4. Password: Generate secure password (save it!)
5. Database User Privileges: **Atlas admin** or **Read and write to any database**
6. Click "Add User"

**Configure Network Access:**
1. Security → Network Access → Add IP Address
2. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. For production: Add specific IP addresses of your servers
4. Click "Confirm"

### Step 4: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: **Python** | Version: **3.12 or later**
4. Copy the connection string:
```
mongodb+srv://immersive_admin:<password>@immersive-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
5. Replace `<password>` with your actual password
6. Add database name: `?retryWrites=true&w=majority&authSource=admin` becomes `immersive?retryWrites=true&w=majority&authSource=admin`

**Final connection string format:**
```
mongodb+srv://immersive_admin:YOUR_PASSWORD@immersive-cluster.xxxxx.mongodb.net/immersive?retryWrites=true&w=majority&authSource=admin
```

### Step 5: Update Backend Environment Variables

Update `/app/backend/.env`:
```bash
MONGO_URL="mongodb+srv://immersive_admin:YOUR_PASSWORD@immersive-cluster.xxxxx.mongodb.net/immersive?retryWrites=true&w=majority&authSource=admin"
DB_NAME="immersive"
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SESSION_SECRET="generate-a-long-random-string-here"
```

---

## Part 2: Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Project name: `Immersive Reading App`
4. Click "Create"

### Step 2: Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click and enable it

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. User Type: **External** (unless you have Google Workspace)
3. Click "Create"

**App Information:**
- App name: `Immersive`
- User support email: your-email@gmail.com
- App logo: (optional, can add later)

**App domain:**
- Application home page: `https://yourdomain.com` (or `http://localhost:3000` for dev)
- Privacy policy: `https://yourdomain.com/privacy`
- Terms of service: `https://yourdomain.com/terms`

**Authorized domains:**
- Add: `yourdomain.com` (don't include https://)

**Developer contact:**
- Email: your-email@gmail.com

Click "Save and Continue"

**Scopes:**
- Click "Add or Remove Scopes"
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click "Update" → "Save and Continue"

**Test users (for development):**
- Add your email addresses that will test the app
- Click "Save and Continue"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Immersive Web Client`

**Authorized JavaScript origins:**
- `http://localhost:3000` (for development)
- `https://yourdomain.com` (for production)

**Authorized redirect URIs:**
- `http://localhost:3000/auth/callback` (for development)
- `https://yourdomain.com/auth/callback` (for production)

5. Click "Create"
6. **Save your credentials:**
   - Client ID: `123456789-abc123.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`

---

## Part 3: Backend Implementation

### Install Required Package
```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip freeze > requirements.txt
```

### Update Backend Code

I'll create a new authentication system that doesn't rely on Emergent's managed auth.

---

## Part 4: Frontend Implementation

Update the Login component to use standard Google OAuth flow instead of Emergent's system.

---

## Testing Your Setup

### Local Development:
```bash
# Backend
cd /app/backend
# Update .env with MongoDB Atlas URL and Google OAuth credentials
sudo supervisorctl restart backend

# Frontend  
cd /app/frontend
# Update .env with backend URL
sudo supervisorctl restart frontend

# Test
curl http://localhost:8001/api/health
```

### Verify MongoDB Connection:
```bash
# In backend container
python -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    await db.users.insert_one({'test': 'connection'})
    print('✅ MongoDB connected successfully!')
    await db.users.delete_one({'test': 'connection'})
    
asyncio.run(test())
"
```

---

## Important Notes

### MongoDB Atlas Free Tier Limits:
- **Storage:** 512 MB
- **RAM:** Shared
- **No backups** (upgrade to M2+ for backups)
- **Connection limit:** 500 concurrent connections
- Good for ~1000-5000 users

### When to Upgrade:
- Storage >500MB → Upgrade to M10 ($0.08/hour = ~$57/month)
- Need automated backups → M2+ ($9/month)
- Performance issues → Dedicated cluster (M10+)

### Security Best Practices:
1. **Never commit .env files** to git
2. Use **environment variables** in production
3. **Rotate credentials** every 90 days
4. Use **IP whitelisting** in production (not 0.0.0.0/0)
5. Enable **MongoDB Atlas monitoring** and alerts

### Google OAuth Verification:
- Your app will show "unverified" warning until you submit for Google verification
- For personal use: stays in "Testing" mode (up to 100 test users)
- For public launch: Submit for verification (takes 1-2 weeks)

---

## Cost Comparison

**MongoDB Atlas:**
- Free (M0): Good for development and small apps
- Paid (M10): $57/month - production ready

**vs Supabase (PostgreSQL):**
- Free: 500MB database, 2GB storage
- Pro: $25/month - 8GB database, 100GB storage

**vs Self-Hosted:**
- DigitalOcean Droplet: $6-12/month
- AWS EC2: $5-20/month
- Maintenance time: Your responsibility

---

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Set up cluster and get connection string
3. ✅ Create Google OAuth credentials  
4. ⏳ I'll update the backend code for you
5. ⏳ I'll update the frontend code for you
6. ✅ Test locally
7. ✅ Deploy to production

Ready for me to update the code?
