// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    matchesToday: 0,
    pendingApprovals: 0,
    rescheduleRequests: 0
  });

  const [todaysFixtures, setTodaysFixtures] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setStats({
        upcomingEvents: 12,
        matchesToday: 8,
        pendingApprovals: 23,
        rescheduleRequests: 3
      });

      setTodaysFixtures([
        {
          id: 1,
          event: 'Basketball Championship',
          home: 'Team Alpha',
          away: 'Team Beta',
          venue: 'Sports Center',
          start: '14:00',
          status: 'SCHEDULED'
        },
        {
          id: 2,
          event: 'Soccer League',
          home: 'Team Gamma',
          away: 'Team Delta',
          venue: 'Field A',
          start: '16:30',
          status: 'LIVE'
        }
      ]);

      setPendingRegistrations([
        {
          id: 1,
          applicant: 'John Doe',
          type: 'ATHLETE',
          event: 'Basketball Championship',
          submitted: '2024-01-15'
        },
        {
          id: 2,
          applicant: 'Team Eagles',
          type: 'TEAM',
          event: 'Soccer League',
          submitted: '2024-01-14'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 ml-1">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const FixtureRow = ({ fixture }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {fixture.event}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {fixture.home}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {fixture.away}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {fixture.venue}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {fixture.start}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          fixture.status === 'LIVE' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {fixture.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button className="text-blue-600 hover:text-blue-900">
            Enter Result
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            Reschedule
          </button>
        </div>
      </td>
    </tr>
  );

  const RegistrationRow = ({ registration }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {registration.applicant}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {registration.type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {registration.event}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {registration.submitted}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button className="text-green-600 hover:text-green-900">
            Approve
          </button>
          <button className="text-red-600 hover:text-red-900">
            Reject
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link
            to="/admin/events/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Calendar}
          color="bg-blue-500"
          trend="+12%"
        />
        <StatCard
          title="Matches Today"
          value={stats.matchesToday}
          icon={Clock}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertCircle}
          color="bg-yellow-500"
        />
        <StatCard
          title="Reschedule Requests"
          value={stats.rescheduleRequests}
          icon={CheckCircle}
          color="bg-purple-500"
        />
      </div>

      {/* Today's Fixtures */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Fixtures</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Home
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Away
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todaysFixtures.map((fixture) => (
                <FixtureRow key={fixture.id} fixture={fixture} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Registrations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pending Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingRegistrations.map((registration) => (
                <RegistrationRow key={registration.id} registration={registration} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;