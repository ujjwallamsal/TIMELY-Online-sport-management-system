# Real-Time Implementation Guide

This document describes the real-time features implemented for the Timely sports events management system.

## Overview

The system provides live updates for:
- **Event Results**: Real-time leaderboard updates when results are created/updated
- **Schedule Changes**: Live fixture updates, rescheduling, and cancellations
- **Announcements**: Event-wide and team-specific announcements
- **Team Updates**: Team-specific schedule and results updates
- **Purchase Status**: Ticket purchase and status updates

## Architecture

### WebSocket Channels (Primary)
- **Event Topics**: `event_<id>_{results,schedule,announcements}`
- **Team Topics**: `team_<id>_{schedule,results}`
- **Purchase Topics**: `purchase_<id>`

### SSE Fallback (Secondary)
- HTTP-based Server-Sent Events for environments where WebSockets are not available
- Same data format as WebSocket messages

## Implementation Details

### 1. Django Channels Configuration

**Settings** (`timely/settings.py`):
```python
# Channels configuration: use Redis only if REDIS_URL is set; otherwise in-memory for dev
if os.environ.get("REDIS_URL"):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [os.environ.get('REDIS_URL')],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
```

**ASGI Configuration** (`timely/asgi.py`):
- WebSocket routing configured with authentication middleware
- Supports both HTTP and WebSocket protocols

### 2. WebSocket Consumers

#### EventConsumer (`events/consumers.py`)
- **URL**: `/ws/events/<event_id>/stream/`
- **Topics**: `event_<id>`, `event_<id>_results`, `event_<id>_schedule`, `event_<id>_announcements`
- **Permissions**: Public events or authenticated users with event access
- **Features**:
  - Subscribe to specific topics (results, schedule, announcements)
  - Ping/pong for connection health
  - Permission validation for private events

#### TeamConsumer (`teams/consumers.py`)
- **URL**: `/ws/teams/<team_id>/`
- **Topics**: `team_<id>`, `team_<id>_schedule`, `team_<id>_results`
- **Permissions**: Team members, managers, coaches, or event participants
- **Features**:
  - Team-specific schedule and results updates
  - Permission validation based on team membership

#### PurchaseConsumer (`teams/consumers.py`)
- **URL**: `/ws/purchases/<purchase_id>/`
- **Topics**: `purchase_<id>`
- **Permissions**: Only the purchaser can view their purchase
- **Features**:
  - Ticket status updates
  - Purchase confirmation notifications

### 3. SSE Fallback Endpoints

#### Event Streams (`events/sse_views.py`)
- **Event Stream**: `/api/events/<event_id>/stream/`
- **Results Stream**: `/api/events/<event_id>/stream/results/`
- **Schedule Stream**: `/api/events/<event_id>/stream/schedule/`

#### Team Streams
- **Team Stream**: `/api/teams/<team_id>/stream/`

### 4. Real-Time Broadcasting Service

#### RealtimeBroadcastService (`events/realtime_service.py`)
- **Leaderboard Broadcasting**: Automatically recomputes and broadcasts standings
- **Schedule Broadcasting**: Sends fixture updates to relevant channels
- **Announcement Broadcasting**: Distributes announcements to targeted audiences
- **Result Broadcasting**: Broadcasts individual result updates

#### Key Methods:
```python
# Broadcast updated leaderboard
realtime_service.broadcast_event_leaderboard(event_id)

# Broadcast schedule changes
realtime_service.broadcast_fixture_schedule(event_id, fixture_id=None)

# Broadcast announcements
realtime_service.broadcast_announcement(event_id, announcement_data)

# Broadcast result updates
realtime_service.broadcast_result_update(event_id, result_data)
```

### 5. Automatic Broadcasting via Signals

#### Result Updates (`events/signals.py`)
- **Trigger**: `Result` model save/update
- **Actions**:
  - Broadcast result update to event and team channels
  - Recompute and broadcast leaderboard
  - Update `LeaderboardEntry` model

#### Fixture Updates
- **Trigger**: `Fixture` model save/update/delete
- **Actions**:
  - Broadcast schedule updates to event and team channels
  - Send individual fixture updates to relevant teams

