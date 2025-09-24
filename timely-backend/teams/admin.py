# teams/admin.py
from django.contrib import admin
from .models import Team, TeamMember

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    fields = ['athlete', 'jersey_no', 'position', 'is_captain']
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
    list_display = ['athlete', 'team', 'jersey_no', 'position', 'is_captain']
    list_filter = ['team', 'is_captain', 'position']
    search_fields = ['athlete__email', 'team__name', 'jersey_no']
    ordering = ['team', 'jersey_no']
    raw_id_fields = ['athlete', 'team']
    readonly_fields = ['created_at']