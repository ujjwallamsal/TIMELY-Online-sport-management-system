# teams/admin.py
from django.contrib import admin
from .models import Team, TeamMember

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1
    fields = ['athlete', 'jersey_no', 'role', 'status', 'position', 'is_captain']
    raw_id_fields = ['athlete']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'manager', 'coach', 'created_at']
    list_filter = ['event', 'created_at']
    search_fields = ['name', 'description', 'manager__email', 'coach__email']
    ordering = ['name']
    raw_id_fields = ['manager', 'coach', 'event']
    inlines = [TeamMemberInline]
    readonly_fields = ['created_at']


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'team', 'jersey_no', 'role', 'status', 'is_captain', 'joined_date']
    list_filter = ['team', 'role', 'status', 'is_captain', 'joined_date']
    search_fields = ['athlete__email', 'team__name', 'jersey_no', 'full_name']
    ordering = ['team', 'jersey_no']
    raw_id_fields = ['athlete', 'team']
    readonly_fields = ['joined_date', 'created_at', 'updated_at']
    fieldsets = (
        ('Team Information', {
            'fields': ('team', 'athlete')
        }),
        ('Member Details', {
            'fields': ('full_name', 'jersey_no', 'role', 'status', 'position', 'date_of_birth')
        }),
        ('Permissions', {
            'fields': ('is_captain', 'can_manage_team', 'can_edit_results'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('joined_date', 'left_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )