import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  BellIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyResults } from '../../components/ui/EmptyState';
import AnnouncementContainer from '../../components/ui/AnnouncementBanner';

const TeamDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    teams: [],
    members: [],
    registrations: [],
    results: [],
    announcements: [],
    stats: {}
  });

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/coach/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      },
      onPolling: () => {
        fetchDashboardData();
      }
    }
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [teamsRes, membersRes, registrationsRes, resultsRes, announcementsRes] = await Promise.all([
        api.get('teams/managed_teams/'),
        api.get('teams/members/'),
        api.get('teams/entries/'),
        api.get('results/'),
        api.get('notify/announcements/')
      ]);

      setData({
        teams: teamsRes.data.results || [],
        members: membersRes.data.results || [],
        registrations: registrationsRes.data.results || [],
        results: resultsRes.data.results || [],
        announcements: announcementsRes.data.results || [],
        stats: {
          totalTeams: teamsRes.data.count || 0,
          totalMembers: membersRes.data.count || 0,
          activeRegistrations: registrationsRes.data.results?.filter(r => r.status === 'approved').length || 0,
          unreadNotifications: 0 // TODO: implement notifications count
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'team_update':
        // Update teams list
        setData(prev => ({
          ...prev,
          teams: prev.teams.map(team => 
            team.id === message.data.id ? { ...team, ...message.data } : team
          )
        }));
        break;
      case 'results_update':
        // Update results
        setData(prev => ({
          ...prev,
          results: prev.results.map(result => 
            result.id === message.data.id ? { ...result, ...message.data } : result
          )
        }));
        break;
      case 'announcement_update':
        // Add new announcement
        setData(prev => ({
          ...prev,
          announcements: [message.data, ...prev.announcements]
        }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
          <Skeleton className="w-32 h-8" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonList items={3} />
          <SkeletonList items={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="text-gray-600">Manage your teams and track performance</p>
        </div>
        <LiveIndicator status={connectionStatus} />
      </div>

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <AnnouncementContainer 
          announcements={data.announcements}
          className="mb-6"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Teams"
          value={data.stats.totalTeams}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Members"
          value={data.stats.totalMembers}
          icon={UserGroupIcon}
          color="green"
        />
        <StatCard
          title="Active Events"
          value={data.stats.activeRegistrations}
          icon={CalendarIcon}
          color="yellow"
        />
        <StatCard
          title="Notifications"
          value={data.stats.unreadNotifications}
          icon={BellIcon}
          color="purple"
        />
      </div>

      {/* My Teams */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Teams</h2>
            <a href="/coach/teams" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Teams
            </a>
          </div>
        </div>
        <div className="p-6">
          {data.teams.length > 0 ? (
            <div className="space-y-4">
              {data.teams.slice(0, 3).map(team => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.sport}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {team.members?.length || 0} members
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserGroupIcon}
              title="No teams yet"
              description="Create your first team to start managing players and registrations."
              action={
                <a href="/coach/teams/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Create Team
                </a>
              }
            />
          )}
        </div>
      </div>

      {/* Recent Team Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Team Members</h2>
            <a href="/coach/roster" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Roster
            </a>
          </div>
        </div>
        <div className="p-6">
          {data.members.length > 0 ? (
            <div className="space-y-4">
              {data.members.slice(0, 5).map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.full_name}</h4>
                      <p className="text-sm text-gray-500">{member.role} • {member.team?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' :
                      member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                    {member.jersey_number && (
                      <span className="text-sm text-gray-500">#{member.jersey_number}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserGroupIcon}
              title="No team members yet"
              description="Start building your team by adding members."
              action={() => setActiveTab('roster')}
              actionText="Add Team Members"
            />
          )}
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
            <a href="/coach/results" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </a>
          </div>
        </div>
        <div className="p-6">
          {data.results.length > 0 ? (
            <div className="space-y-4">
              {data.results.slice(0, 3).map(result => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {result.fixture?.home_team?.name || 'TBD'} vs {result.fixture?.away_team?.name || 'TBD'}
                    </h3>
                    <p className="text-sm text-gray-500">{result.fixture?.event?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {result.score_home} - {result.score_away}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyResults 
              action={
                <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Register for Events
                </a>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
