# Real-time Updates Implementation

This document describes the real-time updates functionality implemented for the Timely sports events management system.

## Overview

The real-time system provides live updates for:
- **Results**: Live score updates and leaderboard changes
- **Schedule**: Fixture updates and schedule changes  
- **Announcements**: Real-time event announcements and notifications

## Architecture

### WebSocket Implementation
- **Django Channels** with InMemory channel layer for development
- **Redis** support for production (configured via `REDIS_URL` environment variable)
- **Event-specific topics**: `event_<id>_results`, `event_<id>_schedule`, `event_<id>_announcements`

### SSE Fallback
- **Server-Sent Events** endpoints for environments without WebSocket support
- Available at `/api/realtime/events/<event_id>/stream/`
- Separate endpoints for each topic type

## WebSocket Endpoints

### Event Stream
```
ws://localhost:8000/ws/events/<event_id>/stream/
```

**Connection Response:**
```json
{
  "type": "connection_established",
  "message": "Connected to event <event_id> updates",
  "event_id": "<event_id>",
  "topics": ["results", "schedule", "announcements"]
}
```

**Client Messages:**
```json
// Ping/Pong
{
  "type": "ping",
  "timestamp": 1234567890
}

// Subscribe to specific topic
{
  "type": "subscribe_topic",
  "topic": "results"  // or "schedule" or "announcements"
}
```

**Server Messages:**
```json
// Results update
{
  "type": "results_update",
  "data": {
    "type": "results_update",
    "event_id": "<event_id>",
    "result": { ... },
    "leaderboard": [ ... ],
    "message": "Result finalized: Team A 2-1 Team B",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}

// Schedule update
{
  "type": "schedule_update",
  "data": {
    "type": "schedule_update",
    "event_id": "<event_id>",
    "fixture": { ... },
    "message": "Fixture updated",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}

// Announcements update
{
  "type": "announcements_update",
  "data": {
    "type": "announcements_update",
    "event_id": "<event_id>",
    "announcement": { ... },
    "message": "New announcement: Important Update",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## SSE Endpoints

### General Event Stream
```
GET /api/realtime/events/<event_id>/stream/
Content-Type: text/event-stream
```

### Specific Topic Streams
```
GET /api/realtime/events/<event_id>/stream/results/
GET /api/realtime/events/<event_id>/stream/schedule/
GET /api/realtime/events/<event_id>/stream/announcements/
```

**SSE Format:**
```
data: {"type": "connection_established", "message": "Connected to event <event_id> stream", "event_id": "<event_id>"}

data: {"type": "heartbeat", "timestamp": 1234567890}

data: {"type": "results_update", "data": { ... }}
```

## API Endpoints

### Announcements
```
POST /api/announcements/
GET /api/announcements/
PUT /api/announcements/<id>/
DELETE /api/announcements/<id>/
POST /api/announcements/broadcast/
```

### Results (with real-time broadcasting)
```
POST /api/results/
GET /api/results/
PUT /api/results/<id>/
POST /api/results/<id>/finalize/
POST /api/results/<id>/verify/
POST /api/results/<id>/lock/
```

## Configuration

### Development (InMemory)
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
```

### Production (Redis)
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [os.environ.get('REDIS_URL')],
        },
    },
}
```

## Usage Examples

### Frontend WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/events/123/stream/');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'results_update':
            updateLeaderboard(data.data.leaderboard);
            showResult(data.data.result);
            break;
        case 'schedule_update':
            updateSchedule(data.data.fixture);
            break;
        case 'announcements_update':
            showAnnouncement(data.data.announcement);
            break;
    }
};

// Send ping
ws.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
}));
```

### Frontend SSE Connection
```javascript
const eventSource = new EventSource('/api/realtime/events/123/stream/');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // Handle real-time updates
};

eventSource.onerror = function(event) {
    console.error('SSE connection error:', event);
};
```

### Creating Announcements with Broadcasting
```python
# Via API
POST /api/announcements/
{
    "event_id": "123",
    "subject": "Important Update",
    "body": "The match has been postponed due to weather.",
    "audience": "ALL"
}

# Via Python
from realtime.services import broadcast_announcement_update
from api.models import Announcement

announcement = Announcement.objects.create(
    event=event,
    subject="Live Update",
    body="Score update: 2-1",
    sent_by=user
)

broadcast_announcement_update(event.id, announcement, "Live score update")
```

## Testing

Run the test script to verify functionality:
```bash
python test_realtime.py
```

This will test:
- WebSocket connections
- SSE endpoints
- API endpoints
- Real-time broadcasting

## Security Considerations

- WebSocket connections require authentication
- SSE endpoints are public but rate-limited
- Announcements respect audience settings (ALL, PARTICIPANTS, OFFICIALS)
- All real-time updates include event_id validation

## Performance Notes

- Minimal payload serializers reduce bandwidth
- Leaderboard recomputation is optimized
- WebSocket groups are event-specific to reduce noise
- SSE includes heartbeat to detect disconnections

## Troubleshooting

### WebSocket Connection Issues
1. Check CORS settings in `settings.py`
2. Verify WebSocket URL format
3. Check authentication headers

### SSE Connection Issues
1. Verify endpoint URLs
2. Check Content-Type headers
3. Monitor browser console for errors

### Broadcasting Issues
1. Check channel layer configuration
2. Verify Redis connection (production)
3. Check signal registration

## Future Enhancements

- [ ] Redis pub/sub for better scalability
- [ ] WebSocket authentication improvements
- [ ] Rate limiting for real-time updates
- [ ] Message queuing for high-volume events
- [ ] Mobile push notifications integration
