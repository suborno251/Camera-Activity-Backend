import { Request, Response } from 'express';
import db from '../config/database';

// ── POST /api/events — Ingest a single event
export const ingestEvent = async (req: Request, res: Response): Promise<void> => {
  const { timestamp, worker_id, workstation_id, event_type, confidence, count } = req.body;

  // ── Validate required fields
  if (!timestamp || !worker_id || !workstation_id || !event_type) {
    res.status(400).json({
      error: 'Missing required fields: timestamp, worker_id, workstation_id, event_type',
    });
    return;
  }

  // ── Validate event_type
  const validTypes = ['working', 'idle', 'absent', 'product_count'];
  if (!validTypes.includes(event_type)) {
    res.status(400).json({
      error: `Invalid event_type. Must be one of: ${validTypes.join(', ')}`,
    });
    return;
  }

  // ── Validate worker exists
  const worker = await db.worker.findUnique({ where: { worker_id } });
  if (!worker) {
    res.status(404).json({ error: `Worker ${worker_id} not found` });
    return;
  }

  // ── Validate workstation exists
  const station = await db.workstation.findUnique({ where: { station_id: workstation_id } });
  if (!station) {
    res.status(404).json({ error: `Workstation ${workstation_id} not found` });
    return;
  }

  // ── Insert event — handles duplicates via unique constraint
  try {
    const event = await db.event.create({
      data: {
        timestamp: new Date(timestamp),
        worker_id,
        workstation_id,
        event_type,
        confidence: confidence ?? 0,
        count: count ?? 0,
      },
    });

    res.status(201).json({
      message: 'Event ingested successfully',
      event_id: event.id,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(200).json({ message: 'Duplicate event ignored', duplicate: true });
      return;
    }
    throw error;
  }
};

// ── POST /api/events/batch — Ingest multiple events at once
export const ingestBatch = async (req: Request, res: Response): Promise<void> => {
  const { events } = req.body;

  if (!Array.isArray(events) || !events.length) {
    res.status(400).json({ error: 'Body must have an "events" array with at least one event' });
    return;
  }

  const validTypes = ['working', 'idle', 'absent', 'product_count'];
  const results = { 
    inserted: 0, 
    duplicates: 0, 
    errors: [] as string[] 
  };

  for (const event of events) {
    const { timestamp, worker_id, workstation_id, event_type, confidence, count } = event;

    // Basic validation per event
    if (!timestamp || !worker_id || !workstation_id || !event_type) {
      results.errors.push(`Skipped event — missing fields: ${JSON.stringify(event)}`);
      continue;
    }

    if (!validTypes.includes(event_type)) {
      results.errors.push(`Skipped event — invalid event_type "${event_type}"`);
      continue;
    }

    try {
      await db.event.create({
        data: {
          timestamp: new Date(timestamp),
          worker_id,
          workstation_id,
          event_type,
          confidence: confidence ?? 0,
          count: count ?? 0,
        },
      });
      results.inserted++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        results.duplicates++;
      } else {
        results.errors.push(`Skipped event — ${error.message}`);
      }
    }
  }

  res.status(200).json({
    message:    'Batch ingestion complete',
    inserted:   results.inserted,
    duplicates: results.duplicates,
    errors:     results.errors,
  });
};