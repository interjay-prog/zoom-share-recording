# Project Alpha - Architecture Comparison

## POC vs. Production

### POC (Current - Single Admin)
| Aspect | Detail |
|--------|--------|
| **Accounts** | 1 (admin) |
| **Auth** | Zoom S2S OAuth (direct) |
| **Webhooks** | 1 global endpoint |
| **Users** | N/A |
| **Dashboard** | Single view |
| **Scaling** | Limited to 1 account |
| **Setup** | Admin-only |

```
Zoom Admin Account
       ↓
   Webhook
       ↓
  /api/webhooks/zoom
       ↓
   Dashboard
```

---

### Production (Multi-Account with User OAuth + Webhooks)
| Aspect | Detail |
|--------|--------|
| **Accounts** | 12+ per user |
| **Auth** | User OAuth (standard) |
| **Webhooks** | 1 per connected account |
| **Users** | Multiple (managed) |
| **Dashboard** | Multi-account unified view |
| **Scaling** | 12+ accounts per user |
| **Setup** | User self-service |

```
User Account
    ↓
    ├─ Zoom Account 1 ──→ OAuth + Webhook
    ├─ Zoom Account 2 ──→ OAuth + Webhook
    ├─ Zoom Account 3 ──→ OAuth + Webhook
    └─ Zoom Account 12 ──→ OAuth + Webhook
    ↓
/api/webhooks/zoom/{userId}/{accountId}
    ↓
  Dashboard (All 12 in one view)
```

---

## Key Differences

### Authentication
**POC:** Single S2S OAuth
```
Zoom App (Admin creds) → Direct API access
```

**Production:** User OAuth
```
User clicks "Add Account"
  → Zoom OAuth screen
  → User authorizes your app
  → Your app gets user's token
  → Store encrypted token per account
```

### Data Model
**POC:**
```sql
recordings (recording_id, url, type, ...)
share_links (token, recording_id, ...)
event_logs (event_type, recording_id, ...)
```

**Production:**
```sql
users (id, email, password)
zoom_accounts (id, user_id, zoom_token, webhook_token, ...)
recordings (id, zoom_account_id, recording_id, ...)
share_links (id, zoom_account_id, recording_id, ...)
event_logs (id, zoom_account_id, event_type, ...)
```

### Webhook Endpoint
**POC:**
```
POST /api/webhooks/zoom
  (single global endpoint)
```

**Production:**
```
POST /api/webhooks/zoom/{userId}/{accountId}
  (unique per account, validates both user + account)
```

### Dashboard
**POC:**
```
Stats (single account)
  ↓
Recordings List (single account)
  ↓
Event Log (single account)
```

**Production:**
```
Global Stats (across all 12 accounts)
  ↓
Unified Recordings List
  ├─ Recording 1 [Account 3: exec@company.com]
  ├─ Recording 2 [Account 1: sales@company.com]
  ├─ Recording 3 [Account 7: hr@company.com]
  └─ ... (all recordings, all accounts, tagged)
  ↓
Unified Event Log (all accounts, chronological)
```

---

## Feature Comparison

| Feature | POC | Production |
|---------|-----|-----------|
| Single account | ✅ | ✅ |
| Multiple accounts | ❌ | ✅ |
| Account switching | ❌ | ✅ |
| User management | ❌ | ✅ |
| OAuth flow | S2S | Standard (3-leg) |
| Webhook per account | ❌ | ✅ |
| Token management | Simple | Encrypted + Refresh |
| User isolation | N/A | ✅ |
| Data privacy | Single user | Multi-user safe |

---

## Database Migration

### Schema Changes Required

**New Tables:**
- `users` (user identity)
- `zoom_accounts` (OAuth tokens + webhooks per account)

**Modified Tables:**
- `recordings` → add `zoom_account_id` FK
- `share_links` → add `zoom_account_id` FK, `created_by_user_id` FK
- `event_logs` → add `zoom_account_id` FK

