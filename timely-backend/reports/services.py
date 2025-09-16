# reports/services.py
from __future__ import annotations

from typing import Dict, List, Any, Optional
from django.db.models import Q, Sum, Count, Avg, F, Prefetch
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta

from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder, Ticket
from results.models import Result
from fixtures.models import Fixture
from api.models import Team
from accounts.models import User


class ReportsService:
    """Service class for generating report data with optimized queries"""
    
    @staticmethod
    def get_registrations_data(
        event_id: Optional[int] = None,
        sport: Optional[str] = None,
        division_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Get registrations report data with filtering and pagination
        """
        # Base queryset with optimizations
        queryset = Registration.objects.select_related(
            'user', 'event', 'division'
        ).prefetch_related(
            'user__kyc_profile'
        )
        
        # Apply RBAC filtering
        if user and not user.is_superuser:
            if user.role == User.Role.ORGANIZER:
                queryset = queryset.filter(event__created_by=user)
            else:
                # Non-organizers can only see their own registrations
                queryset = queryset.filter(user=user)
        
        # Apply filters
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if sport:
            queryset = queryset.filter(event__sport__iexact=sport)
        
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        
        if date_from:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_from, str):
                    if 'T' in date_from or 'Z' in date_from:
                        date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    else:
                        date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                else:
                    date_from_dt = date_from
                queryset = queryset.filter(submitted_at__gte=date_from_dt)
            except ValueError:
                pass
        
        if date_to:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_to, str):
                    if 'T' in date_to or 'Z' in date_to:
                        date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    else:
                        date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
                else:
                    date_to_dt = date_to
                queryset = queryset.filter(submitted_at__lte=date_to_dt)
            except ValueError:
                pass
        
        # Order by submission date
        queryset = queryset.order_by('-submitted_at')
        
        return {
            'queryset': queryset,
            'total_count': queryset.count()
        }
    
    @staticmethod
    def get_revenue_data(
        event_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Get revenue report data with totals and breakdowns
        """
        # Base queryset for paid orders only
        queryset = TicketOrder.objects.filter(
            status='paid'
        ).select_related(
            'event', 'user'
        ).prefetch_related(
            'tickets__ticket_type'
        )
        
        # Apply RBAC filtering
        if user and not user.is_superuser:
            if user.role == User.Role.ORGANIZER:
                queryset = queryset.filter(event__created_by=user)
            else:
                # Non-organizers can only see their own orders
                queryset = queryset.filter(user=user)
        
        # Apply filters
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if date_from:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_from, str):
                    if 'T' in date_from or 'Z' in date_from:
                        date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    else:
                        date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                else:
                    date_from_dt = date_from
                queryset = queryset.filter(created_at__gte=date_from_dt)
            except ValueError:
                pass
        
        if date_to:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_to, str):
                    if 'T' in date_to or 'Z' in date_to:
                        date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    else:
                        date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
                else:
                    date_to_dt = date_to
                queryset = queryset.filter(created_at__lte=date_to_dt)
            except ValueError:
                pass
        
        # Calculate totals
        totals = queryset.aggregate(
            count=Count('id'),
            total_cents=Sum('total_cents')
        )
        
        # Get detailed rows
        rows = []
        for order in queryset.order_by('-created_at'):
            rows.append({
                'id': order.id,
                'event_name': order.event.name if order.event else 'N/A',
                'event_id': order.event.id if order.event else None,
                'user_name': order.user.full_name if order.user else 'N/A',
                'user_email': order.user.email if order.user else 'N/A',
                'total_cents': order.total_cents,
                'status': order.status,
                'created_at': order.created_at,
                'ticket_count': order.tickets.count()
            })
        
        return {
            'rows': rows,
            'totals': {
                'count': totals['count'] or 0,
                'total_cents': totals['total_cents'] or 0
            }
        }
    
    @staticmethod
    def get_attendance_data(
        event_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Get attendance report data (proxied by ticket orders and scanned tickets)
        """
        # Base queryset for paid orders (attendance proxy)
        queryset = TicketOrder.objects.filter(
            status='paid'
        ).select_related(
            'event', 'user'
        ).prefetch_related(
            'tickets'
        )
        
        # Apply RBAC filtering
        if user and not user.is_superuser:
            if user.role == User.Role.ORGANIZER:
                queryset = queryset.filter(event__created_by=user)
            else:
                queryset = queryset.filter(user=user)
        
        # Apply filters
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        if date_from:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_from, str):
                    if 'T' in date_from or 'Z' in date_from:
                        date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    else:
                        date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
                else:
                    date_from_dt = date_from
                queryset = queryset.filter(created_at__gte=date_from_dt)
            except ValueError:
                pass
        
        if date_to:
            try:
                # Handle both ISO format and simple date format
                if isinstance(date_to, str):
                    if 'T' in date_to or 'Z' in date_to:
                        date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    else:
                        date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
                else:
                    date_to_dt = date_to
                queryset = queryset.filter(created_at__lte=date_to_dt)
            except ValueError:
                pass
        
        # Calculate attendance metrics
        attendance_data = []
        for order in queryset.order_by('-created_at'):
            # Count scanned tickets (if scanning is implemented)
            scanned_count = order.tickets.filter(is_scanned=True).count()
            total_tickets = order.tickets.count()
            
            attendance_data.append({
                'id': order.id,
                'event_name': order.event.name if order.event else 'N/A',
                'event_id': order.event.id if order.event else None,
                'user_name': order.user.full_name if order.user else 'N/A',
                'user_email': order.user.email if order.user else 'N/A',
                'ticket_count': total_tickets,
                'scanned_count': scanned_count,
                'attendance_rate': (scanned_count / total_tickets * 100) if total_tickets > 0 else 0,
                'created_at': order.created_at,
                'event_date': order.event.start_datetime if order.event else None
            })
        
        # Calculate summary stats
        total_orders = len(attendance_data)
        total_tickets = sum(item['ticket_count'] for item in attendance_data)
        total_scanned = sum(item['scanned_count'] for item in attendance_data)
        avg_attendance_rate = (total_scanned / total_tickets * 100) if total_tickets > 0 else 0
        
        return {
            'rows': attendance_data,
            'summary': {
                'total_orders': total_orders,
                'total_tickets': total_tickets,
                'total_scanned': total_scanned,
                'avg_attendance_rate': round(avg_attendance_rate, 2)
            }
        }
    
    @staticmethod
    def get_performance_data(
        event_id: Optional[int] = None,
        division_id: Optional[int] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Get performance report data with standings and player/team stats
        """
        # Base queryset for results
        queryset = Result.objects.select_related(
            'fixture__event', 'fixture__venue'
        ).prefetch_related(
            'fixture__entries__team',
            'fixture__entries__participant'
        )
        
        # Apply RBAC filtering
        if user and not user.is_superuser:
            if user.role == User.Role.ORGANIZER:
                queryset = queryset.filter(fixture__event__created_by=user)
            else:
                # Non-organizers can only see results for events they're registered for
                queryset = queryset.filter(
                    fixture__event__registrations__user=user
                )
        
        # Apply filters
        if event_id:
            queryset = queryset.filter(fixture__event_id=event_id)
        
        if division_id:
            queryset = queryset.filter(fixture__division_id=division_id)
        
        # Get team performance data
        team_stats = {}
        player_stats = {}
        
        for result in queryset:
            # Get home and away entries
            home_entry = result.fixture.entries.filter(side='home').first()
            away_entry = result.fixture.entries.filter(side='away').first()
            
            # Process team stats
            if home_entry and home_entry.team:
                team_name = home_entry.team.name
                if team_name not in team_stats:
                    team_stats[team_name] = {
                        'wins': 0, 'losses': 0, 'draws': 0,
                        'points_for': 0, 'points_against': 0,
                        'games_played': 0
                    }
                
                team_stats[team_name]['points_for'] += result.score_home
                team_stats[team_name]['points_against'] += result.score_away
                team_stats[team_name]['games_played'] += 1
                
                if result.score_home > result.score_away:
                    team_stats[team_name]['wins'] += 1
                elif result.score_home < result.score_away:
                    team_stats[team_name]['losses'] += 1
                else:
                    team_stats[team_name]['draws'] += 1
            
            if away_entry and away_entry.team:
                team_name = away_entry.team.name
                if team_name not in team_stats:
                    team_stats[team_name] = {
                        'wins': 0, 'losses': 0, 'draws': 0,
                        'points_for': 0, 'points_against': 0,
                        'games_played': 0
                    }
                
                team_stats[team_name]['points_for'] += result.score_away
                team_stats[team_name]['points_against'] += result.score_home
                team_stats[team_name]['games_played'] += 1
                
                if result.score_away > result.score_home:
                    team_stats[team_name]['wins'] += 1
                elif result.score_away < result.score_home:
                    team_stats[team_name]['losses'] += 1
                else:
                    team_stats[team_name]['draws'] += 1
            
            # Process player stats (if participants are tracked)
            if home_entry and home_entry.participant:
                player_name = home_entry.participant.full_name
                if player_name not in player_stats:
                    player_stats[player_name] = {
                        'games_played': 0, 'points_scored': 0,
                        'team': home_entry.team.name if home_entry.team else 'N/A'
                    }
                player_stats[player_name]['games_played'] += 1
                player_stats[player_name]['points_scored'] += result.score_home
            
            if away_entry and away_entry.participant:
                player_name = away_entry.participant.full_name
                if player_name not in player_stats:
                    player_stats[player_name] = {
                        'games_played': 0, 'points_scored': 0,
                        'team': away_entry.team.name if away_entry.team else 'N/A'
                    }
                player_stats[player_name]['games_played'] += 1
                player_stats[player_name]['points_scored'] += result.score_away
        
        # Calculate team standings
        standings = []
        for team_name, stats in team_stats.items():
            point_difference = stats['points_for'] - stats['points_against']
            standings.append({
                'team': team_name,
                'games_played': stats['games_played'],
                'wins': stats['wins'],
                'losses': stats['losses'],
                'draws': stats['draws'],
                'points_for': stats['points_for'],
                'points_against': stats['points_against'],
                'point_difference': point_difference,
                'win_percentage': round((stats['wins'] / stats['games_played'] * 100) if stats['games_played'] > 0 else 0, 2)
            })
        
        # Sort standings by wins, then point difference
        standings.sort(key=lambda x: (x['wins'], x['point_difference']), reverse=True)
        
        # Convert player stats to list
        player_list = [
            {
                'player': player_name,
                'team': stats['team'],
                'games_played': stats['games_played'],
                'points_scored': stats['points_scored'],
                'avg_points': round(stats['points_scored'] / stats['games_played'], 2) if stats['games_played'] > 0 else 0
            }
            for player_name, stats in player_stats.items()
        ]
        
        # Sort players by points scored
        player_list.sort(key=lambda x: x['points_scored'], reverse=True)
        
        return {
            'standings': standings,
            'top_players': player_list[:10],  # Top 10 players
            'summary': {
                'total_teams': len(standings),
                'total_players': len(player_list),
                'total_games': sum(stats['games_played'] for stats in team_stats.values())
            }
        }
