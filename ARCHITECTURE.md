# Zoom Auto-Download & Share - Architecture

## Overview
Dashboard webapp receiving Zoom recording completion events, filtering for originals, and generating shareable download links.

## System Components

### 1. **Zoom Webhook Receiver** (Backend)
- Express endpoint: `POST /api/webhooks/zoom`
- Validates Zoom webhook signature
- Listens for `recording.completed` events
- Triggers filtering & link generation

### 2. **Event Filtering** (Backend)
- Check `recording.type === "original"`
- Skip shared/edited recordings
- Log event outcome

### 3. **Shareable Link Generator** (Backend)
- Generate unique token (UUID-based)
- Store mapping: token → recording_id
- Return shareable URL: `https://app.com/share/{token}`

### 4. **Download Handler** (Backend)
- `GET /api/share/:token` → fetch recording URL from Zoom
- Return download link or redirect
- Track link usage

### 5. **Dashboard** (Frontend)
- Real-time event feed (WebSocket or polling)
- Filtered recordings list
- Generated links with copy-to-clipboard
- Stats: total received, filtered, shared

### 6. **Database** (PostgreSQL)
- `recordings`: recording_id, zoom_account_id, recording_url, type, created_at
- `share_links`: token, recording_id, created_at, expires_at, access_count

---

## Data Flow

```
Zoom → Webhook Endpoint → Validate Signature
         ↓
    Check if original? → Filter out duplicates
         ↓ (if original)
    Generate Token + Save to DB
         ↓
    Store in Postgres
         ↓
    Dashboard notifies user (WebSocket)
         ↓
User shares link → Anyone can access /share/{token}
         ↓
Link → Fetches from Zoom API → Download/Redirect
```

---

## POC Scope (Single Zoom Account)

- ✅ Zoom webhook integration (1 account)
- ✅ Filter originals only
- ✅ Generate & store tokens
- ✅ Dashboard display
- ✅ Share link handler

**Future:** Multi-account support, link expiry, analytics, video preview

---

## Environment Setup

```
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
ZOOM_WEBHOOK_TOKEN=xxx

DATABASE_URL=postgresql://user:pass@localhost:5432/zoom_share
JWT_SECRET=xxx

API_PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

---

## Deployment

**Local Dev:**
- Backend: `npm run dev` (port 5000)
- Frontend: `npm run dev` (port 3000)
- DB: Docker PostgreSQL

**Production:**
- Docker containers
- Environment secrets via platform (Railway, Render, AWS)
- PostgreSQL managed service
