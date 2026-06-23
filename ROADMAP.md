# Project Alpha - Roadmap

**Vision:** Single dashboard managing 12+ Zoom accounts via User OAuth + Per-Account Webhooks

---

## Architecture Evolution

### POC (Current - Single Admin Account)
```
┌──────────────────────┐
│  Your Zoom Account   │  (Admin)
│  (Webhook direct)    │
└──────────────────────┘
          ↓
┌──────────────────────┐
│  Project Alpha       │
│  (1 Dashboard)       │
└──────────────────────┘
```

### Production (Multi-Account)
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│Account 1 │  │Account 2 │  │Account 12│
│(OAuth +  │  │(OAuth +  │  │(OAuth +  │
│Webhook)  │  │Webhook)  │  │Webhook)  │
└──────────┘  └──────────┘  └──────────┘
     ↓             ↓             ↓
     └─────────────┬─────────────┘
                   ↓
          ┌──────────────────┐
          │ Project Alpha    │
          │ (1 Dashboard)    │
          │ - 12 Accounts    │
          │ - Global View    │
          │ - Per-Acct View  │
          └──────────────────┘
```

---

## Phase 1: Foundation (Weeks 1-2)

### User Authentication
- [ ] User registration/login system
- [ ] JWT token generation & validation
- [ ] Password hashing (bcrypt)
- [ ] Session management

### Database Schema
- [ ] Create `users` table
- [ ] Create `zoom_accounts` table
- [ ] Create `users_zoom_accounts` relationships
- [ ] Add encryption for token storage
- [ ] Migration scripts

**Deliverable:** Users can register & login. Database ready for OAuth.

---

## Phase 2: Account Connection (Weeks 3-4)

### Zoom OAuth Integration
- [ ] Zoom OAuth client setup
- [ ] OAuth authorization flow
- [ ] Token exchange & storage
- [ ] Token refresh mechanism
- [ ] Account disconnection

### Account Management UI
- [ ] "Add Zoom Account" button
- [ ] OAuth redirect page
- [ ] List connected accounts
- [ ] Display account details
- [ ] Disconnect account option

**Deliverable:** Users can connect their Zoom accounts via OAuth. Tokens securely stored.

---

## Phase 3: Webhook Setup (Weeks 5-6)

### Dynamic Webhooks
- [ ] Generate webhook URL per account
- [ ] Generate webhook token per account
- [ ] Per-account webhook endpoints
- [ ] Webhook signature validation (per account)

### Setup Instructions
- [ ] Display webhook URL to user
- [ ] Step-by-step Zoom setup guide
- [ ] "Test webhook" functionality
- [ ] Webhook verification status

**Deliverable:** Users see webhook URL they need to add to Zoom. Can verify it's working.

---

## Phase 4: Multi-Account Dashboard (Weeks 7-8)

### Dashboard Updates
- [ ] Global stats (across all accounts)
- [ ] Unified recordings list (all accounts, chronological)
- [ ] Account tags on each recording (shows source account)
- [ ] Unified events log (all accounts)
- [ ] Copy share link buttons (per recording)

### Data Isolation
- [ ] All API queries filter by user_id
- [ ] All API queries filter by account_id
- [ ] Share links tied to account
- [ ] No data leakage between users

**Deliverable:** Single dashboard showing all 12 accounts' recordings. Can toggle between accounts.

---

## Phase 5: Polish & Scale (Weeks 9-10)

### Performance
- [ ] Batch process webhooks
- [ ] Cache dashboard stats
- [ ] Optimize database queries
- [ ] Connection pooling

### Reliability
- [ ] Webhook retry logic
- [ ] Graceful token expiry handling
- [ ] Error logging & monitoring
- [ ] Account sync status page

### Deployment
- [ ] Docker setup updated
- [ ] Environment variables documented
- [ ] Production database setup
- [ ] SSL/TLS configured

**Deliverable:** Production-ready system supporting 12+ accounts simultaneously.

---

## Technical Debt & Optimization

### Short-term (Now)
- Simple user auth (basic JWT)
- No rate limiting
- In-memory caching

### Long-term (After Phase 5)
- OAuth 2.0 refresh token rotation
- Redis caching for stats
- Rate limiting per account
- Webhook batching
- Account health monitoring

---

## Key Dependencies & Decisions

### Decision 1: Single Zoom App vs. Multiple Apps
- **Decision:** Single app in Zoom Marketplace
- **Reasoning:** Users authorize same app → simpler management
- **Each user adds webhook URL to their own Zoom account**

### Decision 2: Token Storage
- **Decision:** Encrypt at rest in PostgreSQL
- **Reasoning:** Simpler than external vault, good for 12 accounts
- **Use:** Node.js `crypto` module with AES-256

### Decision 3: User Isolation
- **Decision:** Database-level (always filter by user_id)
- **Reasoning:** Defense in depth, prevents bugs from leaking data
- **Every query validates user ownership**

### Decision 4: Fresh Start vs. Migrate POC
- **Decision:** Fresh start
- **Reasoning:** POC tables don't fit multi-account schema
- **Keep POC running on separate database for testing**

---

## Success Criteria

✅ Phase 1: User can register & login  
✅ Phase 2: User can connect 1 Zoom account via OAuth  
✅ Phase 3: User sees webhook URL & can verify it  
✅ Phase 4: User's dashboard shows all 12 accounts' recordings  
✅ Phase 5: System handles 12+ accounts under load  

---

## Effort Estimate

| Phase | Backend | Frontend | Database | Total |
|-------|---------|----------|----------|-------|
| 1 | 2d | 1d | 1d | 4d |
| 2 | 3d | 2d | 1d | 6d |
| 3 | 2d | 2d | - | 4d |
| 4 | 1d | 2d | - | 3d |
| 5 | 2d | 1d | 1d | 4d |
| **Total** | **10d** | **8d** | **3d** | **~2.5 weeks** |

**Note:** Phase 4 is simplified (no account selector) - just unified list with tags. This saves ~2 days vs. account filtering approach.

---

## Risk Mitigation

### Risk: Token Expiry
- **Mitigation:** Automatic refresh before use
- **Test:** Manually set token_expires_at to past date, verify refresh

### Risk: Webhook Delivery Failure
- **Mitigation:** Retry logic, status page showing account sync status
- **Test:** Intentionally fail webhook, verify retry

### Risk: Data Isolation Bug
- **Mitigation:** Every query filtered by user_id, test cross-user access
- **Test:** Create 2 users, verify user 1 cannot see user 2's accounts

### Risk: Zoom Token Revocation
- **Mitigation:** Graceful error handling, show "reconnect account" prompt
- **Test:** Manually revoke token via Zoom, verify error message

---

## Quick Start (After Implementation)

For 12 Zoom accounts:

```bash
# 1. Deploy updated Project Alpha
docker-compose up -d

# 2. Create your user account
# Navigate to /signup, register with your email

# 3. For each of 12 Zoom accounts:
# - Click "Add Zoom Account"
# - Authorize via Zoom OAuth
# - Copy webhook URL
# - Add to that account's Zoom app settings
# - Click "Verify Webhook"

# 4. Done!
# Dashboard shows all 12 accounts in one view
```

