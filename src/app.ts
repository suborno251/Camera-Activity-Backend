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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});