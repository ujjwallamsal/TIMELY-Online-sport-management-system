// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  UserGroupIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useLiveChannel } from '../../hooks/useLiveChannel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    registrations: 0,
    completedEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates for live data
  const { data: liveData } = useLiveChannel('admin-dashboard');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API calls - in real app, these would be actual API calls
        setStats({
          totalEvents: 24,
          activeEvents: 8,
          totalUsers: 1247,
          totalRevenue: 45680,
          registrations: 156,
          completedEvents: 89
        });

        setRecentEvents([
          {
            id: 1,
            title: "Championship Finals 2024",
            date: "2024-03-15",
            status: "upcoming",
            registrations: 45,
            revenue: 2250
          },
          {
            id: 2,
            title: "Summer Olympics Qualifiers",
            date: "2024-03-20",
            status: "upcoming",
            registrations: 32,
            revenue: 1600
          },
          {
            id: 3,
            title: "Local Basketball Tournament",
            date: "2024-03-10",
            status: "ongoing",
            registrations: 28,
            revenue: 1400
          }
        ]);

        setRecentRegistrations([
          {
            id: 1,
            user: "John Doe",
            event: "Championship Finals 2024",
            date: "2024-03-01",
            status: "confirmed",
            amount: 50
          },
          {
            id: 2,
            user: "Jane Smith",
            event: "Summer Olympics Qualifiers",
            date: "2024-03-01",
            status: "pending",
            amount: 75
          },
          {
            id: 3,
            user: "Mike Johnson",
            event: "Local Basketball Tournament",
            date: "2024-02-28",
            status: "confirmed",
            amount: 25
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Update stats with live data
  useEffect(() => {
    if (liveData) {
      setStats(prev => ({
        ...prev,
        ...liveData.stats
      }));
    }
  }, [liveData]);

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: CalendarDaysIcon,
      change: '+12%',
      changeType: 'positive',
      color: 'blue'
    },
    {
      title: 'Active Events',
      value: stats.activeEvents,
      icon: ClockIcon,
      change: '+3',
      changeType: 'positive',
      color: 'green'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      change: '+8%',
      changeType: 'positive',
      color: 'purple'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+15%',
      changeType: 'positive',
      color: 'yellow'
    },
    {
      title: 'Registrations',
      value: stats.registrations,
      icon: CheckCircleIcon,
      change: '+24',
      changeType: 'positive',
      color: 'indigo'
    },
    {
      title: 'Completed Events',
      value: stats.completedEvents,
      icon: TrophyIcon,
      change: '+5',
      changeType: 'positive',
      color: 'red'
    }
  ];

  const quickActions = [
    {
      title: 'Create Event',
      description: 'Add a new sporting event',
      href: '/admin/events/new',
      icon: CalendarDaysIcon,
      color: 'blue'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      href: '/admin/users',
      icon: UserGroupIcon,
      color: 'purple'
    },
    {
      title: 'View Reports',
      description: 'Generate and view analytics',
      href: '/admin/reports',
      icon: ChartBarIcon,
      color: 'green'
    },
    {
      title: 'Manage Venues',
      description: 'Add and manage venues',
      href: '/admin/venues',
      icon: TrophyIcon,
      color: 'yellow'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton variant="title" width="200px" className="mb-2" />
          <Skeleton variant="text" width="400px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your events and users.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' ? (
                    <ChartBarIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Events and Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
            <Link to="/admin/events">
              <Button variant="outline" size="sm">
                View All
                <EyeIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.date}</p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'upcoming' 
                          ? 'bg-blue-100 text-blue-800'
                          : event.status === 'ongoing'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{event.registrations} registrations</p>
                    <p className="text-sm text-gray-600">${event.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyEvents />
          )}
        </Card>

        {/* Recent Registrations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Registrations</h2>
            <Link to="/admin/registrations">
              <Button variant="outline" size="sm">
                View All
                <EyeIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {recentRegistrations.length > 0 ? (
            <div className="space-y-4">
              {recentRegistrations.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{registration.user}</h3>
                    <p className="text-sm text-gray-600">{registration.event}</p>
                    <p className="text-xs text-gray-500">{registration.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      registration.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">${registration.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRegistrations />
          )}
        </Card>
      </div>
    </div>
  );
}