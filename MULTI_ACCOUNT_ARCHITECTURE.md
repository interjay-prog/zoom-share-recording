# Project Alpha - Multi-Account Architecture

**Goal:** Single dashboard managing 12+ Zoom accounts via User OAuth + Per-User Webhooks

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│          Project Alpha Dashboard (1 user)               │
│                                                         │
│  Connected Accounts: [Account 1] [Account 2] ... [12]  │
│  Global Stats: 500 events | 450 originals | 300 links  │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │Account 1│      │Account 2│  ... │Account 12
   │Webhooks │      │Webhooks │      │Webhooks │
   └─────────┘      └─────────┘      └─────────┘
        ↓                  ↓                  ↓
   Zoom API          Zoom API          Zoom API
```

---

## Authentication Flow

### 1. User Registration
```
User signs up
  → Create local user account
  → Issue JWT session token
  → Redirect to account connection page
```

### 2. Connect Zoom Account (OAuth)
```
User clicks "Add Zoom Account"
  → Redirect to Zoom OAuth: 
     https://zoom.us/oauth/authorize?
       client_id=xxx
       redirect_uri=https://app.com/oauth/callback
       scopes=recording:read,user:read
  → User grants permission
  → Zoom redirects back with auth_code
  → Backend exchanges code for access_token + refresh_token
  → Store tokens in zoom_accounts table (encrypted)
  → Display webhook URL & setup instructions
```

---

## Database Schema Changes

### New Tables

```sql
-- Users (identity management)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Zoom Accounts (per-user Zoom connection)
CREATE TABLE zoom_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  zoom_user_id VARCHAR(255) NOT NULL,  -- From Zoom OAuth
  zoom_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,  -- Encrypted
  refresh_token TEXT NOT NULL,  -- Encrypted
  token_expires_at TIMESTAMP,
  account_name VARCHAR(255),  -- User-friendly name (e.g., "Team Account")
  webhook_token VARCHAR(255) UNIQUE,  -- For webhook validation
  webhook_verified BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, zoom_user_id)
);

-- Modified Recordings table
CREATE TABLE recordings (
  id UUID PRIMARY KEY,
  zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id),
  recording_id VARCHAR(255) NOT NULL,
  recording_url TEXT NOT NULL,
  recording_type VARCHAR(50) NOT NULL,
  duration INTEGER,
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  UNIQUE(zoom_account_id, recording_id)
);

-- Share Links (add account reference)
CREATE TABLE share_links (
  id UUID PRIMARY KEY,
  zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id),
  recording_id UUID NOT NULL REFERENCES recordings(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP
);

