import type { Request, Response } from 'express';
import db from '../config/database';

const generateEvents = (
  workerId: string,
  stationId: string,
  baseDate: string,
  pattern: 'high' | 'medium' | 'low'
) => {
  const events = [];
  const hours      = pattern === 'high' ? 7 : pattern === 'medium' ? 5 : 3;
  const confidence = pattern === 'high' ? 0.92 : pattern === 'medium' ? 0.85 : 0.78;
  const unitCount  = pattern === 'high' ? 35 : pattern === 'medium' ? 28 : 18;

  for (let h = 0; h < hours; h++) {
    const workStart = new Date(`${baseDate}T08:${String(h * 8).padStart(2, '0')}:00Z`);
    const idleStart = new Date(workStart.getTime() + 45 * 60 * 1000);
    const workEnd   = new Date(workStart.getTime() + 60 * 60 * 1000);

    events.push({ timestamp: workStart.toISOString(), worker_id: workerId, workstation_id: stationId, event_type: 'working',       confidence, count: 0 });
    events.push({ timestamp: idleStart.toISOString(), worker_id: workerId, workstation_id: stationId, event_type: 'idle',           confidence, count: 0 });
    events.push({ timestamp: workEnd.toISOString(),   worker_id: workerId, workstation_id: stationId, event_type: 'product_count',  confidence, count: unitCount });
  }

  return events;
};

// POST /api/seed/refresh — Only resets events, master data stays intact
export const refreshSeed = async (req: Request, res: Response): Promise<void> => {
  // Only wipe events — workers and workstations are master data
  await db('events').del();

  const allEvents = [
    ...generateEvents('W1', 'S1', '2026-01-15', 'high'),
    ...generateEvents('W2', 'S2', '2026-01-15', 'high'),
    ...generateEvents('W3', 'S3', '2026-01-15', 'medium'),
    ...generateEvents('W4', 'S4', '2026-01-15', 'high'),
    ...generateEvents('W5', 'S5', '2026-01-15', 'low'),
    ...generateEvents('W6', 'S6', '2026-01-15', 'medium'),
    { timestamp: '2026-01-15T11:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: '2026-01-15T12:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: '2026-01-15T13:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
  ];

  await db('events').insert(allEvents);

  res.json({
    message: 'Events refreshed successfully',
    note:    'Workers and workstations were not touched — they are master data',
    events:  allEvents.length,
  });
};

// GET /api/seed/status
export const seedStatus = async (req: Request, res: Response): Promise<void> => {
  const [workers, workstations, events] = await Promise.all([
    db('workers').count('worker_id as total').first(),
    db('workstations').count('station_id as total').first(),
    db('events').count('id as total').first(),
  ]);

  res.json({
    workers:      Number(workers?.total)      || 0,
    workstations: Number(workstations?.total) || 0,
    events:       Number(events?.total)       || 0,
  });
};