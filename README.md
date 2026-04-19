# FactoryIQ — AI-Powered Worker Productivity Dashboard

A full-stack web application that ingests AI-generated CCTV events, stores them in a database, computes productivity metrics, and displays them in a real-time dashboard.

---

## Live Links

| | URL |
|---|---|
| **Frontend** | https://camera-activity-frontend.vercel.app |
| **Backend API** | https://camera-activity-backend.up.railway.app |
| **GitHub (Backend)** | https://github.com/your-username/Camera-Dashboard-Backend ← replace |
| **GitHub (Frontend)** | https://github.com/your-username/Camera-Dashboard ← replace |

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | React.js + TypeScript + Bootstrap 5 |
| Backend          | Node.js + Express.js + TypeScript   |
| Database         | PostgreSQL (via Knex.js)            |
| Containerization | Docker + Docker Compose             |
| Cloud Hosting    | Railway (Backend) + Vercel (Frontend) |

---

## Project Structure

### Backend — `Camera-Dashboard-Backend`
```
Camera-Dashboard-Backend/
├── src/
│   ├── config/
│   │   └── database.ts           # Knex PostgreSQL connection setup
│   ├── controllers/
│   │   ├── eventController.ts    # Handles POST /api/events
│   │   ├── metricController.ts   # Handles GET /api/metrics
│   │   └── seedController.ts     # Handles POST /api/seed/refresh
│   ├── routes/
│   │   ├── eventRoutes.ts
│   │   ├── metricRoutes.ts
│   │   └── seedRoutes.ts
│   ├── services/
│   │   └── metricService.ts      # All metric computation logic
│   ├── migrations/
│   │   └── 001_initial_schema.ts # Workers, workstations, events tables
│   ├── seeds/
│   │   └── seed_data.ts          # 6 workers, 6 stations, dummy events
│   └── app.ts                    # Express app entry point
├── knexfile.ts                   # Knex migration/seed configuration
├── docker-compose.yml            # PostgreSQL + Backend containers
├── Dockerfile
├── .env
├── package.json
└── tsconfig.json
```

### Frontend — `Camera-Dashboard`
```
Camera-Dashboard/
├── src/
│   ├── components/
│   │   ├── Topbar.tsx            # Header with live clock
│   │   ├── SummaryCards.tsx      # Factory-level metric cards
│   │   ├── WorkersTable.tsx      # Workers table with filters
│   │   ├── WorkstationsTable.tsx # Workstations table with filters
│   │   └── DetailModal.tsx       # Worker / station detail popup
│   ├── hooks/
│   │   └── useMetrics.ts         # Custom hook — fetches + maps API data
│   ├── types.ts                  # Shared TypeScript types
│   ├── App.tsx                   # Root component, holds state
│   ├── index.css                 # Global styles / CSS variables
│   └── main.tsx                  # React DOM entry point
├── docker-compose.yml            # Frontend container only
├── Dockerfile                    # Builds React + serves with nginx
├── nginx.conf                    # nginx config for React routing
├── .env
├── .env.production
├── package.json
└── tsconfig.json
```

---

## Database Schema

### `workers`
| Column     | Type     | Notes                 |
|------------|----------|-----------------------|
| worker_id  | TEXT     | Primary Key (e.g. W1) |
| name       | TEXT     | Worker full name       |
| created_at | DATETIME | Auto timestamp         |

### `workstations`
| Column     | Type     | Notes                               |
|------------|----------|-------------------------------------|
| station_id | TEXT     | Primary Key (e.g. S1)               |
| name       | TEXT     | Station name                        |
| type       | TEXT     | Assembly / Packaging / QA / Welding |
| created_at | DATETIME | Auto timestamp                      |

### `events`
| Column         | Type     | Notes                                        |
|----------------|----------|----------------------------------------------|
| id             | INTEGER  | Primary Key, Auto Increment (SERIAL)         |
| timestamp      | DATETIME | Event time from CCTV system                  |
| worker_id      | TEXT     | Foreign Key → workers                        |
| workstation_id | TEXT     | Foreign Key → workstations                   |
| event_type     | TEXT     | working / idle / absent / product_count      |
| confidence     | REAL     | CV model confidence score (0.0 – 1.0)        |
| count          | INTEGER  | Units produced (only for product_count type) |
| created_at     | DATETIME | Auto timestamp                               |

> **Duplicate Prevention:** A `UNIQUE` constraint on `(worker_id, workstation_id, timestamp, event_type)` ensures duplicate events are silently ignored via `INSERT ... ON CONFLICT DO NOTHING`.

---

## API Endpoints

