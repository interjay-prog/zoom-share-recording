import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/init.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import webhookRouter from './routes/webhooks.js';
import shareRouter from './routes/share.js';
import eventsRouter from './routes/events.js';
import zoomRouter from './routes/zoom.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Public Routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/share', shareRouter);

// Protected Routes (auth required)
app.use('/api/events', authMiddleware, eventsRouter);
app.use('/api/zoom', zoomRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize DB and start server
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
