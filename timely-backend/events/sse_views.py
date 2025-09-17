# events/sse_views.py
import json
import time
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from .models import Event


class EventSSEView(View):
    """Server-Sent Events endpoint for real-time event updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def get(self, request, event_id):
        """Stream real-time updates for a specific event"""
        event = get_object_or_404(Event, id=event_id)
        
        def event_stream():
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id})}\n\n"
            
            # Keep connection alive and send periodic heartbeats
            last_heartbeat = time.time()
            heartbeat_interval = 30  # seconds
            
            try:
                while True:
                    current_time = time.time()
                    
                    # Send heartbeat if needed
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check for updates (this would be replaced with actual channel layer integration)
                    # For now, we'll just sleep and send heartbeats
                    time.sleep(1)
                    
            except GeneratorExit:
                # Client disconnected
                pass
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventResultsSSEView(View):
    """SSE endpoint specifically for event results updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def get(self, request, event_id):
        """Stream real-time results updates for a specific event"""
        event = get_object_or_404(Event, id=event_id)
        
        def results_stream():
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id, 'stream': 'results'})}\n\n"
            
            # Keep connection alive and send periodic heartbeats
            last_heartbeat = time.time()
            heartbeat_interval = 30  # seconds
            
            try:
                while True:
                    current_time = time.time()
                    
                    # Send heartbeat if needed
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check for results updates (this would be replaced with actual channel layer integration)
                    time.sleep(1)
                    
            except GeneratorExit:
                # Client disconnected
                pass
        
        response = StreamingHttpResponse(
            results_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventScheduleSSEView(View):
    """SSE endpoint specifically for event schedule updates"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def get(self, request, event_id):
        """Stream real-time schedule updates for a specific event"""
        event = get_object_or_404(Event, id=event_id)
        
        def schedule_stream():
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id, 'stream': 'schedule'})}\n\n"
            
            # Keep connection alive and send periodic heartbeats
            last_heartbeat = time.time()
            heartbeat_interval = 30  # seconds
            
            try:
                while True:
                    current_time = time.time()
                    
                    # Send heartbeat if needed
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check for schedule updates (this would be replaced with actual channel layer integration)
                    time.sleep(1)
                    
            except GeneratorExit:
                # Client disconnected
                pass
        
        response = StreamingHttpResponse(
            schedule_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response


class EventAnnouncementsSSEView(View):
    """SSE endpoint specifically for event announcements"""
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET"]))
    def get(self, request, event_id):
        """Stream real-time announcements for a specific event"""
        event = get_object_or_404(Event, id=event_id)
        
        def announcements_stream():
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id, 'stream': 'announcements'})}\n\n"
            
            # Keep connection alive and send periodic heartbeats
            last_heartbeat = time.time()
            heartbeat_interval = 30  # seconds
            
            try:
                while True:
                    current_time = time.time()
                    
                    # Send heartbeat if needed
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': current_time})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check for announcement updates (this would be replaced with actual channel layer integration)
                    time.sleep(1)
                    
            except GeneratorExit:
                # Client disconnected
                pass
        
        response = StreamingHttpResponse(
            announcements_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        
        return response
