import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response } from 'express';
import db from './config/database';
import eventRoutes  from './routes/eventRoutes';
import metricRoutes from './routes/metricRoutes';
import seedRoutes   from './routes/seedRoutes';

const app  = express();
const PORT = process.env.PORT || 3000;

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

// Server running
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});