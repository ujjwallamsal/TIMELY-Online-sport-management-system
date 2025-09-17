# realtime/views.py
import json
import asyncio
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from events.models import Event
import time

User = get_user_model()


class EventStreamView(View):
    """SSE fallback endpoint for event real-time updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request, event_id):
        """Stream real-time updates for an event via SSE"""
        event = get_object_or_404(Event, id=event_id)
        
        def event_generator():
            """Generate SSE events"""
            channel_layer = get_channel_layer()
            
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connection_established', 'message': f'Connected to event {event_id} stream', 'event_id': event_id})}\n\n"
            
            # Set up event groups
            results_group = f"event_{event_id}_results"
            schedule_group = f"event_{event_id}_schedule"
            announcements_group = f"event_{event_id}_announcements"
            
            # Create a simple event listener
            # In a real implementation, you'd want to use Redis pub/sub or similar
            # For now, we'll simulate with periodic updates
            last_update = time.time()
            
            while True:
                try:
                    # Check for updates every 5 seconds
                    time.sleep(5)
                    
                    # Send a heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                    
                    # In a real implementation, you would:
                    # 1. Subscribe to Redis channels
                    # 2. Listen for actual updates
                    # 3. Forward them as SSE events
                    
                except GeneratorExit:
                    # Client disconnected
                    break
                except Exception as e:
                    # Send error and break
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            event_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventStreamResultsView(View):
    """SSE endpoint specifically for results updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request, event_id):
        """Stream results updates for an event via SSE"""
        event = get_object_or_404(Event, id=event_id)
        
        def results_generator():
            """Generate SSE events for results"""
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connection_established', 'message': f'Connected to event {event_id} results stream', 'event_id': event_id})}\n\n"
            
            # In a real implementation, you would:
            # 1. Subscribe to Redis channels for results updates
            # 2. Listen for actual result changes
            # 3. Forward them as SSE events
            
            while True:
                try:
                    # Send a heartbeat every 10 seconds
                    time.sleep(10)
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                    
                except GeneratorExit:
                    break
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            results_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventStreamScheduleView(View):
    """SSE endpoint specifically for schedule updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request, event_id):
        """Stream schedule updates for an event via SSE"""
        event = get_object_or_404(Event, id=event_id)
        
        def schedule_generator():
            """Generate SSE events for schedule"""
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connection_established', 'message': f'Connected to event {event_id} schedule stream', 'event_id': event_id})}\n\n"
            
            # In a real implementation, you would:
            # 1. Subscribe to Redis channels for schedule updates
            # 2. Listen for actual schedule changes
            # 3. Forward them as SSE events
            
            while True:
                try:
                    # Send a heartbeat every 15 seconds
                    time.sleep(15)
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                    
                except GeneratorExit:
                    break
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            schedule_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventStreamAnnouncementsView(View):
    """SSE endpoint specifically for announcements updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request, event_id):
        """Stream announcements updates for an event via SSE"""
        event = get_object_or_404(Event, id=event_id)
        
        def announcements_generator():
            """Generate SSE events for announcements"""
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connection_established', 'message': f'Connected to event {event_id} announcements stream', 'event_id': event_id})}\n\n"
            
            # In a real implementation, you would:
            # 1. Subscribe to Redis channels for announcements updates
            # 2. Listen for actual announcement changes
            # 3. Forward them as SSE events
            
            while True:
                try:
                    # Send a heartbeat every 20 seconds
                    time.sleep(20)
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                    
                except GeneratorExit:
                    break
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            announcements_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response
