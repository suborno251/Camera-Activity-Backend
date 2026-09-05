import db from '../config/database';

// ── Helper: convert minutes to "Xh Ym" format
const toHoursMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

const MAX_GAP_MINUTES = 60; // Cap gaps over 60 mins (breaks, overnight)
const SHIFT_DURATION  = 480; // 8 hours in minutes

// ── Compute time spent in a given event_type per worker or station
const computeTimeMinutes = (events: any[]): number => {
  let total = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const current = new Date(events[i].timestamp).getTime();
    const next    = new Date(events[i + 1].timestamp).getTime();
    const gapMins = (next - current) / 1000 / 60;
    if (gapMins > 0 && gapMins <= MAX_GAP_MINUTES) {
      total += gapMins;
    }
  }
  return total;
};

// ════════════════════════════════════════════
//  WORKER METRICS
// ════════════════════════════════════════════
export const getWorkerMetrics = async (eventsList?: any[], workersList?: any[]) => {
  const workers = workersList || await db.worker.findMany();
  const allEvents = eventsList || await db.event.findMany({ orderBy: { timestamp: 'asc' } });

  return workers.map((worker) => {
    const workerEvents = allEvents.filter(e => e.worker_id === worker.worker_id);

    const workingEvents = workerEvents.filter(e => e.event_type === 'working');
    const idleEvents    = workerEvents.filter(e => e.event_type === 'idle');

    const activeMinutes = computeTimeMinutes(workingEvents);
    const idleMinutes   = computeTimeMinutes(idleEvents);
    const totalMinutes  = activeMinutes + idleMinutes;

    const utilization   = totalMinutes > 0
      ? Math.round((activeMinutes / totalMinutes) * 100)
      : 0;

    const unitsProduced = workerEvents
      .filter(e => e.event_type === 'product_count')
      .reduce((sum, e) => sum + (e.count || 0), 0);

    const activeHours   = activeMinutes / 60;
    const unitsPerHour  = activeHours > 0
      ? Math.round((unitsProduced / activeHours) * 10) / 10
      : 0;

    // Current status — last event type
    const lastEvent = workerEvents[workerEvents.length - 1];
    const status    = lastEvent?.event_type === 'product_count'
      ? 'working'
      : lastEvent?.event_type || 'absent';

    return {
      worker_id:      worker.worker_id,
      name:           worker.name,
      status,
      active_time:    toHoursMinutes(activeMinutes),
      idle_time:      toHoursMinutes(idleMinutes),
      utilization,
      units_produced: unitsProduced,
      units_per_hour: unitsPerHour,
    };
  });
};

// ════════════════════════════════════════════
//  WORKSTATION METRICS
// ════════════════════════════════════════════
export const getWorkstationMetrics = async (eventsList?: any[], stationsList?: any[]) => {
  const stations = stationsList || await db.workstation.findMany();
  const allEvents = eventsList || await db.event.findMany({ orderBy: { timestamp: 'asc' } });

  return stations.map((station) => {
    const stationEvents = allEvents.filter(e => e.workstation_id === station.station_id);

    const workingEvents = stationEvents.filter(e => e.event_type === 'working');
    const occupancyMins = computeTimeMinutes(workingEvents);

    const utilization = Math.round((occupancyMins / SHIFT_DURATION) * 100);

    const unitsProduced = stationEvents
      .filter(e => e.event_type === 'product_count')
      .reduce((sum, e) => sum + (e.count || 0), 0);

    const occupancyHours = occupancyMins / 60;
    const throughput     = occupancyHours > 0
      ? Math.round((unitsProduced / occupancyHours) * 10) / 10
      : 0;

    return {
      station_id:          station.station_id,
      name:                station.name,
      type:                station.type,
      occupancy_time:      toHoursMinutes(occupancyMins),
      utilization,
      units_produced:      unitsProduced,
      throughput_per_hour: throughput,
    };
  });
};

// ════════════════════════════════════════════
//  FACTORY METRICS
// ════════════════════════════════════════════
export const getFactoryMetrics = async (
  workerMetricsParam?: any[],
  eventsList?: any[]
) => {
  const allEvents = eventsList || await db.event.findMany({ orderBy: { timestamp: 'asc' } });
  const workerMetrics = workerMetricsParam || await getWorkerMetrics(allEvents);

  // Total productive time — sum all worker active times
  const totalActiveMinutes = workerMetrics.reduce((sum, w) => {
    const [h, m] = w.active_time.replace('m', '').split('h ').map(Number);
    return sum + (h * 60) + m;
  }, 0);

  // Total units produced
  const totalUnits = workerMetrics.reduce((sum, w) => sum + w.units_produced, 0);

  // Avg production rate
  const totalActiveHours  = totalActiveMinutes / 60;
  const avgProductionRate = totalActiveHours > 0
    ? Math.round((totalUnits / totalActiveHours) * 10) / 10
    : 0;

  // Avg utilization across workers
  const avgUtilization = workerMetrics.length > 0
    ? Math.round(workerMetrics.reduce((sum, w) => sum + w.utilization, 0) / workerMetrics.length)
    : 0;

  const totalEvents = allEvents.length;

  return {
    total_productive_time:  toHoursMinutes(totalActiveMinutes),
    total_production_count: totalUnits,
    avg_production_rate:    `${avgProductionRate} units/hr`,
    avg_utilization:        avgUtilization,
    total_events_ingested:  totalEvents,
    active_cameras:         6,
    active_workers:         workerMetrics.filter(w => w.status === 'working').length,
  };
};