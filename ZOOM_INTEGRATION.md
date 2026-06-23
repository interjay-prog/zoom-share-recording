# Zoom Integration Guide - POC Setup

## Prerequisites
- Zoom account with admin access
- Zoom App Marketplace credentials
- Public URL for webhook (or use ngrok for local testing)

---

## Step 1: Create a Zoom App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us)
2. Click **"Develop"** → **"Build App"**
3. Choose **"Server-to-Server OAuth"** app type
4. Fill in app details:
   - **App Name**: `Zoom Recording Share POC`
   - **Company Name**: Your company
   - **Redirect URL**: (can leave blank for S2S)

---

## Step 2: Get Credentials

1. Go to app's **"Credentials"** tab
2. Copy and save:
   - `Account ID`
   - `Client ID`
   - `Client Secret`

3. Go to **"Feature"** tab → Enable:
   - ✅ **Event Subscriptions** (for webhooks)

---

## Step 3: Set Up Webhooks

### Enable Webhooks
1. In your app's **"Feature"** tab
2. Under **"Event Subscriptions"**, toggle **ON**
3. Add endpoint URL: `https://your-domain.com/api/webhooks/zoom`
   - For local testing, use **ngrok**:
     ```bash
     ngrok http 5000
     # Copy HTTPS URL: https://xxxx-xx-xx-xx-xx.ngrok.io
     # Use: https://xxxx-xx-xx-xx-xx.ngrok.io/api/webhooks/zoom
     ```

### Subscribe to Events
1. Scroll to **"Event Subscriptions"**
2. Click **"Add New Event Subscription"**
3. Name: `Recording Events`
4. Select events:
   - ✅ `recording.started`
   - ✅ `recording.stopped`
   - ✅ `recording.registered`
   - ✅ **`recording.completed`** (this is the main one)

5. Click **"Save"**

### Get Webhook Token
1. Go to **"Event Subscriptions"** settings
2. Copy the **Verification Token** under webhook details
3. Save as `ZOOM_WEBHOOK_TOKEN` in `.env`

---

## Step 4: Enable Recording Permissions

1. In your app, go to **"Scopes"** tab
2. Add scopes:
   - `recording:read` - Read recording data
   - `recording:write` - (optional, for future features)
   - `user:read` - Read user info

3. Review and accept requested scopes

---

## Step 5: Test with ngrok

### Local Testing Setup
```bash
# Terminal 1: Start ngrok
ngrok http 5000

# Terminal 2: Navigate to backend directory
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your Zoom credentials
# ZOOM_ACCOUNT_ID=your_account_id
# ZOOM_CLIENT_ID=your_client_id
# ZOOM_CLIENT_SECRET=your_client_secret
# ZOOM_WEBHOOK_TOKEN=your_webhook_token

# Install dependencies
npm install

# Set up database (PostgreSQL must be running)
npm run migrate

# Start backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

**Access dashboard:** `http://localhost:3000`

---

## Step 6: Trigger a Test Recording

1. Schedule a test Zoom meeting in your account
2. Start recording during the meeting
3. End the recording (this triggers `recording.completed` event)
4. Watch your dashboard for the event in real-time

---

## Environment Variables Summary

### Backend (.env)
```
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
ZOOM_WEBHOOK_TOKEN=your_webhook_token
DATABASE_URL=postgresql://user:password@localhost:5432/zoom_share
API_PORT=5000
API_URL=http://localhost:5000 (or ngrok URL)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api (or ngrok URL)
```

---

## Debugging Webhooks

### Check Webhook Deliveries
1. In Zoom App settings, go **"Feature"** → **"Event Subscriptions"**
2. View **"Recent Webhook Events"** section
3. See status (success/failed) of each delivery

### Common Issues

**401 Unauthorized - Webhook signature invalid**
- ❌ Ensure `ZOOM_WEBHOOK_TOKEN` matches Zoom app settings
- ❌ Check timestamp validation (must be within 5 min window)

**404 Not Found**
- ❌ Verify webhook URL is correct and publicly accessible
- ❌ With ngrok, remember it changes on restart (update in Zoom)

**No events received**
- ❌ Verify webhook subscription is enabled
- ❌ Ensure recording actually completed (not just stopped)
- ❌ Check if event types are subscribed

---

## Next Steps (Future Iterations)

1. **Multi-account support**: Use OAuth to authenticate users and store their tokens
2. **Link expiry**: Add TTL to share tokens for security
3. **Video preview**: Generate thumbnails from recordings
4. **Analytics**: Track which links are accessed most
5. **Email notifications**: Notify users when recording is ready
6. **Download limits**: Restrict share link downloads

---

## Resources

- [Zoom API Docs](https://developers.zoom.us/docs)
- [Zoom Webhooks Guide](https://developers.zoom.us/docs/api-reference/webhook/event-types/)
- [S2S OAuth Flow](https://developers.zoom.us/docs/internal-apps/s2s-oauth/)
