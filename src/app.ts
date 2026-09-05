import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import db from './config/database';
import eventRoutes  from './routes/eventRoutes';
import metricRoutes from './routes/metricRoutes';
import seedRoutes   from './routes/seedRoutes';

const app  = express();
const PORT = process.env.PORT || 3000;

const corsEnv = process.env.CORS_ORIGIN || '';
const allowedOrigins = corsEnv
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/events',  eventRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/seed',    seedRoutes);

const initDb = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('PostgreSQL connected successfully');

    try {
      await db.worker.count();
    } catch (err: any) {
      if (err.code === 'P2021') {
        console.log('Tables do not exist. Automatically applying migrations and seeds...');
        const { execSync } = require('child_process');
        execSync('npx prisma migrate deploy && npm run seed', { stdio: 'inherit' });
        console.log('Database initialized and seeded successfully.');
      }
    }
  } catch (err: any) {
    console.error('PostgreSQL connection failed:', err.message);
  }
};

initDb();

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'FactoryIQ Backend Running' });
});

// ── Keep-Alive Ping (every 12 minutes to keep Render free tier awake)
const KEEP_ALIVE_INTERVAL = 12 * 60 * 1000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://camera-activity-backend.onrender.com';

const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER_EXTERNAL_URL) {
    return;
  }

  console.log(`Keep-alive ping scheduled every 12 minutes for ${RENDER_URL}`);
  setInterval(async () => {
    try {
      const https = await import('https');
      https.get(RENDER_URL, (res) => {
        console.log(`[Keep-Alive] Ping sent to ${RENDER_URL} — status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[Keep-Alive] Ping failed:', err.message);
      });
    } catch (err: any) {
      console.error('[Keep-Alive] Error:', err.message);
    }
  }, KEEP_ALIVE_INTERVAL);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive();
});