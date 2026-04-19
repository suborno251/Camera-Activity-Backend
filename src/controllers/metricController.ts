import type { Request, Response } from 'express';
import {
  getWorkerMetrics,
  getWorkstationMetrics,
  getFactoryMetrics,
} from '../services/metricService';

// GET /api/metrics — All metrics in one response
export const getAllMetrics = async (req: Request, res: Response): Promise<void> => {
  const [factory, workers, workstations] = await Promise.all([
    getFactoryMetrics(),
    getWorkerMetrics(),
    getWorkstationMetrics(),
  ]);

  res.json({ factory, workers, workstations });
};

// GET /api/metrics/workers
export const getWorkers = async (req: Request, res: Response): Promise<void> => {
  const workers = await getWorkerMetrics();
  res.json({ workers });
};

// GET /api/metrics/workstations
export const getWorkstations = async (req: Request, res: Response): Promise<void> => {
  const workstations = await getWorkstationMetrics();
  res.json({ workstations });
};

// GET /api/metrics/factory
export const getFactory = async (req: Request, res: Response): Promise<void> => {
  const factory = await getFactoryMetrics();
  res.json({ factory });
};