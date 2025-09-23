// src/pages/coach/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  CalendarDaysIcon,
  TrophyIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import useLiveChannel from '../../hooks/useLiveChannel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements';
import { coachDashboardAPI, dashboardUtils } from '../../services/dashboardAPI';

export default function CoachDashboard() {
  const [teams, setTeams] = useState([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates for coach data
  const { 
    isConnected, 
    error: wsError 
  } = useLiveChannel('coach_updates', {
    onMessage: (data) => {
      if (data.type === 'team_update') {
        setTeams(prev => prev.map(team => 
          team.id === data.team_id ? { ...team, ...data.data } : team
        ));
      }
      if (data.type === 'fixture_update') {
        setUpcomingFixtures(prev => prev.map(fixture => 
          fixture.id === data.fixture_id ? { ...fixture, ...data.data } : fixture
        ));
      }
      if (data.type === 'announcement_update') {
        setAnnouncements(prev => [data.data, ...prev.slice(0, 4)]);
      }
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch real data from API
        const [teamsData, fixturesData, announcementsData] = await Promise.all([
          coachDashboardAPI.getMyTeams(),
          coachDashboardAPI.getUpcomingFixtures(),
          coachDashboardAPI.getAnnouncements()
        ]);

        setTeams(teamsData);
        setUpcomingFixtures(fixturesData);
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton variant="title" width="200px" className="mb-2" />
          <Skeleton variant="text" width="400px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-96" />
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    );
  }

  const totalRosterCount = teams.reduce((sum, team) => sum + (team.member_count || 0), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your teams and track upcoming fixtures.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Fixtures</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingFixtures.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Roster Count</p>
              <p className="text-2xl font-bold text-gray-900">{totalRosterCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BellIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Live Announcements */}
      <div className="mb-8">
        <RealtimeAnnouncements 
          showInDashboard={true}
          maxAnnouncements={3}
          autoHide={false}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="md">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Confirm Lineup
          </Button>
          <Button variant="outline" size="md">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Teams */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Teams</h2>
            <Link to="/coach/teams">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {teams.length > 0 ? (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.sport?.name || 'Unknown Sport'}</p>
                    <p className="text-xs text-gray-500">{team.member_count || 0} members</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next: {team.next_match ? dashboardUtils.formatDate(team.next_match) : 'TBD'}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      team.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {team.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserGroupIcon}
              title="No Teams Yet"
              description="You haven't been assigned to any teams yet."
            />
          )}
        </Card>

        {/* Upcoming Fixtures */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Fixtures</h2>
            <Link to="/coach/fixtures">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {upcomingFixtures.length > 0 ? (
            <div className="space-y-4">
              {upcomingFixtures.map((fixture) => (
                <div key={fixture.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{fixture.home_team?.name} vs {fixture.away_team?.name}</h3>
                    <p className="text-sm text-gray-600">{fixture.venue?.name || 'TBD'}</p>
                    <p className="text-xs text-gray-500">{dashboardUtils.formatDate(fixture.start_date)} at {dashboardUtils.formatTime(fixture.start_time)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fixture.status === 'scheduled' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {fixture.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No Upcoming Fixtures"
              description="No fixtures scheduled for your teams."
            />
          )}
        </Card>

        {/* Announcements */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Announcements</h2>
            <Link to="/coach/announcements">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    announcement.priority === 'high' 
                      ? 'bg-red-500'
                      : announcement.priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{announcement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BellIcon}
              title="No Announcements"
              description="No recent announcements for your teams."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
