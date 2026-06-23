# Phase 1 - User Authentication & Account Management

**Status:** ✅ Complete  
**Deliverable:** Users can register, login, receive JWT tokens, and access authenticated dashboard

---

## What's Implemented

### Backend
- ✅ User registration endpoint
- ✅ User login endpoint  
- ✅ JWT token generation & validation
- ✅ Password hashing with bcrypt
- ✅ Protected routes (auth middleware)
- ✅ User verification endpoint
- ✅ User profile retrieval

### Frontend
- ✅ Login page with form validation
- ✅ Signup page with password confirmation
- ✅ Token storage in localStorage
- ✅ Auto-login check on app start
- ✅ Protected dashboard (shows only when logged in)
- ✅ Logout functionality
- ✅ User info display in header

### Database
- ✅ Users table with email, password_hash, name
- ✅ Proper indexes and constraints
- ✅ Cascading deletes for data integrity

---

## Setup & Installation

### 1. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env and set:
DATABASE_URL=postgresql://zoom_user:zoom_password@localhost:5432/zoom_share
JWT_SECRET=your-super-secret-key-change-in-production

# Install dependencies
npm install

# Start database (if not running)
docker-compose up -d postgres

# Wait for database to be ready
sleep 5

# Initialize database
npm run migrate

# Start backend
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Copy environment file  
cp .env.example .env

# Install dependencies
npm install

# Start frontend
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

---

## Testing Phase 1

### Test 1: User Registration

**Steps:**
1. Open browser to `http://localhost:3000`
2. Click "Create one" link (under login form)
3. Fill in signup form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm: "password123"
4. Click "Create Account"

**Expected Result:**
- ✅ Registration succeeds
- ✅ User is logged in automatically
- ✅ Dashboard loads
- ✅ Username shown in header

**Backend Check:**
```bash
# Verify user was created in database
psql postgresql://zoom_user:zoom_password@localhost:5432/zoom_share

# In psql:
SELECT * FROM users;
```

---

### Test 2: User Login

**Steps:**
1. Click "Sign Out" in dashboard header
2. You're now on login page
3. Enter credentials:
   - Email: "test@example.com"
   - Password: "password123"
4. Click "Sign In"

**Expected Result:**
- ✅ Login succeeds
- ✅ Dashboard loads with same user
- ✅ Token saved in browser localStorage

**Check Token in Browser:**
```javascript
// Open browser console (F12) and run:
localStorage.getItem('token')
localStorage.getItem('user')
```

---

### Test 3: Invalid Login

**Steps:**
1. On login page, try wrong credentials:
   - Email: "test@example.com"
   - Password: "wrongpassword"
2. Click "Sign In"

**Expected Result:**
- ✅ Error message: "Invalid email or password"
- ✅ User not logged in
- ✅ Stays on login page

---

### Test 4: Token Validation

**Steps:**
1. Login successfully
2. Copy token from browser console:
   ```javascript
   localStorage.getItem('token')
   ```
3. Test with curl:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" \
        http://localhost:5000/api/auth/me
   ```

**Expected Result:**
- ✅ Response includes user data
- ✅ Shows email, name, created_at

---

### Test 5: Protected Routes

**Steps:**
1. Try accessing dashboard data without token:
   ```bash
   curl http://localhost:5000/api/events/stats
   ```

2. Try with valid token:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" \
        http://localhost:5000/api/events/stats
   ```

**Expected Result:**
- ❌ First request: 401 Unauthorized
- ✅ Second request: Returns stats (empty for now)

---

### Test 6: Logout

**Steps:**
1. Logged in on dashboard
2. Click "Sign Out" button in header
3. You're redirected to login page
4. Try to manually reload dashboard

**Expected Result:**
- ✅ Redirects to login page
- ✅ Token removed from localStorage
- ✅ Cannot access dashboard

---

### Test 7: Password Security

**Steps:**
1. Register user with password "abc"
2. Try to submit - should fail
3. Register with "abcdef" (6 chars)

**Expected Result:**
- ❌ First attempt: Error "Password must be at least 6 characters"
- ✅ Second attempt: Registration succeeds

---

### Test 8: Email Validation

**Steps:**
1. Try to register with invalid email: "notemail"
2. Try with valid email: "user@example.com"

