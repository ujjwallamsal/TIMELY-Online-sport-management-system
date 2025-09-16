# privacy/views.py
import uuid
from datetime import timedelta
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from django.utils import timezone
from django.core.files.storage import default_storage

from .models import DataExportRequest, DataDeletionRequest, DataRetentionPolicy
from .services.exporter import export_user_data, anonymize_user_data, delete_user_data


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_data_export(request):
    """
    Request export of user data
    """
    # Check if user already has a pending or recent export
    recent_export = DataExportRequest.objects.filter(
        user=request.user,
        status__in=[DataExportRequest.Status.PENDING, DataExportRequest.Status.PROCESSING]
    ).first()
    
    if recent_export:
        return Response(
            {'error': 'You already have a pending export request'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create export request
    export_request = DataExportRequest.objects.create(
        user=request.user,
        expires_at=timezone.now() + timedelta(days=7)  # Export expires in 7 days
    )
    
    # Process export asynchronously (in production, use Celery)
    try:
        file_path = export_user_data(request.user, str(export_request.request_id))
        
        # Update request with file info
        export_request.status = DataExportRequest.Status.COMPLETED
        export_request.file_path = file_path
        export_request.processed_at = timezone.now()
        
        # Get file size
        if default_storage.exists(file_path):
            export_request.file_size = default_storage.size(file_path)
        
        export_request.save()
        
        return Response({
            'request_id': str(export_request.request_id),
            'status': export_request.status,
            'expires_at': export_request.expires_at,
            'message': 'Data export completed successfully'
        })
        
    except Exception as e:
        export_request.status = DataExportRequest.Status.FAILED
        export_request.error_message = str(e)
        export_request.save()
        
        return Response(
            {'error': f'Export failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_export_status(request, request_id):
    """
    Get status of data export request
    """
    try:
        export_request = get_object_or_404(
            DataExportRequest, 
            request_id=request_id, 
            user=request.user
        )
        
        return Response({
            'request_id': str(export_request.request_id),
            'status': export_request.status,
            'created_at': export_request.created_at,
            'processed_at': export_request.processed_at,
            'expires_at': export_request.expires_at,
            'file_size': export_request.file_size,
            'can_download': export_request.can_download(),
            'error_message': export_request.error_message
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid request ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_export(request, request_id):
    """
    Download exported data file
    """
    try:
        export_request = get_object_or_404(
            DataExportRequest, 
            request_id=request_id, 
            user=request.user
        )
        
        if not export_request.can_download():
            return Response(
                {'error': 'Export not available for download'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file from storage
        if not default_storage.exists(export_request.file_path):
            return Response(
                {'error': 'Export file not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        file = default_storage.open(export_request.file_path)
        response = HttpResponse(file.read(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="user_data_{request_id}.zip"'
        
        return response
        
    except ValueError:
        return Response(
            {'error': 'Invalid request ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_data_deletion(request):
    """
    Request deletion of user data
    """
    reason = request.data.get('reason', '')
    confirmation_text = request.data.get('confirmation_text', '')
    
    if not reason:
        return Response(
            {'error': 'Reason is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if confirmation_text != 'DELETE MY DATA':
        return Response(
            {'error': 'Confirmation text must be exactly "DELETE MY DATA"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already has a pending deletion request
    pending_request = DataDeletionRequest.objects.filter(
        user=request.user,
        status=DataDeletionRequest.Status.PENDING
    ).first()
    
    if pending_request:
        return Response(
            {'error': 'You already have a pending deletion request'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create deletion request
    deletion_request = DataDeletionRequest.objects.create(
        user=request.user,
        reason=reason,
        confirmation_text=confirmation_text
    )
    
    return Response({
        'request_id': str(deletion_request.request_id),
        'status': deletion_request.status,
        'message': 'Deletion request submitted for admin review'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_deletion_status(request, request_id):
    """
    Get status of data deletion request
    """
    try:
        deletion_request = get_object_or_404(
            DataDeletionRequest, 
            request_id=request_id, 
            user=request.user
        )
        
        return Response({
            'request_id': str(deletion_request.request_id),
            'status': deletion_request.status,
            'reason': deletion_request.reason,
            'created_at': deletion_request.created_at,
            'reviewed_at': deletion_request.reviewed_at,
            'processed_at': deletion_request.processed_at,
            'admin_notes': deletion_request.admin_notes,
            'error_message': deletion_request.error_message
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid request ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_exports(request):
    """
    Get user's export requests
    """
    exports = DataExportRequest.objects.filter(user=request.user).order_by('-created_at')
    
    export_data = []
    for export in exports:
        export_data.append({
            'request_id': str(export.request_id),
            'status': export.status,
            'created_at': export.created_at,
            'processed_at': export.processed_at,
            'expires_at': export.expires_at,
            'file_size': export.file_size,
            'can_download': export.can_download(),
            'is_expired': export.is_expired()
        })
    
    return Response({'exports': export_data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_deletions(request):
    """
    Get user's deletion requests
    """
    deletions = DataDeletionRequest.objects.filter(user=request.user).order_by('-created_at')
    
    deletion_data = []
    for deletion in deletions:
        deletion_data.append({
            'request_id': str(deletion.request_id),
            'status': deletion.status,
            'reason': deletion.reason,
            'created_at': deletion.created_at,
            'reviewed_at': deletion.reviewed_at,
            'processed_at': deletion.processed_at,
            'admin_notes': deletion.admin_notes
        })
    
    return Response({'deletions': deletion_data})


# Admin endpoints

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_deletion_requests(request):
    """
    Get all deletion requests (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    status_filter = request.query_params.get('status')
    queryset = DataDeletionRequest.objects.all()
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    deletions = queryset.order_by('-created_at')
    
    deletion_data = []
    for deletion in deletions:
        deletion_data.append({
            'id': deletion.id,
            'request_id': str(deletion.request_id),
            'user_email': deletion.user.email,
            'user_id': deletion.user.id,
            'status': deletion.status,
            'reason': deletion.reason,
            'created_at': deletion.created_at,
            'reviewed_at': deletion.reviewed_at,
            'reviewed_by': deletion.reviewed_by.get_full_name() if deletion.reviewed_by else None,
            'admin_notes': deletion.admin_notes
        })
    
    return Response({'deletions': deletion_data})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_approve_deletion(request, request_id):
    """
    Approve deletion request (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        deletion_request = get_object_or_404(DataDeletionRequest, request_id=request_id)
        
        if not deletion_request.can_be_approved():
            return Response(
                {'error': 'Request cannot be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update request
        deletion_request.status = DataDeletionRequest.Status.APPROVED
        deletion_request.reviewed_at = timezone.now()
        deletion_request.reviewed_by = request.user
        deletion_request.admin_notes = request.data.get('admin_notes', '')
        deletion_request.save()
        
        # Process deletion
        try:
            if request.data.get('anonymize', True):
                # Anonymize instead of delete
                anonymize_user_data(deletion_request.user)
                deletion_request.status = DataDeletionRequest.Status.COMPLETED
                deletion_request.processed_at = timezone.now()
                deletion_request.processed_by = request.user
                deletion_request.save()
            else:
                # Permanently delete
                delete_user_data(deletion_request.user)
                deletion_request.status = DataDeletionRequest.Status.COMPLETED
                deletion_request.processed_at = timezone.now()
                deletion_request.processed_by = request.user
                deletion_request.save()
            
            return Response({
                'message': 'Deletion request approved and processed',
                'anonymized': request.data.get('anonymize', True)
            })
            
        except Exception as e:
            deletion_request.status = DataDeletionRequest.Status.FAILED
            deletion_request.error_message = str(e)
            deletion_request.save()
            
            return Response(
                {'error': f'Deletion processing failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except ValueError:
        return Response(
            {'error': 'Invalid request ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_reject_deletion(request, request_id):
    """
    Reject deletion request (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        deletion_request = get_object_or_404(DataDeletionRequest, request_id=request_id)
        
        if not deletion_request.can_be_rejected():
            return Response(
                {'error': 'Request cannot be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update request
        deletion_request.status = DataDeletionRequest.Status.REJECTED
        deletion_request.reviewed_at = timezone.now()
        deletion_request.reviewed_by = request.user
        deletion_request.admin_notes = request.data.get('admin_notes', '')
        deletion_request.save()
        
        return Response({'message': 'Deletion request rejected'})
        
    except ValueError:
        return Response(
            {'error': 'Invalid request ID format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
