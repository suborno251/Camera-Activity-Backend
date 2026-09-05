-- CreateTable
CREATE TABLE "workers" (
    "worker_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("worker_id")
);

-- CreateTable
CREATE TABLE "workstations" (
    "station_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("station_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "worker_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_worker_id_workstation_id_timestamp_event_type_key" ON "events"("worker_id", "workstation_id", "timestamp", "event_type");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("worker_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("station_id") ON DELETE CASCADE ON UPDATE CASCADE;