**Expected Result:**
- ❌ First attempt: HTML5 validation or backend error
- ✅ Second attempt: Registration succeeds

---

### Test 9: Duplicate Email

**Steps:**
1. Register with "user@example.com"
2. Try registering again with same email

**Expected Result:**
- ❌ Second attempt: Error "User with this email already exists"

---

### Test 10: Session Persistence

**Steps:**
1. Login successfully
2. Refresh browser (F5)
3. Check if still logged in

**Expected Result:**
- ✅ Stays logged in
- ✅ Token verified with backend
- ✅ Dashboard loads without re-login

---

## API Endpoints Summary

### Public Endpoints (No Auth Required)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{email, password, name?}` | `{user, token}` |
| POST | `/api/auth/login` | `{email, password}` | `{user, token}` |
| GET | `/api/health` | - | `{status: 'ok'}` |

### Protected Endpoints (Require JWT Token)

| Method | Endpoint | Header | Response |
|--------|----------|--------|----------|
| GET | `/api/auth/me` | `Authorization: Bearer <token>` | `{user}` |
| POST | `/api/auth/logout` | `Authorization: Bearer <token>` | `{message}` |
| POST | `/api/auth/verify` | `Authorization: Bearer <token>` | `{user, message}` |
| GET | `/api/events/stats` | `Authorization: Bearer <token>` | `{stats}` |

---

## Backend File Structure

```
backend/src/
├── index.js                 # Main app, routes setup
├── middleware/
│   └── auth.js             # JWT validation middleware
├── routes/
│   ├── auth.js             # Login, register, logout
│   ├── webhooks.js         # (Phase 2) Zoom webhooks
│   ├── share.js            # Share link handling
│   └── events.js           # Dashboard data
├── services/
│   ├── auth.js             # Password & token logic
│   └── linkGenerator.js    # (Phase 2) Share tokens
└── db/
    └── init.js             # Database schema & setup
```

---

## Frontend File Structure

```
frontend/src/
├── App.jsx                 # Main routing & auth logic
├── pages/
│   ├── Login.jsx          # Login form
│   ├── Signup.jsx         # Registration form
│   └── Auth.css           # Auth page styling
├── components/
│   ├── Dashboard.jsx      # (Phase 4) Main dashboard
│   ├── StatsGrid.jsx      # (Phase 4) Stats cards
│   └── RecordingsList.jsx # (Phase 4) Recording list
├── services/
│   └── authService.js     # Token management
└── App.css                # Main app styling
```

---

## Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
docker-compose ps

# If not, start it
docker-compose up -d postgres

# Verify connection
psql postgresql://zoom_user:zoom_password@localhost:5432/zoom_share
```

### "Email already exists" error
```bash
# Check existing users in database
psql postgresql://zoom_user:zoom_password@localhost:5432/zoom_share
SELECT * FROM users;

# Delete test user if needed
DELETE FROM users WHERE email = 'test@example.com';
```

### "Token is invalid"
- Make sure `JWT_SECRET` in `.env` matches what backend is using
- Tokens expire after 7 days
- Check browser localStorage has valid token

### Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check VITE_API_URL in frontend/.env
# Should be: http://localhost:5000/api

# Restart frontend: npm run dev
```

---

## Security Notes

### Password Hashing
- Passwords hashed with bcrypt (10 salt rounds)
- Hashes never logged or transmitted
- Minimum 6 characters required

### JWT Tokens
- Signed with JWT_SECRET (set in .env)
- Expires in 7 days
- Stored in browser localStorage (accessible to JavaScript)
- For production, consider httpOnly cookies instead

### Data Isolation
- Every API call validated with JWT
- User ID extracted from token
- Queries always filtered by user_id
- Prevents cross-user data access

---

## Moving to Phase 2

Once Phase 1 testing is complete:

1. ✅ Verify: Users can register & login
2. ✅ Verify: Tokens work and expire correctly  
3. ✅ Verify: Protected routes require auth
4. ✅ Verify: Logout clears tokens
5. ✅ Check: No data leaks between users

**Then proceed to Phase 2:** Zoom OAuth integration

---

## Quick Reference

### Test User Credentials
```
Email: test@example.com
Password: password123
```

### Database Connection
```
URL: postgresql://zoom_user:zoom_password@localhost:5432/zoom_share
```

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

### Frontend URL
```
http://localhost:3000
```

