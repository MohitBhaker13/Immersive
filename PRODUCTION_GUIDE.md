# Immersive Reading App - Production Deployment Guide

## Table of Contents
1. [Infrastructure Setup](#1-infrastructure-setup)
2. [Database Migration](#2-database-migration)
3. [Audio Assets](#3-audio-assets)
4. [Security Hardening](#4-security-hardening)
5. [Performance Optimization](#5-performance-optimization)
6. [Monitoring & Analytics](#6-monitoring--analytics)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Domain & SSL](#8-domain--ssl)
9. [Legal & Compliance](#9-legal--compliance)
10. [Post-Launch Checklist](#10-post-launch-checklist)

---

## 1. Infrastructure Setup

### 1.1 Supabase Setup (Recommended)
**Why:** Managed Postgres + Auth + Storage + Real-time subscriptions

```bash
# 1. Create Supabase project
https://supabase.com/dashboard

# 2. Get credentials
Project URL: https://your-project.supabase.co
Anon Key: your-anon-key
Service Role Key: your-service-role-key

# 3. Create tables (run in Supabase SQL Editor)
```

```sql
-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  daily_goal_minutes INTEGER DEFAULT 30,
  default_mood TEXT DEFAULT 'Focus',
  sound_enabled BOOLEAN DEFAULT true,
  reading_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (auth)
CREATE TABLE user_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE books (
  book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  cover_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('want_to_read', 'currently_reading', 'completed')),
  total_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading sessions
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  sound_theme TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes_count INTEGER DEFAULT 0
);

-- Notes
CREATE TABLE notes (
  note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE
);

-- Indexes for performance
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_status ON books(user_id, status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_book_id ON sessions(book_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_book_id ON notes(book_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own books" ON books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON books FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for sessions, notes, streaks...
```

### 1.2 Alternative: Self-Hosted PostgreSQL
```bash
# Production-ready PostgreSQL setup
docker run -d \
  --name immersive-postgres \
  -e POSTGRES_PASSWORD=your-secure-password \
  -e POSTGRES_DB=immersive \
  -v /data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Connection pooling with PgBouncer
docker run -d \
  --name pgbouncer \
  -e DATABASES_HOST=postgres \
  -e DATABASES_PORT=5432 \
  -e DATABASES_USER=immersive \
  -e DATABASES_PASSWORD=your-password \
  -e DATABASES_DBNAME=immersive \
  -p 6432:6432 \
  pgbouncer/pgbouncer
```

### 1.3 Frontend Deployment - Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy from /app/frontend
cd /app/frontend
vercel --prod

# 3. Configure environment variables in Vercel dashboard
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### 1.4 Backend Deployment Options

**Option A: Railway.app (Easiest)**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Deploy
cd /app/backend
railway login
railway init
railway up
```

**Option B: DigitalOcean App Platform**
- Push to GitHub
- Connect repo to DO App Platform
- Set environment variables
- Auto-deploys on push

**Option C: AWS EC2 + Docker (Full Control)**
```dockerfile
# Dockerfile for backend
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
# Deploy script
docker build -t immersive-backend .
docker run -d \
  -p 8001:8001 \
  -e MONGO_URL=$MONGO_URL \
  -e DB_NAME=immersive \
  --name immersive-api \
  immersive-backend
```

---

## 2. Database Migration

### 2.1 Migrate from MongoDB to PostgreSQL (if using Supabase)
```python
# migration_script.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg

async def migrate():
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient('mongodb://localhost:27017')
    mongo_db = mongo_client['test_database']
    
    # Connect to PostgreSQL
    pg_conn = await asyncpg.connect(
        'postgresql://user:password@localhost:5432/immersive'
    )
    
    # Migrate users
    users = await mongo_db.users.find({}).to_list(None)
    for user in users:
        await pg_conn.execute('''
            INSERT INTO users (user_id, email, name, picture, daily_goal_minutes, 
                             default_mood, sound_enabled, reading_type, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ''', user['user_id'], user['email'], user['name'], user.get('picture'),
           user['daily_goal_minutes'], user['default_mood'], user['sound_enabled'],
           user.get('reading_type'), user['created_at'])
    
    # Migrate books, sessions, notes, streaks...
    print('Migration complete!')

asyncio.run(migrate())
```

---

## 3. Audio Assets

### 3.1 Acquire Professional Audio
**Option 1: Royalty-Free Sources**
- Epidemic Sound ($15/month) - https://epidemicsound.com
- AudioJungle (one-time purchase) - https://audiojungle.net
- Artlist ($16.60/month) - https://artlist.io

**Option 2: Commission Custom Music**
- Fiverr: $50-200 per track
- Upwork: $100-500 per track
- SoundBetter: Professional composers

### 3.2 Audio Hosting Strategy
**Option A: Supabase Storage**
```javascript
// Upload audio
const { data, error } = await supabase.storage
  .from('audio')
  .upload('themes/focus.mp3', audioFile)

// Get public URL
const { data } = supabase.storage
  .from('audio')
  .getPublicUrl('themes/focus.mp3')
```

**Option B: AWS S3 + CloudFront CDN**
```bash
# Upload to S3
aws s3 cp audio/ s3://immersive-audio/ --recursive

# Set up CloudFront distribution for fast global delivery
# URL: https://d123456.cloudfront.net/themes/focus.mp3
```

### 3.3 Audio File Specifications
```
Format: MP3 or AAC
Bitrate: 128kbps (balance quality/size)
Duration: 3-5 minutes (seamless loop)
Sample Rate: 44.1kHz
File Size: ~2-4MB per track
```

### 3.4 Update constants.js with Production URLs
```javascript
export const SOUND_THEMES = {
  Focus: {
    tracks: [
      {
        url: 'https://your-cdn.com/audio/focus-01.mp3',
        name: 'Deep Focus',
        duration: 180,
      },
      {
        url: 'https://your-cdn.com/audio/focus-02.mp3',
        name: 'Concentration Flow',
        duration: 240,
      },
    ],
    // ...
  },
};
```

---

## 4. Security Hardening

### 4.1 Environment Variables
```bash
# Backend .env (NEVER commit to git)
MONGO_URL=postgresql://user:pass@host:5432/db
DB_NAME=immersive_prod
CORS_ORIGINS=https://immersive.app,https://www.immersive.app
SECRET_KEY=your-256-bit-secret-key-here
JWT_SECRET=another-secret-for-jwt
RATE_LIMIT_PER_MINUTE=60
```

### 4.2 API Rate Limiting
```python
# backend/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/books")
@limiter.limit("60/minute")
async def get_books(request: Request):
    # ...
```

### 4.3 HTTPS & SSL
```bash
# Force HTTPS in production
# Vercel/Railway handle this automatically

# For self-hosted: Use Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4.4 Security Headers
```python
# Add security middleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["immersive.app", "*.immersive.app"])

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## 5. Performance Optimization

### 5.1 Frontend Optimization
```bash
# Build optimization
cd /app/frontend

# Analyze bundle
npm install --save-dev webpack-bundle-analyzer
npm run build -- --profile

# Code splitting (already done with React.lazy)
# Compress images
npm install --save-dev image-webpack-loader

# Enable service worker for offline
npm install workbox-webpack-plugin
```

### 5.2 Backend Optimization
```python
# Add response caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@cache(expire=300)  # 5 minutes
@app.get("/api/books")
async def get_books():
    # ...

# Database connection pooling
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40
)
```

### 5.3 CDN Setup
- CloudFlare (Free tier works great)
- Automatic caching for static assets
- DDoS protection
- Global edge network

---

## 6. Monitoring & Analytics

### 6.1 Error Tracking - Sentry
```bash
# Frontend
npm install @sentry/react

# src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

```python
# Backend
pip install sentry-sdk[fastapi]

import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
    traces_sample_rate=0.1,
)
```

### 6.2 Analytics - PostHog (Already integrated!)
- Dashboard: https://app.posthog.com
- Track custom events:
```javascript
posthog.capture('session_completed', {
  duration: 30,
  mood: 'Focus',
  book_genre: 'Non-Fiction',
});
```

### 6.3 Uptime Monitoring
- **Better Uptime** (betteruptime.com) - Free tier
- **UptimeRobot** (uptimerobot.com) - Free 50 monitors
- **Pingdom** - Paid but comprehensive

### 6.4 Performance Monitoring
```bash
# Lighthouse CI
npm install -g @lhci/cli

# Run on every deploy
lhci autorun --upload.target=temporary-public-storage
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          yarn install
          yarn test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
```

---

## 8. Domain & SSL

### 8.1 Domain Purchase
- Namecheap: $10-15/year
- Google Domains: $12/year
- Cloudflare Registrar: At-cost pricing

### 8.2 DNS Configuration
```
# Example DNS records
A     @              76.76.21.21      (Vercel IP)
A     api            123.45.67.89     (Backend server)
CNAME www            immersive.app
TXT   @              "v=spf1 include:_spf.google.com ~all"
```

### 8.3 Email Setup (for transactional emails)
- SendGrid: 100 emails/day free
- Resend: 3,000 emails/month free
- AWS SES: $0.10 per 1,000 emails

---

## 9. Legal & Compliance

### 9.1 Required Pages
```
/privacy-policy
/terms-of-service
/cookie-policy
/contact
```

Use template generators:
- TermsFeed (free templates)
- Termly (automated, $10/month)
- Lawyer review (recommended for serious app): $500-2000

### 9.2 GDPR Compliance
- Cookie consent banner (use CookieYes)
- Data export functionality
- Right to deletion
- Privacy policy

### 9.3 Cookie Compliance
```javascript
// Install cookie consent
npm install react-cookie-consent

import CookieConsent from "react-cookie-consent";

<CookieConsent
  location="bottom"
  buttonText="Accept"
  cookieName="immersive-consent"
  style={{ background: "#2C2A27" }}
  buttonStyle={{ background: "#A68A64", color: "#fff" }}
>
  This site uses cookies to enhance your experience.
</CookieConsent>
```

---

## 10. Post-Launch Checklist

### 10.1 Week 1
- [ ] Monitor error rates (should be <0.1%)
- [ ] Check performance metrics (Lighthouse score >90)
- [ ] Verify all payment flows (if applicable)
- [ ] Test mobile experience on real devices
- [ ] Set up automated backups (daily)
- [ ] Monitor server costs

### 10.2 Month 1
- [ ] Analyze user behavior (PostHog)
- [ ] Identify drop-off points
- [ ] A/B test onboarding flow
- [ ] Collect user feedback
- [ ] Plan feature iterations
- [ ] Review and optimize costs

### 10.3 Scaling Considerations

**<1000 users:**
- Single backend server
- Managed database (Supabase/Railway)
- Vercel for frontend
- **Cost:** ~$25-50/month

**1000-10,000 users:**
- Load balanced backend (2-3 instances)
- Database with read replicas
- CDN for all static assets
- **Cost:** ~$150-300/month

**10,000+ users:**
- Kubernetes cluster
- Dedicated database cluster
- Redis caching layer
- Multiple regions
- **Cost:** $500-2000+/month

---

## 11. Launch Marketing

### 11.1 Pre-Launch
- [ ] Set up social media accounts
- [ ] Create Product Hunt listing
- [ ] Write launch blog post
- [ ] Build email list (landing page)
- [ ] Reach out to book bloggers

### 11.2 Launch Day
- [ ] Post on Product Hunt
- [ ] Share on Twitter/LinkedIn
- [ ] Post in Reddit r/books, r/productivity
- [ ] Email subscribers
- [ ] Hacker News submission

### 11.3 Post-Launch
- [ ] SEO optimization
- [ ] Content marketing (blog posts)
- [ ] Partnerships with book clubs
- [ ] Integrate with Goodreads API
- [ ] Mobile app (React Native)

---

## Quick Start Commands

```bash
# 1. Set up Supabase
# Create project at supabase.com
# Run SQL schema from section 1.1

# 2. Deploy Frontend
cd /app/frontend
vercel --prod

# 3. Deploy Backend
cd /app/backend
railway up
# OR
docker build -t immersive-api .
docker push your-registry/immersive-api

# 4. Set up monitoring
# Add Sentry DSN to environment variables
# Configure uptime monitoring at betteruptime.com

# 5. Configure domain
# Point DNS to Vercel and backend server
# Enable SSL

# 6. Go live!
```

---

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev

## Estimated Total Monthly Costs (Production)

**Minimal (0-1k users):** $30-60/month
- Vercel: $0 (Hobby)
- Railway: $5-20
- Supabase: $25 (Pro tier)
- Domain: $1-2

**Growth (1k-10k users):** $150-400/month
- Vercel: $20 (Pro)
- Backend hosting: $50-150
- Supabase: $25 (Pro) + storage
- CDN: $20-50
- Monitoring: $29 (Sentry)

**Scale (10k+ users):** $500-2000+/month
- Vercel: $20-$150
- Infrastructure: $300-1500
- Database: $100-300
- Monitoring & tools: $100-200

---

**You're now ready to launch Immersive as a production-grade app!** 🚀