### Events
| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/api/events`       | Ingest a single CCTV event     |
| POST   | `/api/events/batch` | Ingest multiple events at once |

**Example Request Body:**
```json
{
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "count": 1
}
```

**Event Types:**
- `working` — worker is actively working at the station
- `idle` — worker is present but not working
- `absent` — worker is not at the station
- `product_count` — units produced; `count` field carries the value

### Metrics
| Method | Endpoint                    | Description                               |
|--------|-----------------------------|-------------------------------------------|
| GET    | `/api/metrics`              | All metrics (factory + workers + stations)|
| GET    | `/api/metrics/workers`      | Worker-level metrics only                 |
| GET    | `/api/metrics/workstations` | Workstation-level metrics only            |
| GET    | `/api/metrics/factory`      | Factory-level summary only                |

### Seed / Admin
| Method | Endpoint            | Description                            |
|--------|---------------------|----------------------------------------|
| POST   | `/api/seed/refresh` | Wipe and re-seed dummy **events only** |
| GET    | `/api/seed/status`  | Check current row counts in DB         |

> **Design Decision:** `/api/seed/refresh` only resets the `events` table. Workers and workstations are **master data** — they represent real registered entities in the factory and would never be wiped in a production system. Only transactional event data is refreshed for testing purposes.

---

## Metric Definitions

### Worker-Level
| Metric         | How It's Computed                                                 |
|----------------|-------------------------------------------------------------------|
| Active Time    | Sum of time gaps between consecutive `working` events per worker  |
| Idle Time      | Sum of time gaps between consecutive `idle` events per worker     |
| Utilization %  | `(active_time / (active_time + idle_time)) * 100`                 |
| Units Produced | `SUM(count)` where `event_type = 'product_count'` for that worker |
| Units Per Hour | `units_produced / active_time_in_hours`                           |
| Status         | Derived from the worker's most recent event type                  |

### Workstation-Level
| Metric          | How It's Computed                                                     |
|-----------------|-----------------------------------------------------------------------|
| Occupancy Time  | Sum of time gaps between consecutive `working` events at that station |
| Utilization %   | `(occupancy_time / shift_duration_8hrs) * 100`                        |
| Units Produced  | `SUM(count)` where `event_type = 'product_count'` at that station     |
| Throughput Rate | `units_produced / occupancy_time_in_hours`                            |

### Factory-Level
| Metric                 | How It's Computed                                           |
|------------------------|-------------------------------------------------------------|
| Total Productive Time  | Sum of all individual worker active times                   |
| Total Production Count | `SUM(count)` across all `product_count` events              |
| Avg Production Rate    | `total_units / total_active_hours`                          |
| Avg Utilization        | Mean of all individual worker utilization percentages        |
| Active Workers         | Count of workers whose last event type is `working`         |

---

## Assumptions & Tradeoffs

- **Time gaps:** Duration is calculated as the time difference between two consecutive events for the same worker, sorted by `timestamp ASC`. The last event of a shift has no pair so it is excluded from duration calculations.
- **Max gap cap:** Any time gap exceeding **60 minutes** is ignored, to avoid inflating metrics due to shift breaks or overnight periods.
- **Shift duration:** Assumed to be **8 hours** per shift for workstation utilization percentage calculations.
- **product_count events:** These contribute only to unit totals, not to time-based calculations.
- **Absent events:** Recorded in the DB for audit purposes but excluded from active and idle time calculations.
- **Confidence threshold:** Events with `confidence < 0.5` are stored but excluded from metric computations.
- **Out-of-order events:** Metrics always sort by `timestamp ASC` before computing gaps — never by insertion order — so late-arriving events are handled correctly.
- **Master data vs transactional data:** Workers and workstations are never wiped by the seed refresh endpoint. Only events are reset.

---

## Architecture Overview

```
[AI CCTV Camera / Seed Script]
          │
          │  POST /api/events (JSON)
          ▼
  [Express.js Backend — Railway]
          │
          ├──> Validates & stores in PostgreSQL
          ├──> Computes metrics dynamically on GET requests
          │
          │  JSON Response
          ▼
    [React Frontend — Vercel]
          │
          ├──> SummaryCards        (factory metrics)
          ├──> WorkersTable        (per-worker metrics + filter)
          └──> WorkstationsTable   (per-station metrics + filter)
