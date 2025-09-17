# Real-time Updates Implementation

This document describes the real-time updates implementation for the Timely sports events management system.

## Overview

The system provides real-time updates for:
- **Event Results**: Live leaderboard updates when results are entered
- **Schedule Changes**: Real-time fixture updates and rescheduling
- **Announcements**: Live event announcements and notifications

## Backend Implementation

### Django Channels Setup

1. **Dependencies Added**:
   - `channels>=4.0.0`
   - `channels-redis>=4.1.0` (for production)

2. **Configuration** (`timely/settings.py`):
   ```python
   INSTALLED_APPS = [
       # ... other apps
       "channels",
   ]
   
   ASGI_APPLICATION = "timely.asgi.application"
   
   # Channel layers configuration
   CHANNEL_LAYERS = {
       'default': {
           'BACKEND': 'channels.layers.InMemoryChannelLayer',  # Dev
           # 'BACKEND': 'channels_redis.core.RedisChannelLayer',  # Prod
       },
   }
   ```

### WebSocket Consumers

**File**: `events/consumers.py`

- `EventConsumer`: Handles event-specific real-time updates
- `NotificationConsumer`: Handles general notifications

**Topics**:
- `event_{id}`: General event updates
- `event_{id}_results`: Results and leaderboard updates
- `event_{id}_schedule`: Schedule and fixture updates
- `event_{id}_announcements`: Event announcements

### SSE Fallback Endpoints

**File**: `events/sse_views.py`

Provides Server-Sent Events fallback for clients that don't support WebSockets:

- `GET /api/events/{id}/stream/` - General event stream
- `GET /api/events/{id}/stream/results/` - Results stream
- `GET /api/events/{id}/stream/schedule/` - Schedule stream
- `GET /api/events/{id}/stream/announcements/` - Announcements stream

### Real-time Service

**File**: `events/realtime_service.py`

Central service for broadcasting updates:

```python
from events.realtime_service import realtime_service

# Broadcast results update
realtime_service.broadcast_results_update(event, result)

# Broadcast schedule update
realtime_service.broadcast_schedule_update(event, fixture, action)

# Broadcast announcement
realtime_service.broadcast_announcement(event, announcement)
```

### Signal Handlers

**Files**: `results/signals.py`, `fixtures/signals.py`

Automatically broadcast updates when data changes:

- Result created/updated → Leaderboard update
- Fixture created/updated/deleted → Schedule update

## Frontend Implementation

### Real-time Hook

**File**: `src/hooks/useLiveChannel.js`

Provides a unified interface for real-time updates with automatic fallback:

```javascript
import useLiveChannel, { useEventResults, useEventSchedule, useEventAnnouncements } from '../hooks/useLiveChannel';

// General event updates
const { isConnected, lastMessage, sendMessage } = useLiveChannel(eventId);

// Specific streams
const { isConnected } = useEventResults(eventId, {
  onResultsUpdate: (data) => {
    setLeaderboard(data.leaderboard);
  }
});
```

**Features**:
- WebSocket with EventSource fallback
- Automatic reconnection
- Heartbeat monitoring
- Connection status indicators

### Updated Pages

1. **EventDetail Page** (`src/pages/EventDetail.jsx`):
   - Added tabbed interface (Details, Leaderboard, Schedule, Announcements)
   - Real-time leaderboard updates
   - Live schedule changes
   - Real-time announcements

2. **Admin Results Page** (`src/pages/AdminResults.jsx`):
   - Live leaderboard for selected events
   - Real-time connection status
   - Automatic updates when results change

3. **Matches Page** (`src/pages/Matches.jsx`):
   - Real-time schedule updates
   - Live status indicators
   - Automatic fixture updates

## Usage Examples

### Backend - Broadcasting Updates

```python
# In a view or signal handler
from events.realtime_service import realtime_service

# When a result is finalized
result.finalize(user)
realtime_service.broadcast_results_update(event, result)

# When a fixture is rescheduled
fixture.start_at = new_time
fixture.save()
realtime_service.broadcast_schedule_update(event, fixture, 'updated')

# When making an announcement
announcement = {
    'title': 'Match Delayed',
    'message': 'The 3 PM match has been delayed by 30 minutes',
    'priority': 'high',
    'timestamp': timezone.now().isoformat()
}
realtime_service.broadcast_announcement(event, announcement)
```

### Frontend - Using Real-time Updates

```javascript
// In a React component
import { useEventResults } from '../hooks/useLiveChannel';

function Leaderboard({ eventId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  
  const { isConnected, lastMessage } = useEventResults(eventId, {
    onResultsUpdate: (data) => {
      setLeaderboard(data.leaderboard);
    }
  });
  
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>{isConnected ? 'Live' : 'Offline'}</span>
      </div>
      
      {/* Render leaderboard */}
      {leaderboard.map(entry => (
        <div key={entry.team_id}>
          {entry.team_name} - {entry.pts} pts
        </div>
      ))}
    </div>
  );
}
```

## Testing

Run the test script to verify the implementation:

```bash
cd /Users/ujjwallamsal/Desktop/CAPSTONE
python test_realtime.py
```

## Development Setup

1. **Install Dependencies**:
   ```bash
   cd timely-backend
   pip install -r requirements-stripe.txt
   ```

2. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```

4. **Start Frontend**:
   ```bash
   cd timely-frontend
   npm install
   npm run dev
   ```

## Production Considerations

1. **Redis Configuration**:
   ```python
   CHANNEL_LAYERS = {
       'default': {
           'BACKEND': 'channels_redis.core.RedisChannelLayer',
           'CONFIG': {
               'hosts': [('redis-server', 6379)],
           },
       },
   }
   ```

2. **WebSocket Security**:
   - Configure CORS for WebSocket connections
   - Implement authentication for WebSocket consumers
   - Rate limiting for real-time updates

3. **Monitoring**:
   - Monitor WebSocket connection counts
   - Track message throughput
   - Set up alerts for connection failures

## API Endpoints

### WebSocket Endpoints

- `ws://localhost:8000/ws/events/{event_id}/stream/` - Event updates
- `ws://localhost:8000/ws/notifications/` - General notifications

### SSE Endpoints

- `GET /api/events/{event_id}/stream/` - Event stream
- `GET /api/events/{event_id}/stream/results/` - Results stream
- `GET /api/events/{event_id}/stream/schedule/` - Schedule stream
- `GET /api/events/{event_id}/stream/announcements/` - Announcements stream

## Message Formats

### Results Update
```json
{
  "type": "results_update",
  "data": {
    "event_id": 123,
    "leaderboard": [
      {
        "team_id": 1,
        "team_name": "Team A",
        "pts": 9,
        "w": 3,
        "d": 0,
        "l": 0,
        "gf": 12,
        "ga": 3,
        "gd": 9
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Schedule Update
```json
{
  "type": "schedule_update",
  "data": {
    "event_id": 123,
    "action": "updated",
    "fixtures": [...],
    "updated_fixture": {
      "id": 456,
      "home_team": {"id": 1, "name": "Team A"},
      "away_team": {"id": 2, "name": "Team B"},
      "start_at": "2024-01-15T15:00:00Z",
      "status": "SCHEDULED"
    }
  }
}
```

### Announcement
```json
{
  "type": "announcement_update",
  "data": {
    "event_id": 123,
    "announcement": {
      "id": 789,
      "title": "Match Delayed",
      "message": "The 3 PM match has been delayed by 30 minutes",
      "type": "info",
      "priority": "high",
      "timestamp": "2024-01-15T14:30:00Z"
    }
  }
}
```
