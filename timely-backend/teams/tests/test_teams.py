# teams/tests/test_teams.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from unittest.mock import patch

from ..models import Team, TeamMember, TeamEventEntry
from events.models import Event, Division
from venues.models import Venue

User = get_user_model()


class TeamModelTest(TestCase):
    """Test Team model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test St',
            capacity=100
        )
    
    def test_create_team_ok(self):
        """Test creating a team successfully"""
        team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com',
            contact_phone='555-0123',
            home_venue=self.venue
        )
        
        self.assertEqual(team.name, 'Test Team')
        self.assertEqual(team.sport, 'Basketball')
        self.assertEqual(team.manager, self.user)
        self.assertEqual(team.contact_email, 'team@test.com')
        self.assertTrue(team.is_active)
        self.assertTrue(team.is_public)
    
    def test_team_name_unique(self):
        """Test team name uniqueness constraint"""
        Team.objects.create(
            name='Unique Team',
            sport='Soccer',
            manager=self.user,
            contact_email='team1@test.com'
        )
        
        with self.assertRaises(Exception):
            Team.objects.create(
                name='Unique Team',
                sport='Basketball',
                manager=self.user,
                contact_email='team2@test.com'
            )


class TeamMemberModelTest(TestCase):
    """Test TeamMember model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
    
    def test_add_member_ok(self):
        """Test adding a team member successfully"""
        member = TeamMember.objects.create(
            team=self.team,
            user=self.user,
            full_name='John Manager',
            role=TeamMember.Role.PLAYER,
            position='Guard',
            jersey_number=23
        )
        
        self.assertEqual(member.team, self.team)
        self.assertEqual(member.user, self.user)
        self.assertEqual(member.full_name, 'John Manager')
        self.assertEqual(member.role, TeamMember.Role.PLAYER)
        self.assertEqual(member.status, TeamMember.Status.ACTIVE)
        self.assertTrue(member.is_active_member)
    
    def test_add_standalone_member(self):
        """Test adding a member without user account"""
        member = TeamMember.objects.create(
            team=self.team,
            full_name='Standalone Player',
            role=TeamMember.Role.PLAYER,
            position='Forward',
            jersey_number=10
        )
        
        self.assertEqual(member.team, self.team)
        self.assertIsNone(member.user)
        self.assertEqual(member.full_name, 'Standalone Player')
        self.assertEqual(member.role, TeamMember.Role.PLAYER)
    
    def test_update_member_ok(self):
        """Test updating a team member"""
        member = TeamMember.objects.create(
            team=self.team,
            user=self.user,
            full_name='John Manager',
            role=TeamMember.Role.PLAYER
        )
        
        member.role = TeamMember.Role.CAPTAIN
        member.position = 'Point Guard'
        member.jersey_number = 1
        member.save()
        
        member.refresh_from_db()
        self.assertEqual(member.role, TeamMember.Role.CAPTAIN)
        self.assertEqual(member.position, 'Point Guard')
        self.assertEqual(member.jersey_number, 1)


