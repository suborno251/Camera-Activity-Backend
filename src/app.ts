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

const allowedOrigins = [
  // 'http://localhost:5173',
  'https://camera-activity-frontend.vercel.app',
  process.env.CORS_ORIGIN || '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/events',  eventRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/seed',    seedRoutes);

db.raw('SELECT 1')
  .then(() => console.log('PostgreSQL connected successfully'))
  .catch((err: Error) => console.error('PostgreSQL connection failed:', err.message));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'FactoryIQ Backend Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});