#### Announcement Broadcasting
- **Trigger**: `Announcement` model creation
- **Actions**:
  - Broadcast to event announcements channel
  - Send to targeted team channels if applicable

### 6. Announcement System

#### Announcement Model (`events/models.py`)
- **Types**: General, Schedule Change, Result Update, Weather Alert, Emergency
- **Priorities**: Low, Normal, High, Urgent
- **Targeting**: Event-wide or specific teams
- **Expiration**: Optional expiration dates
- **Broadcasting**: Automatic real-time distribution

#### API Endpoints (`events/announcement_views.py`)
- **CRUD Operations**: Full announcement management
- **Broadcasting**: Manual broadcast trigger
- **Filtering**: By event, type, priority, status
- **Permissions**: Event managers and creators only

## Usage Examples

### Frontend WebSocket Connection

```javascript
// Connect to event stream
const ws = new WebSocket('ws://localhost:8000/ws/events/1/stream/');

ws.onopen = () => {
    // Subscribe to results updates
    ws.send(JSON.stringify({ type: 'subscribe_results' }));
    
    // Subscribe to schedule updates
    ws.send(JSON.stringify({ type: 'subscribe_schedule' }));
    
    // Subscribe to announcements
    ws.send(JSON.stringify({ type: 'subscribe_announcements' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'leaderboard_update':
            updateLeaderboard(data.data.leaderboard);
            break;
        case 'schedule_update':
            updateSchedule(data.data.schedule);
            break;
        case 'announcement_update':
            showAnnouncement(data.data.announcement);
            break;
        case 'result_update':
            updateResult(data.data.result);
            break;
    }
};
```

### Frontend SSE Connection

```javascript
// Connect to results stream
const eventSource = new EventSource('/api/events/1/stream/results/');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateLeaderboard(data.leaderboard);
};

eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
};
```

### Creating Announcements

```python
# Create and broadcast announcement
announcement = Announcement.objects.create(
    event=event,
    title="Match Postponed",
    message="Due to weather conditions, the match has been postponed.",
    type=Announcement.Type.SCHEDULE,
    priority=Announcement.Priority.HIGH,
    created_by=user
)
# Broadcasting happens automatically via signals
```

## Security & Permissions

### Permission Validation
- **Event Access**: Public events or authenticated users with registration
- **Team Access**: Team members, managers, coaches, or event participants
- **Purchase Access**: Only the purchaser can view their purchase details

### Channel Group Security
- All consumers validate permissions before joining channels
- Private events require authentication and registration
- Team-specific channels require team membership or event participation

## Performance Considerations

### Broadcasting Efficiency
- **Compact Data**: Only essential data is broadcast (team IDs, scores, positions)
- **Targeted Broadcasting**: Updates only sent to relevant channels
- **Batch Updates**: Multiple updates can be batched together

### Database Optimization
- **Select Related**: Efficient queries with proper joins
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Leaderboard computation can be cached

## Testing

### Test Script
Run the test script to verify implementation:
```bash
python test_realtime_implementation.py
```

### Manual Testing
1. Start Django server: `python manage.py runserver`
2. Open WebSocket connection to event stream
3. Create/update results, fixtures, or announcements
4. Verify real-time updates are received

## Deployment Notes

### Production Configuration
- Use Redis for channel layers in production
- Configure proper CORS settings for WebSocket connections
- Set up monitoring for WebSocket connections
- Consider rate limiting for SSE endpoints

### Scaling Considerations
- Redis channel layer supports horizontal scaling
- Multiple server instances can share the same Redis instance
- Consider WebSocket connection limits per server

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check CORS settings and authentication
2. **No Updates Received**: Verify channel group subscriptions
3. **Permission Denied**: Check user permissions for event/team access
4. **SSE Not Working**: Ensure proper headers and connection handling

### Debugging
- Enable Django logging for channels
- Check Redis connection (if using Redis)
- Monitor WebSocket connection counts
- Verify signal handlers are registered

## Future Enhancements

### Planned Features
- **Push Notifications**: Mobile push notifications for important updates
- **Email Notifications**: Email alerts for critical announcements
- **Custom Filters**: User-configurable update filters
- **Analytics**: Real-time usage analytics and monitoring
- **Rate Limiting**: Advanced rate limiting for different user types
