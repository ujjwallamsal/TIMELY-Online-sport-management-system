from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Result
from common.models import DeletionRequest


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = [
        'fixture', 'score_home', 'score_away', 'winner', 'status', 'published', 'created_at'
    ]
    list_filter = ['status', 'published', 'fixture__event']
    search_fields = ['fixture__event__name', 'winner__name']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['export_selected_to_csv', 'export_selected_to_pdf']

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related('fixture__event', 'winner')
        if request.user.is_superuser:
            return qs
        if request.user.is_staff:
            return qs.filter(fixture__event__created_by=request.user)
        return qs.none()

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
