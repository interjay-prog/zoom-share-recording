# Phase 2: Zoom OAuth Integration Setup

You've got your Zoom credentials! 🎉 Now let's connect them and test the OAuth flow.

---

## What Changed

✅ **Backend Updates:**
- New file: `backend/src/routes/zoom.js` - Handles OAuth flow
- Updated: `backend/.env` - Added your Zoom credentials
- Updated: `backend/src/index.js` - Registered zoom routes

✅ **Frontend Updates:**
- New file: `frontend/src/components/ZoomAccounts.jsx` - Display connected accounts
- New file: `frontend/src/components/ZoomAccounts.css` - Styling
- New file: `frontend/src/pages/ZoomCallback.jsx` - Handles OAuth redirect
- Updated: `frontend/package.json` - Added react-router-dom
- Updated: `frontend/src/App.jsx` - Added routing
- Updated: `frontend/src/components/Dashboard.jsx` - Added ZoomAccounts component

---

## Installation Steps

### Step 1: Install New Dependencies

```bash
# In frontend folder
cd frontend
npm install

# Back to project root
cd ..
```

This adds `react-router-dom` which is needed for handling the OAuth callback URL.

### Step 2: Restart Your App

**Kill the running servers** (Ctrl+C in both terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait for both to start. You should see:
```
✅ Backend: Server running on http://localhost:5000
✅ Frontend: VITE ready at http://localhost:3000
```

---

## Testing Phase 2

### 1. Go to Dashboard

Navigate to **http://localhost:3000**

Login with your test account.

### 2. See New "Connected Zoom Accounts" Section

You should see a new section at the top of the dashboard:

```
🔗 Connected Zoom Accounts
[+ Add Zoom Account]

No Zoom accounts connected yet.
Click "Add Zoom Account" to get started!
```

### 3. Click "Add Zoom Account"

This will:
1. Redirect you to **Zoom OAuth login** page
2. Ask you to authorize the app
3. Send an authorization code back to your backend
4. Backend exchanges code for access/refresh tokens
5. Stores account in database
6. Redirects you back to dashboard

### 4. Grant Permission

On the Zoom page, click **"Authorize"** to grant permission.

### 5. Success! ✅

You should see:
- ✅ Zoom account connected successfully!
- Redirect back to dashboard (2 second countdown)
- Your connected account appears in the list:
  ```
  Zoom Account - your.email@zoom.com
  Connected: [date]
  [Disconnect button]
  ```

---

## How It Works

**OAuth Flow:**
```
User clicks "Add Account"
    ↓
Frontend requests auth URL from backend
    ↓
User redirected to Zoom login page
    ↓
User grants permission
    ↓
Zoom redirects to: http://localhost:5000/api/zoom/callback?code=xxx
    ↓
Backend exchanges code for tokens
    ↓
Backend stores tokens in database
    ↓
Frontend redirected back to dashboard
    ↓
ZoomAccounts component refreshes and shows account
```

---

## Database Structure

Your connected Zoom account is stored in `zoom_accounts` table:

```
id                 (unique ID)
user_id            (links to YOUR user)
zoom_user_id       (Zoom's user ID)
zoom_email         (Zoom account email)
access_token       (for API calls - expires in 1 hour)
refresh_token      (for getting new access tokens)
token_expires_at   (when access token expires)
webhook_token      (for verifying webhooks - Phase 3)
account_name       (display name)
webhook_verified   (is webhook set up? - Phase 3)
connected_at       (when connected)
```

---

## Next Steps (Phase 3)

Once you confirm the Zoom account connection works:

1. **Set Up Webhooks** - Zoom will send events when recordings complete
2. **Receive Events** - Backend will listen for `recording.completed` events
3. **Filter Recordings** - Only process "original" recordings (not M4A/VTT)
4. **Generate Share Links** - Create downloadable links for recordings
5. **View in Dashboard** - See all recordings with download links

---

## Troubleshooting

### "Failed to connect Zoom account"

**Causes:**
- Network error
- Invalid credentials in `.env`
- CORS issue

**Fix:**
1. Check backend terminal for error messages
2. Verify `.env` has correct credentials
3. Restart backend: Ctrl+C then `npm run dev`

### "Authorization code missing"

**Cause:** Zoom didn't send the code back

**Fix:**
1. Check the URL after redirect
2. Should be: `http://localhost:3000/zoom/callback?code=xxxxx`
3. If no `code` parameter, Zoom auth failed

### Account doesn't appear after connecting

**Cause:** Database didn't save properly

**Fix:**
1. Check backend logs for errors
2. Verify JWT token is valid (should be 7 days)
3. Try again with "Add Zoom Account"

---

## Commands Reference

```bash
# Check if servers are running
ps aux | grep node

# Kill all node processes
killall node

# Fresh start
cd backend && npm run dev &
cd frontend && npm run dev

# Check database directly
sqlite3 ./zoom_share.db
> SELECT * FROM zoom_accounts;
> .quit
```

---

## What's Next?

Once this works, ping me and we'll:
- Set up webhook handling in Phase 3
- Test recording events
- Create download links

Let's go! 🚀