-- Event Logs (add account tracking)
CREATE TABLE event_logs (
  id UUID PRIMARY KEY,
  zoom_account_id UUID NOT NULL REFERENCES zoom_accounts(id),
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Webhook Strategy

### Webhook URL Per Account
Each connected Zoom account gets a unique webhook URL:
```
https://app.com/api/webhooks/zoom/{userId}/{accountId}
```

### Setup Flow
```
1. User connects Zoom account via OAuth
2. System generates webhook_token (secure random)
3. System displays:
   - Webhook URL: https://app.com/api/webhooks/zoom/{userId}/{accountId}
   - Webhook Token: (paste in Zoom settings)
4. User:
   a. Goes to Zoom app settings
   b. Adds webhook URL to their account
   c. Adds verification token
   d. System detects webhook delivery → marks as verified
```

### Webhook Validation
```javascript
// For webhook at /api/webhooks/zoom/{userId}/{accountId}
1. Validate user exists & owns account
2. Validate Zoom signature using zoom_accounts.webhook_token
3. Process recording.completed event
4. Store under zoom_accounts.id
```

---

## API Structure

### Authentication
```
POST   /api/auth/register        - Sign up
POST   /api/auth/login           - Login (returns JWT)
POST   /api/auth/refresh         - Refresh token
POST   /api/auth/logout          - Logout
```

### Account Management
```
GET    /api/accounts             - List user's connected Zoom accounts
POST   /api/accounts/connect     - Start OAuth flow
GET    /api/accounts/oauth/callback - OAuth redirect handler
GET    /api/accounts/{id}        - Get account details & webhook URL
PUT    /api/accounts/{id}        - Rename/update account
DELETE /api/accounts/{id}        - Disconnect account
POST   /api/accounts/{id}/verify-webhook - Verify webhook is working
```

### Webhooks
```
POST   /api/webhooks/zoom/{userId}/{accountId} - Zoom webhook receiver
```

### Dashboard Data
```
GET    /api/dashboard/stats       - Global stats (all accounts combined)
GET    /api/dashboard/recordings  - All recordings (all accounts, ordered by date)
GET    /api/dashboard/events      - All events (all accounts, ordered by date)
```

**Note:** No account filtering needed. Unified view shows all accounts together with account tags on each recording.

### Share Links
```
GET    /api/share/{token}           - Get recording info
POST   /api/share/{token}/redirect  - Redirect to download
```

---

## Frontend Changes

### New Pages
1. **Auth Pages**
   - `/login` - Login form
   - `/signup` - Registration form
   - `/oauth/callback` - OAuth redirect (invisible)

2. **Account Management**
   - `/accounts` - List connected accounts
   - `/accounts/connect` - Start OAuth flow
   - `/accounts/:id/details` - Account details + webhook setup
   - `/accounts/:id/setup` - Instructions for adding webhook to Zoom

3. **Dashboard**
   - `/dashboard` - Main multi-account view
   - Account selector (dropdown or tabs)
   - Global stats + per-account stats
   - Recordings list (filterable by account)

### Components
```
App
├── Auth/ (Login, Signup)
├── AccountManager/ (Connect, List, Manage accounts)
│   └── WebhookSetupGuide/ (Display webhook URL & instructions)
├── Dashboard/ (Multi-account view)
│   ├── StatsGrid/ (Global + per-account)
│   ├── AccountSelector/ (Dropdown/tabs)
│   ├── RecordingsList/ (Filtered by account)
│   ├── EventLog/ (Filtered by account)
│   └── AccountsList/ (Quick connect new)
```

---

## Data Flow: Connection & Recording

### 1. User Connects Account
```
User clicks "Add Zoom Account"
  ↓
OAuth flow → Gets access_token + refresh_token
  ↓
Store in zoom_accounts table (encrypted)
  ↓
Generate webhook_token
  ↓
Display webhook URL to user:
  "https://app.com/api/webhooks/zoom/{userId}/{accountId}"
  ↓
User adds to Zoom app settings
  ↓
Zoom sends test event → marks as verified
```

### 2. Recording Completes → Link Generated
```
User records in Zoom
  ↓
Recording complete → Zoom sends webhook
  ↓
POST /api/webhooks/zoom/{userId}/{accountId}
  ↓
Backend:
  - Validates user & account ownership
  - Validates Zoom signature
  - Checks if original recording
  - Stores in recordings table (linked to zoom_account_id)
  - Generates share token
  ↓
Frontend dashboard updates via API
  ↓
Share link ready to distribute
```

---

## Token Management

### Access Token Refresh
```
Each zoom_accounts row has:
- access_token (short-lived, ~1 hour)
- refresh_token (long-lived)
- token_expires_at

When making API calls:
1. Check if token_expires_at < NOW()
2. If expired, call Zoom refresh endpoint
3. Update access_token & token_expires_at
4. Retry original request
```

### Implementation
```javascript
// Before any Zoom API call:
async function getValidToken(accountId) {
  const account = await db.query(
    'SELECT * FROM zoom_accounts WHERE id = $1',
    [accountId]
  );
  
  if (account.token_expires_at < new Date()) {
    // Refresh token
    const newToken = await zoomClient.refreshToken(account.refresh_token);
    await db.query(
      'UPDATE zoom_accounts SET access_token = $1, token_expires_at = $2 WHERE id = $3',
      [newToken.access_token, newToken.expires_at, accountId]
    );
  }
  
  return account.access_token;
}
```

---

## Security Considerations

### Encryption
- Store Zoom tokens encrypted at rest (use Node crypto or bcryptjs)
- Never log tokens
- Use HTTPS only

### User Isolation
- Every API endpoint validates: `user_id` from JWT == account owner
- SQL queries always include `user_id` filter
- Webhooks validate both user AND account ownership

### Webhook Security
- Zoom signature validation (same as current)
- Additional validation: webhook_token from zoom_accounts table
- Rate limiting on webhook endpoints

### OAuth State
- Use OAuth state parameter to prevent CSRF
- Validate state in callback

---

## Deployment Changes

### Environment Variables
```
# Current
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
DATABASE_URL=postgresql://...

# New additions
ZOOM_OAUTH_REDIRECT_URI=https://app.com/api/auth/oauth/callback
JWT_SECRET=xxx (for signing tokens)
ENCRYPTION_KEY=xxx (for encrypting Zoom tokens)
```

---

## Migration from POC (Admin) to Production (Multi-Account)

### Option 1: Fresh Start
- Create new database schema
- Users re-connect their Zoom accounts
- Simplest, no legacy data baggage

### Option 2: Gradual Migration
- Add new tables alongside old ones
- Create migration script to backfill data
- Transition endpoints gradually
- More complex, keeps existing data

**Recommendation:** Option 1 (Fresh Start) - cleaner for production

---

## Implementation Phases

### Phase 1: User Auth & OAuth
- User registration/login system
- Zoom OAuth flow
- zoom_accounts table & storage

### Phase 2: Webhook Management
- Dynamic webhook endpoints
- Webhook setup instructions
- Account management UI

### Phase 3: Multi-Account Dashboard
- Updated dashboard to show all accounts
- Account selector/filtering
- Global stats across accounts

### Phase 4: Polish & Scaling
- Token refresh automation
- Webhook retry logic
- Performance optimization for 12+ accounts

