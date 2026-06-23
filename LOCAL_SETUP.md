# Project Alpha - Complete Local Setup Guide

**Goal:** Get the entire app (database, backend, frontend) running on your laptop

---

## Prerequisites Check

Before starting, make sure you have:

- [ ] **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- [ ] **PostgreSQL 12+** - Download from [postgresql.org](https://www.postgresql.org/download/)
- [ ] **Git** (optional) - For version control
- [ ] **Chrome/Firefox/Safari** - Web browser
- [ ] **Terminal/Command Prompt** - For running commands

### Check Installations

```bash
# Check Node.js
node --version    # Should be v18 or higher

# Check npm
npm --version     # Should be 8 or higher

# Check PostgreSQL
psql --version    # Should be 12 or higher
```

---

## Step 1: Set Up Database (PostgreSQL)

### Option A: Using PostgreSQL Directly (Recommended for Local)

#### Mac
```bash
# If using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
psql --version
```

#### Windows
- Download installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Run installer, remember the password you set
- PostgreSQL should auto-start

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Check status
sudo systemctl status postgresql
```

### Create Database & User

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql (postgres=#):
CREATE USER zoom_user WITH PASSWORD 'zoom_password';
CREATE DATABASE zoom_share OWNER zoom_user;
ALTER USER zoom_user CREATEDB;

# Exit psql
\q
```

**Verify connection:**
```bash
psql -U zoom_user -d zoom_share -h localhost
# Type: \q to exit
```

---

## Step 2: Clone/Prepare Project Files

Navigate to your project folder:

```bash
cd /path/to/your/project
ls
# Should see: backend/, frontend/, PHASE_1_GUIDE.md, etc.
```

---

## Step 3: Set Up Backend

### Install Dependencies

```bash
cd backend

# Copy environment file
cp .env.example .env
```

### Configure .env

Edit `backend/.env`:

```bash
# Use nano, vim, or your preferred editor
nano .env
```

Set these values:

```
# Database (local PostgreSQL)
DATABASE_URL=postgresql://zoom_user:zoom_password@localhost:5432/zoom_share

# Authentication
JWT_SECRET=your-super-secret-key-12345

# Server
API_PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

Save and exit (in nano: `Ctrl+O`, `Enter`, `Ctrl+X`)

### Install Node Dependencies

```bash
npm install
```

This installs: express, postgres, bcryptjs, jsonwebtoken, etc.

### Initialize Database

```bash
npm run migrate
```

This creates the `users`, `zoom_accounts`, `recordings` tables, etc.

**Verify tables were created:**

```bash
psql -U zoom_user -d zoom_share -h localhost

# Inside psql:
\dt
# Should list: users, zoom_accounts, recordings, share_links, event_logs

\q
```

### Start Backend

```bash
npm run dev
```

You should see:
```
Server running on http://localhost:5000
Database initialized successfully
```

**Keep this terminal open!** The backend runs here.

---

## Step 4: Set Up Frontend

### Open New Terminal Window

```bash
# Navigate to frontend folder (keep backend running in other terminal)
cd /path/to/your/project/frontend
```

### Copy Environment File

```bash
cp .env.example .env
```

File should contain:
```
VITE_API_URL=http://localhost:5000/api
```

(This is already correct)

### Install Dependencies

```bash
npm install
```

This installs: react, vite, axios, etc.

### Start Frontend Dev Server

```bash
npm run dev
```

You should see:
```
VITE v4.x.x ready in 234 ms

➜  Local:   http://localhost:3000/
➜  Press h to show help
```

**Keep this terminal open!** The frontend runs here.

---

## Step 5: Access the App

### Open Browser

Navigate to: **`http://localhost:3000`**

You should see the **Login Page** with:
- Title: "📹 Zoom Recording Auto-Share"
- Login form (email + password)
- Link to create account

---

## Step 6: Test Registration & Login

### Create Account

1. Click **"Create one"** link
2. Fill in signup form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click **"Create Account"**

**Expected:** You're logged in automatically, see empty dashboard

### Logout & Login

1. Click **"Sign Out"** button (top right)
2. On login page, enter:
   - Email: `test@example.com`
   - Password: `password123`
3. Click **"Sign In"**

**Expected:** You're logged back in

### Verify in Database

```bash
psql -U zoom_user -d zoom_share -h localhost

# Inside psql:
SELECT id, email, name, created_at FROM users;
# Should show your test user

\q
```

---

## Terminal Setup (Recommended)

To avoid managing multiple terminals, use **split terminals** or **tmux**.

### Option 1: VS Code Terminal (Easiest)

1. Open VS Code
2. Open folder: `/path/to/project`
3. Terminal → New Terminal (or Ctrl+`)
4. Split terminal: Ctrl+Shift+5 (or Terminal → Split Terminal)

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

Now both run side-by-side, easy to see logs.

### Option 2: macOS iTerm or Windows PowerShell

**Window 1:**
```bash
cd backend && npm run dev
```

**Window 2:**
```bash
cd frontend && npm run dev
```

---

## Testing Phase 1

Once everything is running, test these scenarios:

### ✅ Test 1: Register New User
- Go to signup
- Create account with any email/password
- You're logged in → see dashboard
- User appears in database

### ✅ Test 2: Login/Logout
- Click "Sign Out"
- Login with same credentials
- Verify you're logged back in

### ✅ Test 3: Invalid Credentials
- Try wrong password
- See error message

### ✅ Test 4: Duplicate Email
- Try registering with same email twice
- Second attempt shows error

### ✅ Test 5: Check Browser Storage
- Open Chrome DevTools (F12)
- Go to Application tab → Local Storage → http://localhost:3000
- Should see `token` and `user` entries

---

## Common Issues & Fixes

### "Cannot connect to database"

**Problem:** Backend crashes on startup

**Solutions:**
1. Check PostgreSQL is running
   ```bash
   # Mac
   brew services list  # Look for postgresql
   
   # Windows
   # Check Services app for PostgreSQL
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify connection details in `backend/.env`
   ```bash
   psql -U zoom_user -d zoom_share -h localhost
   ```

3. If that works, backend `.env` is wrong - fix DATABASE_URL

### "Port 3000 is already in use"

**Problem:** Frontend won't start, says port 3000 taken

**Solutions:**
```bash
# Find process using port 3000
# Mac/Linux:
lsof -i :3000

# Kill it:
kill -9 <PID>

# Then restart frontend
npm run dev
```

**Or use different port:**
```bash
# Edit frontend/vite.config.js
# Change: port: 3000 to port: 3001
npm run dev
# Then visit: http://localhost:3001
```

### "Frontend shows blank page"

**Problem:** Browser shows nothing or errors

**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Verify backend is running (terminal 1)
3. Check `frontend/.env` has correct API URL
4. Try hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### "npm install fails"

**Problem:** Dependencies won't install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Try install again
npm install

# If still fails, check Node version
node --version  # Should be v18+
```

### "Signup/Login button doesn't work"

**Problem:** Form submission fails silently

**Solutions:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click signup/login button
4. Look at POST request to `/api/auth/register` or `/api/auth/login`
5. Check response - should see error message
6. Common issues:
   - Backend not running
   - API_URL wrong in frontend
   - PostgreSQL not accessible

---

## File Organization

Make sure your local folder looks like:

```
your-project-folder/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   ├── services/
│   │   │   └── auth.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── db/
│   │       └── init.js
│   ├── package.json
│   └── .env (you create this)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   └── services/
│   │       └── authService.js
│   ├── package.json
│   ├── vite.config.js
│   └── .env (you create this)
│
├── PHASE_1_GUIDE.md
├── LOCAL_SETUP.md (this file)
└── ... other files
```

---

## Quick Start Script

Create a file called `start-local.sh` (Mac/Linux) in your project folder:

```bash
#!/bin/bash

echo "🚀 Starting Project Alpha locally..."
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
psql -U zoom_user -d zoom_share -h localhost -c "SELECT 1" 2>/dev/null
if [ $? -ne 0 ]; then
  echo "❌ PostgreSQL not accessible"
  echo "Make sure PostgreSQL is running and credentials are correct"
  exit 1
fi
echo "✅ PostgreSQL OK"
echo ""

# Start backend
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!
sleep 2
echo "✅ Backend running (PID: $BACKEND_PID)"
echo ""

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 2
echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo ""

echo "=================================="
echo "✅ Project Alpha is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Database: localhost:5432/zoom_share"
echo ""
echo "Press Ctrl+C to stop"
echo "=================================="

# Keep processes running
wait
```

Make it executable and run:
```bash
chmod +x start-local.sh
./start-local.sh
```

---

## What to Do Next

Once Phase 1 is working locally:

1. **Verify all tests pass:**
   - Register → Signup works
   - Login/Logout → Session works
   - Invalid creds → Error shown
   - User in database → Can see in psql

2. **Then proceed to Phase 2:**
   - Zoom OAuth integration
   - Account connection workflow

---

## Helpful Commands

```bash
# Check backend logs
tail -f backend/npm-debug.log

# Restart backend
# Ctrl+C (stop it), then:
npm run dev

# Check database tables
psql -U zoom_user -d zoom_share -h localhost
\dt
\q

# Clear all users (to start fresh)
DELETE FROM users;

# Check process using port
lsof -i :5000   # backend port
lsof -i :3000   # frontend port

# Stop process by port
kill -9 $(lsof -t -i :3000)
```

---

## Support

If you get stuck:

1. **Check terminal output** - errors usually show clearly
2. **Check browser console** - F12 → Console tab
3. **Check PostgreSQL is running** - it's the most common issue
4. **Verify .env files** - wrong DATABASE_URL causes crashes
5. **Restart everything** - kill all processes, start fresh

Good luck! 🚀

