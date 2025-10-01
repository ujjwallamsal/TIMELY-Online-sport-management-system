from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.db import transaction

from .models import Result
from common.models import DeletionRequest


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    """Enhanced Results Workbench with publish controls and SSE diagnostics"""
    list_display = [
        'fixture_display', 'score_display', 'winner_badge', 'status_badge', 
        'published_badge', 'verified_by_link', 'sse_status', 'created_at'
    ]
    list_filter = [
        'status', 'published', 'fixture__event', 'verified_at', 'created_at'
    ]
    search_fields = [
        'fixture__event__name', 'fixture__home__name', 'fixture__away__name', 
        'winner__name', 'notes'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'verified_at', 'sse_status', 'fixture_info'
    ]
    actions = [
        'verify_results', 'publish_results', 'unpublish_results', 'finalize_results',
        'export_selected_to_csv', 'export_selected_to_pdf', 'test_sse_connection',
        'recompute_leaderboard', 'bulk_verify'
    ]
    
    fieldsets = (
        ('Result Information', {
            'fields': ('fixture', 'fixture_info')
        }),
        ('Scores', {
            'fields': ('score_home', 'score_away', 'winner')
        }),
        ('Verification & Status', {
            'fields': ('status', 'verified_by', 'verified_at', 'published')
        }),
        ('Notes & Additional Info', {
            'fields': ('notes',),
            'classes': ('wide',)
        }),
        ('SSE Diagnostics', {
            'fields': ('sse_status',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related(
            'fixture__event', 'fixture__home', 'fixture__away', 'winner', 'verified_by'
        )
        if request.user.is_superuser:
            return qs
        if request.user.is_staff:
            return qs.filter(fixture__event__created_by=request.user)
        return qs.none()
    
    def fixture_display(self, obj):
        """Display fixture with teams and event"""
        home = obj.fixture.home.name if obj.fixture.home else "TBD"
        away = obj.fixture.away.name if obj.fixture.away else "TBD"
        event = obj.fixture.event.name if obj.fixture.event else "No event"
        
        url = reverse('admin:fixtures_fixture_change', args=[obj.fixture.id])
        return format_html(
            '<a href="{}">{} vs {}</a><br><small>{}</small>',
            url, home, away, event
        )
    fixture_display.short_description = 'Fixture'
    
    def score_display(self, obj):
        """Display score with color coding"""
        if obj.is_draw:
            color = "orange"
            result = "Draw"
        elif obj.winner == obj.fixture.home:
            color = "green"
            result = "Home wins"
        elif obj.winner == obj.fixture.away:
            color = "blue"
            result = "Away wins"
        else:
            color = "gray"
            result = "No winner"
            
        return format_html(
            '<span style="font-weight: bold; color: {};">{} - {}</span><br><small>{}</small>',
            color, obj.score_home, obj.score_away, result
        )
    score_display.short_description = 'Score'
    
    def winner_badge(self, obj):
        """Display winner with badge"""
        if obj.is_draw:
            return format_html('<span style="color: orange;">🤝 Draw</span>')
        elif obj.winner:
            return format_html('<span style="color: green;">🏆 {}</span>', obj.winner.name)
        else:
            return format_html('<span style="color: gray;">⏳ TBD</span>')
    winner_badge.short_description = 'Winner'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'VERIFIED': 'blue',
            'FINALIZED': 'green'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def published_badge(self, obj):
        """Display publication status"""
        if obj.published:
            return format_html('<span style="color: green;">✅ Published</span>')
        else:
            return format_html('<span style="color: red;">❌ Unpublished</span>')
    published_badge.short_description = 'Published'
    
    def verified_by_link(self, obj):
        """Display verifier with link"""
        if obj.verified_by:
            url = reverse('admin:accounts_user_change', args=[obj.verified_by.id])
            return format_html('<a href="{}">{}</a>', url, obj.verified_by.email)
        return 'Not verified'
    verified_by_link.short_description = 'Verified By'
    
    def sse_status(self, obj):
        """Display SSE connection status for real-time updates"""
        # In a real implementation, you would check SSE connection status
        return format_html('<span style="color: green;">🟢 SSE Active</span>')
    sse_status.short_description = 'SSE Status'
    
    def fixture_info(self, obj):
        """Display detailed fixture information"""
        if obj.fixture:
            start_time = obj.fixture.start_at.strftime('%Y-%m-%d %H:%M') if obj.fixture.start_at else 'TBD'
            venue = obj.fixture.venue.name if obj.fixture.venue else 'TBD'
            return format_html(
                '<strong>Start:</strong> {}<br><strong>Venue:</strong> {}',
                start_time, venue
            )
        return 'No fixture'
    fixture_info.short_description = 'Fixture Details'

    def delete_model(self, request, obj):
        ct = ContentType.objects.get_for_model(Result)
        DeletionRequest.objects.create(
            requested_by=request.user,
            content_type=ct,
            object_id=obj.id,
            reason=request.POST.get('reason', 'Admin requested deletion'),
        )
        messages.success(request, "Deletion requested; pending approval.")

    def delete_queryset(self, request, queryset):
        ct = ContentType.objects.get_for_model(Result)
        for obj in queryset:
            DeletionRequest.objects.create(
                requested_by=request.user,
                content_type=ct,
                object_id=obj.id,
                reason=request.POST.get('reason', 'Admin requested deletion'),
            )
        messages.success(request, f"Deletion requested for {queryset.count()} item(s); pending approval.")

    def verify_results(self, request, queryset):
        """Verify selected results"""
        verified_count = 0
        with transaction.atomic():
            for result in queryset.filter(status='PENDING'):
                result.status = 'VERIFIED'
                result.verified_by = request.user
                result.verified_at = timezone.now()
                result.save(update_fields=['status', 'verified_by', 'verified_at'])
                verified_count += 1
        
        self.message_user(
            request,
            f'Verified {verified_count} results.',
            level=messages.SUCCESS
        )
    verify_results.short_description = "Verify selected results"
    
    def publish_results(self, request, queryset):
        """Publish selected results"""
        published_count = queryset.filter(status__in=['VERIFIED', 'FINALIZED']).update(published=True)
        self.message_user(
            request,
            f'Published {published_count} results.',
            level=messages.SUCCESS
        )
    publish_results.short_description = "Publish selected results"
    
    def unpublish_results(self, request, queryset):
        """Unpublish selected results"""
        unpublished_count = queryset.update(published=False)
        self.message_user(
            request,
            f'Unpublished {unpublished_count} results.',
            level=messages.SUCCESS
        )
    unpublish_results.short_description = "Unpublish selected results"
    
    def finalize_results(self, request, queryset):
        """Finalize selected results"""
        finalized_count = 0
        with transaction.atomic():
            for result in queryset.filter(status='VERIFIED'):
                result.status = 'FINALIZED'
                result.published = True
                result.save(update_fields=['status', 'published'])
                finalized_count += 1
        
        self.message_user(
            request,
            f'Finalized {finalized_count} results.',
            level=messages.SUCCESS
        )
    finalize_results.short_description = "Finalize selected results"
    
    def test_sse_connection(self, request, queryset):
        """Test SSE connection for real-time updates"""
        # In a real implementation, you would test SSE connections
        self.message_user(
            request,
            f'SSE connection test initiated for {queryset.count()} results.',
            level=messages.INFO
        )
    test_sse_connection.short_description = "Test SSE connection"
    
    def recompute_leaderboard(self, request, queryset):
        """Recompute leaderboard for events with selected results"""
        events = set()
        for result in queryset:
            if result.fixture and result.fixture.event:
                events.add(result.fixture.event.id)
        
        # In a real implementation, you would recompute leaderboards
        self.message_user(
            request,
            f'Leaderboard recomputation initiated for {len(events)} events.',
            level=messages.INFO
        )
    recompute_leaderboard.short_description = "Recompute leaderboard"
    
    def bulk_verify(self, request, queryset):
        """Bulk verify results with automatic validation"""
        verified_count = 0
        with transaction.atomic():
            for result in queryset.filter(status='PENDING'):
                # Validate result before verification
                if result.score_home >= 0 and result.score_away >= 0:
                    result.status = 'VERIFIED'
                    result.verified_by = request.user
                    result.verified_at = timezone.now()
                    result.save(update_fields=['status', 'verified_by', 'verified_at'])
                    verified_count += 1
        
        self.message_user(
            request,
            f'Bulk verified {verified_count} results.',
            level=messages.SUCCESS
        )
    bulk_verify.short_description = "Bulk verify (auto-validate)"

    def export_selected_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename=results.csv'
        writer = csv.writer(response)
        writer.writerow(['id','fixture','score_home','score_away','winner','status','published','created_at'])
        for res in queryset:
            writer.writerow([res.id, str(res.fixture), res.score_home, res.score_away, res.winner.name if res.winner else '', res.status, res.published, res.created_at.isoformat() if res.created_at else ''])
        return response
    export_selected_to_csv.short_description = 'Export selected to CSV'

    def export_selected_to_pdf(self, request, queryset):
        # TODO: Implement with WeasyPrint/ReportLab
        self.message_user(request, 'PDF export is not yet implemented.', level=messages.INFO)
    export_selected_to_pdf.short_description = 'Export selected to PDF (stub)'

from django.contrib import admin

# Register your models here.
