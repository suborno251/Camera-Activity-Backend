import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {

  // ── Insert workers only if they don't exist
  await knex('workers')
    .insert([
      { worker_id: 'W1', name: 'Carlos Mendez'  },
      { worker_id: 'W2', name: 'Anika Sharma'   },
      { worker_id: 'W3', name: 'James Okafor'   },
      { worker_id: 'W4', name: 'Mei-Lin Zhang'  },
      { worker_id: 'W5', name: 'Dmitri Volkov'  },
      { worker_id: 'W6', name: 'Fatima Al-Nour' },
    ])
    .onConflict('worker_id')
    .ignore();

  // ── Insert workstations only if they don't exist
  await knex('workstations')
    .insert([
      { station_id: 'S1', name: 'Station Alpha',   type: 'Assembly'  },
      { station_id: 'S2', name: 'Station Beta',    type: 'Packaging' },
      { station_id: 'S3', name: 'Station Gamma',   type: 'Assembly'  },
      { station_id: 'S4', name: 'Station Delta',   type: 'QA'        },
      { station_id: 'S5', name: 'Station Epsilon', type: 'Welding'   },
      { station_id: 'S6', name: 'Station Zeta',    type: 'Packaging' },
    ])
    .onConflict('station_id')
    .ignore();

  // ── Only seed events if table is empty
  const existing = await knex('events').count('id as total').first();
  const eventCount = Number(existing?.total) || 0;

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

      events.push({ timestamp: workStart.toISOString(), worker_id: workerId, workstation_id: stationId, event_type: 'working',       confidence, count: 0 });
      events.push({ timestamp: idleStart.toISOString(), worker_id: workerId, workstation_id: stationId, event_type: 'idle',           confidence, count: 0 });
      events.push({ timestamp: workEnd.toISOString(),   worker_id: workerId, workstation_id: stationId, event_type: 'product_count',  confidence, count: pattern === 'high' ? 35 : pattern === 'medium' ? 28 : 18 });
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
    { timestamp: '2026-01-15T11:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: '2026-01-15T12:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
    { timestamp: '2026-01-15T13:00:00Z', worker_id: 'W5', workstation_id: 'S5', event_type: 'absent', confidence: 0.95, count: 0 },
  );

  await knex('events').insert(allEvents);

  console.log('   Seed complete!');
  console.log(`   Workers:      6`);
  console.log(`   Workstations: 6`);
  console.log(`   Events:       ${allEvents.length}`);
}