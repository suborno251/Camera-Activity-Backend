import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Workers table
  await knex.schema.createTable('workers', (table) => {
    table.string('worker_id').primary();
    table.string('name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Workstations table
  await knex.schema.createTable('workstations', (table) => {
    table.string('station_id').primary();
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Events table
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.timestamp('timestamp').notNullable();
    table.string('worker_id').notNullable().references('worker_id').inTable('workers');
    table.string('workstation_id').notNullable().references('station_id').inTable('workstations');
    table.string('event_type').notNullable(); // working | idle | absent | product_count
    table.float('confidence').defaultTo(0);
    table.integer('count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Prevent duplicate events
    table.unique(['worker_id', 'workstation_id', 'timestamp', 'event_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('workstations');
  await knex.schema.dropTableIfExists('workers');
}