!#usr/bin/bash 

# 1. Check seed status
curl https://camera-activity-backend.up.railway.app/api/seed/status

# 2. Check all metrics
curl https://camera-activity-backend.up.railway.app/api/metrics

# 3. Refresh seed data
curl -X POST https://camera-activity-backend.up.railway.app/api/seed/refresh

# 4. Ingest a test event
curl -X POST https://camera-activity-backend.up.railway.app/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-15T10:15:00Z",
    "worker_id": "W1",
    "workstation_id": "S1",
    "event_type": "working",
    "confidence": 0.93,
    "count": 0
  }'

# 5. Send duplicate to test conflict handling
curl -X POST https://camera-activity-backend.up.railway.app/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-15T10:15:00Z",
    "worker_id": "W1",
    "workstation_id": "S1",
    "event_type": "working",
    "confidence": 0.93,
    "count": 0
  }'