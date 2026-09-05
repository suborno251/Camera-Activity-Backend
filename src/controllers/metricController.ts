import type { Request, Response } from 'express';
import db from '../config/database';
import {
  getWorkerMetrics,
  getWorkstationMetrics,
  getFactoryMetrics,
} from '../services/metricService';

// GET /api/metrics — All metrics in one response (optimized: fetches master data & events in single batch)
export const getAllMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [workers, workstations, events] = await Promise.all([
      db.worker.findMany(),
      db.workstation.findMany(),
      db.event.findMany({ orderBy: { timestamp: 'asc' } }),
    ]);

    const workerMetrics = await getWorkerMetrics(events, workers);
    const workstationMetrics = await getWorkstationMetrics(events, workstations);
    const factory = await getFactoryMetrics(workerMetrics, events);

    res.json({ factory, workers: workerMetrics, workstations: workstationMetrics });
  } catch (error: any) {
    console.error('Error in getAllMetrics:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// GET /api/metrics/workers
export const getWorkers = async (req: Request, res: Response): Promise<void> => {
  try {
    const workers = await getWorkerMetrics();
    res.json({ workers });
  } catch (error: any) {
    console.error('Error in getWorkers:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// GET /api/metrics/workstations
export const getWorkstations = async (req: Request, res: Response): Promise<void> => {
  try {
    const workstations = await getWorkstationMetrics();
    res.json({ workstations });
  } catch (error: any) {
    console.error('Error in getWorkstations:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// GET /api/metrics/factory
export const getFactory = async (req: Request, res: Response): Promise<void> => {
  try {
    const factory = await getFactoryMetrics();
    res.json({ factory });
  } catch (error: any) {
    console.error('Error in getFactory:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};