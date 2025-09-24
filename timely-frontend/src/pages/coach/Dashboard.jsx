import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import useLiveChannel from '../../hooks/useLiveChannel.js';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  TrophyIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function CoachDashboard() {
  const { user } = useAuth();
  const { push } = useToast();
  const [myTeam, setMyTeam] = useState({ loading: true, items: [] });
  const [upcomingFixtures, setUpcomingFixtures] = useState({ loading: true, items: [] });
  const [recentResults, setRecentResults] = useState({ loading: true, items: [] });

  useEffect(() => {
    // Fetch coach's team
    setMyTeam(prev => ({ ...prev, loading: true }));
    // Note: This would need a specific endpoint for coach's team
    // For now, we'll use a placeholder
    setTimeout(() => {
      setMyTeam({ loading: false, items: [] });
    }, 1000);

    // Fetch upcoming fixtures for coach's team
    setUpcomingFixtures(prev => ({ ...prev, loading: true }));
    api.getEvents({ status: 'UPCOMING' })
      .then(data => {
        const items = data.results || data.data || [];
        setUpcomingFixtures({ loading: false, items: items.slice(0, 5) });
      })
      .catch(err => {
        setUpcomingFixtures({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load fixtures', message: err.message });
      });

    // Fetch recent results
    setRecentResults(prev => ({ ...prev, loading: true }));
    api.getEvents({ status: 'COMPLETED' })
      .then(data => {
        const items = data.results || data.data || [];
        setRecentResults({ loading: false, items: items.slice(0, 5) });
      })
      .catch(err => {
        setRecentResults({ loading: false, items: [] });
        push({ type: 'error', title: 'Failed to load results', message: err.message });
      });
  }, [user?.id, push]);

  // Realtime subscriptions for team updates
  useLiveChannel(`team_${user?.id}_schedule`, (msg) => {
    if (msg.type === 'schedule_update') {
      // Refresh upcoming fixtures
      api.getEvents({ status: 'UPCOMING' })
        .then(data => {
          const items = data.results || data.data || [];
          setUpcomingFixtures(prev => ({ ...prev, items: items.slice(0, 5) }));
        })
        .catch(() => {});
    }
  });

  useLiveChannel(`team_${user?.id}_results`, (msg) => {
    if (msg.type === 'results_update') {
      // Refresh recent results
      api.getEvents({ status: 'COMPLETED' })
        .then(data => {
          const items = data.results || data.data || [];
          setRecentResults(prev => ({ ...prev, items: items.slice(0, 5) }));
        })
        .catch(() => {});
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.first_name || 'Coach'}! Manage your team's schedule and track performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Team */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Team</h2>
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
          </div>
          
          {myTeam.loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : myTeam.items.length === 0 ? (
            <EmptyState 
              title="No team assigned" 
              description="You haven't been assigned to a team yet. Contact your administrator."
              icon={<UserGroupIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="space-y-3">
              {myTeam.items.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.position || 'Athlete'}</p>
                    </div>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3">
                <Link to="/coach">Manage Team</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Upcoming Fixtures */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Fixtures</h2>
            <CalendarIcon className="h-6 w-6 text-green-500" />
          </div>
          
          {upcomingFixtures.loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : upcomingFixtures.items.length === 0 ? (
            <EmptyState 
              title="No upcoming fixtures" 
              description="No upcoming matches scheduled for your team."
              icon={<CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="space-y-3">
              {upcomingFixtures.items.map((fixture) => (
                <div key={fixture.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{fixture.name}</h3>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">UPCOMING</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(fixture.start_datetime)}
                    </div>
                    {fixture.venue_name && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {fixture.venue_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-3">
                <Link to="/coach">View All Fixtures</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Results</h2>
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
          </div>
          
          {recentResults.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentResults.items.length === 0 ? (
            <EmptyState 
              title="No recent results" 
              description="Your team's recent match results will appear here."
              icon={<TrophyIcon className="mx-auto h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentResults.items.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{result.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">COMPLETED</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(result.end_datetime)}
                    </div>
                    <div className="flex items-center">
                      <TrophyIcon className="h-4 w-4 mr-1" />
                      Result: TBD
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="md:col-span-2 mt-2">
                <Link to="/coach">View All Results</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