class TeamEventEntryModelTest(TestCase):
    """Test TeamEventEntry model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Jane',
            last_name='Organizer',
            role='ORGANIZER'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
        self.event = Event.objects.create(
            name='Test Tournament',
            sport_type='Basketball',
            start_datetime='2024-06-01 10:00:00+00:00',
            end_datetime='2024-06-01 18:00:00+00:00',
            location='Test Arena',
            created_by=self.organizer
        )
        self.division = Division.objects.create(
            name='Open Division',
            event=self.event,
            max_teams=16
        )
    
    def test_create_entry_pending_ok(self):
        """Test creating a team event entry"""
        entry = TeamEventEntry.objects.create(
            team=self.team,
            event=self.event,
            division=self.division,
            note='Looking forward to competing!'
        )
        
        self.assertEqual(entry.team, self.team)
        self.assertEqual(entry.event, self.event)
        self.assertEqual(entry.division, self.division)
        self.assertEqual(entry.status, TeamEventEntry.Status.PENDING)
        self.assertEqual(entry.note, 'Looking forward to competing!')
        self.assertIsNone(entry.decided_at)
        self.assertIsNone(entry.decided_by)
    
    def test_organizer_approve_ok(self):
        """Test organizer approving an entry"""
        entry = TeamEventEntry.objects.create(
            team=self.team,
            event=self.event,
            division=self.division
        )
        
        success = entry.approve(self.organizer, 'Welcome to the tournament!')
        
        self.assertTrue(success)
        self.assertEqual(entry.status, TeamEventEntry.Status.APPROVED)
        self.assertEqual(entry.decided_by, self.organizer)
        self.assertIsNotNone(entry.decided_at)
        self.assertEqual(entry.note, 'Welcome to the tournament!')
    
    def test_organizer_reject_ok(self):
        """Test organizer rejecting an entry"""
        entry = TeamEventEntry.objects.create(
            team=self.team,
            event=self.event,
            division=self.division
        )
        
        success = entry.reject(self.organizer, 'Team does not meet requirements')
        
        self.assertTrue(success)
        self.assertEqual(entry.status, TeamEventEntry.Status.REJECTED)
        self.assertEqual(entry.decided_by, self.organizer)
        self.assertIsNotNone(entry.decided_at)
        self.assertEqual(entry.note, 'Team does not meet requirements')
    
    def test_withdraw_ok(self):
        """Test withdrawing an entry"""
        entry = TeamEventEntry.objects.create(
            team=self.team,
            event=self.event,
            division=self.division
        )
        
        success = entry.withdraw('Team cannot participate')
        
        self.assertTrue(success)
        self.assertEqual(entry.status, TeamEventEntry.Status.WITHDRAWN)
        self.assertIsNotNone(entry.decided_at)
        self.assertEqual(entry.note, 'Team cannot participate')


class EligibilityCheckTest(TestCase):
    """Test eligibility checking functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
        self.event = Event.objects.create(
            name='Test Tournament',
            sport_type='Basketball',
            start_datetime='2024-06-01 10:00:00+00:00',
            end_datetime='2024-06-01 18:00:00+00:00',
            location='Test Arena',
            created_by=self.user
        )
        self.division = Division.objects.create(
            name='Open Division',
            event=self.event,
            max_teams=16
        )
    
    def test_eligibility_check_examples_ok(self):
        """Test eligibility check with various scenarios"""
        from ..services.eligibility import EligibilityChecker
        
        # Test with no members (should fail)
        result = EligibilityChecker.check_team_eligibility(
            self.team.id, self.event.id, self.division.id
        )
        self.assertFalse(result['eligible'])
        self.assertIn('Team has 0 active members', result['reasons'])
        
        # Add a member
        TeamMember.objects.create(
            team=self.team,
            full_name='Test Player',
            role=TeamMember.Role.PLAYER,
            status=TeamMember.Status.ACTIVE
        )
        
        # Test with valid member (should pass basic checks)
        result = EligibilityChecker.check_team_eligibility(
            self.team.id, self.event.id, self.division.id
        )
        self.assertTrue(result['eligible'])
        self.assertEqual(len(result['reasons']), 0)
        
        # Test with wrong sport
        self.team.sport = 'Soccer'
        self.team.save()
        
        result = EligibilityChecker.check_team_eligibility(
            self.team.id, self.event.id, self.division.id
        )
        self.assertFalse(result['eligible'])
        self.assertIn('Team sport', result['reasons'][0])