```

> The AI/CV model layer is **upstream and out of scope** for this application. The CCTV cameras run their own computer vision models and output structured JSON events. This app is purely responsible for ingesting, storing, computing, and displaying those events.

---

## Theoretical Questions

### 1. How Intermittent Connectivity Is Handled
- The CCTV edge device maintains a **local queue** (file-based or on-device SQLite) that buffers events when the backend is unreachable.
- On reconnection, buffered events are **batch-posted** to `POST /api/events/batch`.
- The backend uses `INSERT ... ON CONFLICT DO NOTHING` with the unique constraint to safely replay batches without creating duplicates.

### 2. How Duplicate Events Are Handled
- A composite `UNIQUE` constraint on `(worker_id, workstation_id, timestamp, event_type)` is enforced at the database level.
- The backend uses `INSERT ... ON CONFLICT DO NOTHING` so duplicates are silently skipped without throwing errors.
- Batch ingestion validates each event individually and reports back how many were inserted vs skipped.

### 3. How Out-of-Order Timestamps Are Handled
- Metrics are **never computed based on insertion order**. All queries `ORDER BY timestamp ASC` before calculating time gaps.
- Events arriving late are inserted with their original `timestamp` value — not `created_at` — ensuring they slot correctly into the timeline on the next metric computation.

### 4. How Model Versioning Would Be Added
- Add a `model_version` column to the `events` table (e.g. `"cv-model-v1.2"`).
- Each event ingested from the CCTV system carries the version of the CV model that produced it.
- Metrics can then be filtered or compared by model version to evaluate accuracy changes between deployments.

### 5. How Model Drift Would Be Detected
- Track the rolling average of `confidence` scores per model version over time.
- A significant drop in average confidence, or an unusual spike in `absent` events not correlated with known worker absences, signals potential drift.
- Set up automated alerts when the rolling average confidence drops below a defined threshold (e.g. `< 0.70`) within a time window.

### 6. How Retraining Would Be Triggered
- Drift detection logs anomalies to a dedicated monitoring table.
- A scheduled job checks this table and triggers a retraining pipeline (e.g. via webhook to MLflow or SageMaker) when the anomaly count exceeds a threshold within a rolling window.
- Post-retraining, the new model is deployed and its updated `model_version` tag appears in all subsequent events automatically.

### 7. How This Scales (5 → 100+ Cameras → Multi-Site)

| Scale        | Strategy                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------|
| 5 cameras    | Current setup — single Express server + PostgreSQL is sufficient                                  |
| 100+ cameras | Add a message queue (Redis / RabbitMQ) in front of the ingest endpoint to handle burst traffic; scale Express horizontally behind a load balancer |
| Multi-site   | Deploy one backend instance per factory site, aggregate to a central dashboard via a read-only reporting API; use a managed PostgreSQL cluster per site |

---

## Running Locally with Docker

> **Prerequisites:** Docker Desktop installed. No Node.js, PostgreSQL, or any other setup needed.

### Step 1 — Backend + PostgreSQL

```bash
git clone https://github.com/your-username/Camera-Dashboard-Backend.git
cd Camera-Dashboard-Backend

# Create .env file
cp .env.example .env

# Start PostgreSQL + Backend
docker-compose up --build
```

What happens automatically on first run:
```
1. Pulls postgres:18 image
2. Starts PostgreSQL container on port 5433
3. Waits for PostgreSQL to be healthy
4. Builds the Express backend image
5. Runs migrations (creates tables)
6. Runs seeds (inserts 6 workers, 6 stations, 105 events)
7. Starts Express server on port 3000
```

### Step 2 — Frontend

```bash
git clone https://github.com/your-username/Camera-Dashboard.git
cd Camera-Dashboard

# Start Frontend
docker-compose up --build
```

### Step 3 — Visit

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5433 |

### Reset event data (without losing master data)
```bash
curl -X POST http://localhost:3000/api/seed/refresh
```

### Check database status
```bash
curl http://localhost:3000/api/seed/status
```

---

## Environment Variables

### Backend (`.env`)
```env
PORT=3000
DB_URL=postgresql://postgres:yourpassword@<host>:<port>/railway
CORS_ORIGIN=http://localhost:80
NODE_ENV=development
```

### Frontend (`.env`)
```env
VITE_API_URL=https://camera-activity-backend.up.railway.app
```

### Frontend (`.env.production`) — used during Docker build
```env
VITE_API_URL=http://localhost:3000
```

---

## Getting Started (Without Docker)

```bash
# 1. Make sure PostgreSQL is running
docker start postgres18

# 2. Create the database (first time only)
docker exec -it postgres18 psql -U postgres -c "CREATE DATABASE factoryiq;"

# Backend
cd Camera-Dashboard-Backend
npm install
npm run migrate   # Create tables
npm run seed      # Insert master data + dummy events
npm run dev       # Start Express on http://localhost:3000

# Frontend (new terminal)
cd Camera-Dashboard
npm install
npm run dev       # Start React on http://localhost:5173
```

### Available Backend Scripts

| Script             | Description                             |
|--------------------|-----------------------------------------|
| `npm run dev`      | Start dev server with nodemon + ts-node |
| `npm run build`    | Compile TypeScript to `dist/`           |
| `npm run start`    | Run compiled JS from `dist/`            |
| `npm run migrate`  | Run Knex migrations (create tables)     |
| `npm run seed`     | Insert master data + dummy events       |
| `npm run db:reset` | Rollback + re-migrate + re-seed         |