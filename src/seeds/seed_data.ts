import db from '../config/database';

export async function seed(): Promise<void> {
  // ── Insert workers only if they don't exist
  const workers = [
    { worker_id: 'W1', name: 'Carlos Mendez'  },
    { worker_id: 'W2', name: 'Anika Sharma'   },
    { worker_id: 'W3', name: 'James Okafor'   },
    { worker_id: 'W4', name: 'Mei-Lin Zhang'  },
    { worker_id: 'W5', name: 'Dmitri Volkov'  },
    { worker_id: 'W6', name: 'Fatima Al-Nour' },
  ];

  for (const worker of workers) {
    await db.worker.upsert({
      where: { worker_id: worker.worker_id },
      update: {},
      create: worker,
    });
  }

  // ── Insert workstations only if they don't exist
  const stations = [
    { station_id: 'S1', name: 'Station Alpha',   type: 'Assembly'  },
    { station_id: 'S2', name: 'Station Beta',    type: 'Packaging' },
    { station_id: 'S3', name: 'Station Gamma',   type: 'Assembly'  },
    { station_id: 'S4', name: 'Station Delta',   type: 'QA'        },
    { station_id: 'S5', name: 'Station Epsilon', type: 'Welding'   },
    { station_id: 'S6', name: 'Station Zeta',    type: 'Packaging' },
  ];

  for (const station of stations) {
    await db.workstation.upsert({
      where: { station_id: station.station_id },
      update: {},
      create: station,
    });
  }

  // ── Only seed events if table is empty
  const eventCount = await db.event.count();

  if (eventCount > 0) {
    console.log(` Skipping event seed — ${eventCount} events already exist`);
    return;
  }

  const generateEvents = (
    workerId: string,
    stationId: string,
    baseDate: string,
    pattern: 'high' | 'medium' | 'low'
  ) => {
    const events = [];
    const hours      = pattern === 'high' ? 7 : pattern === 'medium' ? 5 : 3;
    const confidence = pattern === 'high' ? 0.92 : pattern === 'medium' ? 0.85 : 0.78;

    for (let h = 0; h < hours; h++) {
      const workStart = new Date(`${baseDate}T08:${String(h * 8).padStart(2, '0')}:00Z`);
      const idleStart = new Date(workStart.getTime() + 45 * 60 * 1000);
      const workEnd   = new Date(workStart.getTime() + 60 * 60 * 1000);

      events.push({ timestamp: workStart, worker_id: workerId, workstation_id: stationId, event_type: 'working',       confidence, count: 0 });
      events.push({ timestamp: idleStart, worker_id: workerId, workstation_id: stationId, event_type: 'idle',           confidence, count: 0 });
      events.push({ timestamp: workEnd,   worker_id: workerId, workstation_id: stationId, event_type: 'product_count',  confidence, count: pattern === 'high' ? 35 : pattern === 'medium' ? 28 : 18 });
    }

    return events;
  };

  const allEvents = [
    ...generateEvents('W1', 'S1', '2026-01-15', 'high'),
    ...generateEvents('W2', 'S2', '2026-01-15', 'high'),
    ...generateEvents('W3', 'S3', '2026-01-15', 'medium'),
    ...generateEvents('W4', 'S4', '2026-01-15', 'high'),
    ...generateEvents('W5', 'S5', '2026-01-15', 'low'),
    ...generateEvents('W6', 'S6', '2026-01-15', 'medium'),
  ];

  allEvents.push(
    { timestamp: new Date('2026-01-15T11:00:00Z'), worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: new Date('2026-01-15T12:00:00Z'), worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: new Date('2026-01-15T13:00:00Z'), worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
  );

  await db.event.createMany({
    data: allEvents,
    skipDuplicates: true,
  });

  console.log('   Seed complete!');
  console.log(`   Workers:      6`);
  console.log(`   Workstations: 6`);
  console.log(`   Events:       ${allEvents.length}`);
}

if (require.main === module) {
  seed()
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
}