class TeamAPITest(APITestCase):
    """Test Team API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_teams_ok(self):
        """Test listing teams"""
        url = reverse('teams-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Team')
    
    def test_create_team_ok(self):
        """Test creating a team via API"""
        url = reverse('teams-list')
        data = {
            'name': 'New Team',
            'sport': 'Soccer',
            'manager_id': self.user.id,
            'contact_email': 'newteam@test.com',
            'contact_phone': '555-9999'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Team')
        self.assertEqual(response.data['sport'], 'Soccer')
    
    def test_get_team_ok(self):
        """Test retrieving a team"""
        url = reverse('teams-detail', kwargs={'pk': self.team.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Team')
    
    def test_update_team_ok(self):
        """Test updating a team"""
        url = reverse('teams-detail', kwargs={'pk': self.team.id})
        data = {
            'name': 'Updated Team',
            'sport': 'Basketball',
            'manager_id': self.user.id,
            'contact_email': 'updated@test.com'
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Team')
    
    def test_delete_team_ok(self):
        """Test deleting a team"""
        url = reverse('teams-detail', kwargs={'pk': self.team.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Team.objects.filter(id=self.team.id).exists())


class TeamMemberAPITest(APITestCase):
    """Test TeamMember API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
        self.member = TeamMember.objects.create(
            team=self.team,
            user=self.user,
            full_name='John Manager',
            role=TeamMember.Role.PLAYER
        )
        self.client.force_authenticate(user=self.user)
    
    def test_add_member_ok(self):
        """Test adding a team member via API"""
        url = reverse('teams-members', kwargs={'pk': self.team.id})
        data = {
            'full_name': 'New Player',
            'role': 'PLAYER',
            'position': 'Guard',
            'jersey_number': 15
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['full_name'], 'New Player')
        self.assertEqual(response.data['role'], 'PLAYER')
    
    def test_update_member_ok(self):
        """Test updating a team member via API"""
        url = reverse('team-members-detail', kwargs={'pk': self.member.id})
        data = {
            'role': 'CAPTAIN',
            'position': 'Point Guard',
            'jersey_number': 1
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'CAPTAIN')
        self.assertEqual(response.data['position'], 'Point Guard')


class TeamEventEntryAPITest(APITestCase):
    """Test TeamEventEntry API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Jane',
            last_name='Organizer',
            role='ORGANIZER'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.user,
            contact_email='team@test.com'
        )
        self.event = Event.objects.create(
            name='Test Tournament',
            sport_type='Basketball',
            start_datetime='2024-06-01 10:00:00+00:00',
            end_datetime='2024-06-01 18:00:00+00:00',
            location='Test Arena',
            created_by=self.organizer
        )
        self.division = Division.objects.create(
            name='Open Division',
            event=self.event,
            max_teams=16
        )
        self.entry = TeamEventEntry.objects.create(
            team=self.team,
            event=self.event,
            division=self.division
        )
    
    def test_create_entry_pending_ok(self):
        """Test creating a team event entry via API"""
        self.client.force_authenticate(user=self.user)
        url = reverse('teams-entries', kwargs={'pk': self.team.id})
        data = {
            'event': self.event.id,
            'division': self.division.id,
            'note': 'Excited to participate!'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
    
    def test_organizer_approve_ok(self):
        """Test organizer approving an entry via API"""
        self.client.force_authenticate(user=self.organizer)
        url = reverse('team-entries-approve', kwargs={'pk': self.entry.id})
        data = {'note': 'Welcome to the tournament!'}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.entry.refresh_from_db()
        self.assertEqual(self.entry.status, TeamEventEntry.Status.APPROVED)
    
    def test_withdraw_ok(self):
        """Test withdrawing an entry via API"""
        self.client.force_authenticate(user=self.user)
        url = reverse('team-entries-withdraw', kwargs={'pk': self.entry.id})
        data = {'note': 'Cannot participate'}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.entry.refresh_from_db()
        self.assertEqual(self.entry.status, TeamEventEntry.Status.WITHDRAWN)


class PermissionsTest(APITestCase):
    """Test RBAC permissions"""
    
    def setUp(self):
        self.manager = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='John',
            last_name='Manager'
        )
        self.other_user = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )
        self.team = Team.objects.create(
            name='Test Team',
            sport='Basketball',
            manager=self.manager,
            contact_email='team@test.com'
        )
        self.member = TeamMember.objects.create(
            team=self.team,
            user=self.manager,
            full_name='John Manager',
            role=TeamMember.Role.PLAYER
        )
    
    def test_permissions_enforced_ok(self):
        """Test that permissions are properly enforced"""
        # Test that non-owner cannot mutate roster
        self.client.force_authenticate(user=self.other_user)
        url = reverse('teams-members', kwargs={'pk': self.team.id})
        data = {
            'full_name': 'Unauthorized Player',
            'role': 'PLAYER'
        }
        
        response = self.client.post(url, data)
        
        # Should get 403 or 404 depending on implementation
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        
        # Test that owner can mutate roster
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
