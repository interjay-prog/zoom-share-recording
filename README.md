# Zoom Recording Auto-Download & Share

Webapp that automatically receives Zoom recording completion events, filters for original videos, and generates shareable download links.

## Project Structure

```
├── ARCHITECTURE.md          # System architecture & data flow
├── ZOOM_INTEGRATION.md      # Step-by-step Zoom setup guide
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── index.js        # Server entry point
│   │   ├── db/             # Database initialization
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   ├── package.json
│   └── .env.example
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/     # Dashboard, Stats, etc.
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml       # PostgreSQL setup
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (or Docker)
- Zoom account with admin access

### 1. Database Setup
```bash
# Option A: Docker
docker-compose up -d postgres

# Option B: Manual PostgreSQL
createdb zoom_share
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Add your Zoom credentials to .env
# Then initialize database
npm run migrate

# Start backend
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## Configuration

### Get Zoom Credentials
Follow **[ZOOM_INTEGRATION.md](./ZOOM_INTEGRATION.md)** for:
1. Creating a Zoom app
2. Getting API credentials
3. Setting up webhooks
4. Testing with ngrok locally

### Environment Variables

**Backend** (`backend/.env`):
```
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
ZOOM_WEBHOOK_TOKEN=xxx
DATABASE_URL=postgresql://localhost:5432/zoom_share
API_PORT=5000
API_URL=http://localhost:5000
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:5000/api
```

## Features Implemented (POC)

✅ **Receive Zoom Events**: Webhook endpoint validates & receives `recording.completed` events  
✅ **Filter Original Videos**: Skips duplicates/edited recordings  
✅ **Generate Share Links**: Unique tokens for each recording  
✅ **Dashboard UI**: Real-time event feed, recording list, stats  
✅ **Share Link Handler**: Public endpoint for downloading recordings  

## API Endpoints

### Webhooks
- `POST /api/webhooks/zoom` - Zoom webhook receiver

### Sharing
- `GET /api/share/:token` - Get recording info
- `POST /api/share/:token/redirect` - Redirect to download
- `GET /api/share/:token/info` - Detailed link info

### Dashboard Data
- `GET /api/events/recent` - Recent events
- `GET /api/events/stats` - Dashboard statistics
- `GET /api/events/recordings` - All recordings with links

## Testing the POC

1. **Schedule a Zoom meeting** in your account
2. **Start recording** during the meeting
3. **End the meeting/recording** (triggers webhook)
4. **Check dashboard** at `http://localhost:3000`
5. **View the generated share link** and test download

## Future Enhancements

- Multi-account support with OAuth
- Link expiration & access limits
- Video preview thumbnails
- Email notifications
- Download analytics
- Automated backup to cloud storage

## Troubleshooting

**Webhook not receiving events?**
- Verify webhook URL in Zoom app settings
- Check `ZOOM_WEBHOOK_TOKEN` matches (restart backend after change)
- Use Zoom's "Recent Webhook Events" viewer for debugging

**Database connection error?**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npm run migrate` to initialize tables

**CORS errors on frontend?**
- Frontend vite proxy should handle this automatically
- Or check `FRONTEND_URL` and `API_URL` values

## Support

See `ARCHITECTURE.md` for system design and `ZOOM_INTEGRATION.md` for Zoom setup details.