**Dropped:**
- None (can migrate POC data if needed)

### Migration Option
- **Fresh start:** New database, POC data separate
- **Best for:** Clean production launch, no legacy code

---

## Code Changes Required

### Backend Files Changed/Added

**Changed:**
- `src/index.js` → Add auth middleware
- `routes/webhooks.js` → Dynamic endpoints per account
- `routes/share.js` → Add user/account validation
- `routes/events.js` → Add user/account filtering
- `db/init.js` → New schema

**Added:**
- `src/middleware/auth.js` → JWT validation
- `src/middleware/accountAccess.js` → Account ownership check
- `src/routes/auth.js` → Login, register, logout
- `src/routes/accounts.js` → OAuth flow, account management
- `src/services/oauth.js` → Zoom OAuth client
- `src/services/encryption.js` → Token encryption
- `src/services/tokenRefresh.js` → Auto-refresh logic

### Frontend Files Changed/Added

**Changed:**
- `App.jsx` → Add auth check, routing
- `components/Dashboard.jsx` → Account selector
- `components/StatsGrid.jsx` → Global + per-account stats

**Added:**
- `pages/Login.jsx` → Login form
- `pages/Signup.jsx` → Registration form
- `pages/Accounts.jsx` → Manage connected accounts
- `components/AccountSelector.jsx` → Account dropdown/tabs
- `components/WebhookSetupGuide.jsx` → Display webhook instructions
- `services/auth.js` → JWT token handling
- `services/api.js` → API calls with auth headers

---

## Implementation Complexity

### Difficulty Level: **Medium-High**

**Simple Parts:**
- User registration/login (standard pattern)
- Database schema (straightforward relationships)
- Account selector UI (dropdown/tabs)

**Complex Parts:**
- OAuth flow (multi-step, error handling)
- Token encryption/decryption (security)
- Multi-tenant data isolation (must be bulletproof)
- Dynamic webhook validation (per-account logic)
- Token refresh automation (background job)

### Estimated Effort: **3 weeks** (one developer)
- Week 1: Auth + database
- Week 2: OAuth + accounts
- Week 3: Dashboard + webhooks

---

## Rollout Strategy

### Option A: Parallel Running
```
Keep POC running → Build production → Switch over
- Pros: No downtime, test before switch
- Cons: Maintain two systems temporarily
```

### Option B: Fresh Start
```
Build production → Migrate data if needed → Launch
- Pros: Clean start, no legacy baggage
- Cons: Data migration effort
```

**Recommendation:** Option A (parallel)
- Week 1-2: Build production in parallel with POC
- Week 2-3: Test with 12 accounts
- Week 3: Gradual user migration

---

## Backward Compatibility

**POC accounts:** Can migrate to production by:
1. Creating user account
2. Adding current account via OAuth
3. Copying share links to new system
4. Deprecating POC

**No need to support both simultaneously.**

---

## Security Implications

### POC → Production
**Additional Security Measures:**
- ✅ Password hashing (users)
- ✅ JWT signing secret
- ✅ Token encryption at rest
- ✅ User isolation (database level)
- ✅ HTTPS only (webhook, OAuth)
- ✅ CSRF protection (OAuth state parameter)
- ✅ Token refresh rotation

**Same Security:**
- ✅ Zoom webhook signature validation
- ✅ Rate limiting
- ✅ Input validation

---

## Comparison Summary

| Aspect | POC | Production |
|--------|-----|-----------|
| **Scope** | 1 account proof-of-concept | 12+ accounts per user |
| **Auth Model** | Admin (S2S OAuth) | User (Standard OAuth) |
| **Complexity** | Low | Medium-high |
| **Setup Time** | ~1 day | ~3 weeks |
| **Security** | Good | Better (user isolation) |
| **Scalability** | Limited | Designed for 12+ |
| **User Experience** | Single view | Unified multi-account |

