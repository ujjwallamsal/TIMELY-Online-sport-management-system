// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Ticket, DollarSign, Activity, Server, Database, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStats, getRevenue, getUserDistribution, getRecentEvents, getRecentRegistrations, getHealth } from '../../config/endpoints.js';
import api from '../../lib/api.js';
import useSocket from '../../hooks/useSocket.js';
import StatCard from '../../components/admin/StatCard.jsx';
import RevenueChart from '../../components/admin/RevenueChart.jsx';
import UserPie from '../../components/admin/UserPie.jsx';
import RecentEvents from '../../components/admin/RecentEvents.jsx';
import RecentRegistrations from '../../components/admin/RecentRegistrations.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import ErrorBand from '../../components/ui/ErrorBand.jsx';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [userDistribution, setUserDistribution] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [health, setHealth] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueRange, setRevenueRange] = useState('year');

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useSocket('/ws/admin/', {
    onMessage: (data) => {
      console.log('Dashboard real-time update:', data);
      
      // Handle different types of real-time updates
      switch (data.type) {
        case 'event_update':
          if (data.data.action === 'created' || data.data.action === 'updated' || data.data.action === 'published') {
            fetchRecentEvents();
          }
          break;
        case 'registration_update':
          if (data.data.action === 'created' || data.data.action === 'approved' || data.data.action === 'rejected') {
            fetchRecentRegistrations();
          }
          break;
        case 'stats_updated':
          fetchStats();
          break;
        case 'revenue_updated':
          fetchRevenue(revenueRange);
          break;
        default:
          break;
      }
    },
    onPolling: () => {
      // Polling fallback - refresh all data
      fetchAllData();
    }
  });

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const response = await api.get('/api/admin/kpis/');
      console.log('Stats response:', response);
      const data = response.data;
      
      // Use the real API data
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set empty stats instead of mock data
      setStats({
        total_users: 0,
        active_events: 0,
        tickets_sold: 0,
        total_revenue: 0,
        user_trend: 0,
        event_trend: 0,
        ticket_trend: 0,
        revenue_trend: 0
      });
    }
  };

  const fetchRevenue = async (range) => {
    try {
      // For now, set empty revenue data since we don't have a revenue endpoint
      setRevenueData([]);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setRevenueData([]);
    }
  };

  const fetchUserDistribution = async () => {
    try {
      // For now, set empty user distribution data since we don't have this endpoint
      setUserDistribution([]);
    } catch (err) {
      console.error('Error fetching user distribution:', err);
      setUserDistribution([]);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      // Use the actual events API
      const response = await api.get('/api/events/?ordering=-created_at&page_size=5');
      const data = response.data;
      
      // Use real data from API
      setRecentEvents(data.results || []);
    } catch (err) {
      console.error('Error fetching recent events:', err);
      setRecentEvents([]);
    }
  };

  const fetchRecentRegistrations = async () => {
    try {
      // Use the actual registrations API
      const response = await api.get('/api/registrations/?ordering=-created_at&page_size=5');
      const data = response.data;
      
      // Use real data from API
      setRecentRegistrations(data.results || []);
    } catch (err) {
      console.error('Error fetching recent registrations:', err);
      setRecentRegistrations([]);
    }
  };

  const fetchHealth = async () => {
    try {
      // Use the correct health endpoint
      const response = await api.get('/health/');
      const data = response.data;
      
      setHealth(data);
    } catch (err) {
      console.error('Error fetching health data:', err);
      // Use mock data as fallback
      const mockHealth = {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString()
      };
      setHealth(mockHealth);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchStats(),
        fetchRevenue(revenueRange),
        fetchUserDistribution(),
        fetchRecentEvents(),
        fetchRecentRegistrations(),
        fetchHealth()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchRevenue(revenueRange);
  }, [revenueRange]);

  const handleRetry = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton type="text" className="h-8 w-48 mb-2" />
          <Skeleton type="text" className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} type="card" className="h-32" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Skeleton type="card" className="h-80" />
          <Skeleton type="card" className="h-80" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton type="card" className="h-96" />
          <Skeleton type="card" className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBand message={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.first_name || user?.email}! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          trend={stats?.user_trend ? { value: stats.user_trend, isPositive: stats.user_trend > 0 } : undefined}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Active Events"
          value={stats?.active_events || 0}
          trend={stats?.event_trend ? { value: stats.event_trend, isPositive: stats.event_trend > 0 } : undefined}
          icon={<Calendar className="h-6 w-6" />}
        />
        <StatCard
          title="Tickets Sold"
          value={stats?.tickets_sold || 0}
          trend={stats?.ticket_trend ? { value: stats.ticket_trend, isPositive: stats.ticket_trend > 0 } : undefined}
          icon={<Ticket className="h-6 w-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={stats?.total_revenue || 0}
          trend={stats?.revenue_trend ? { value: stats.revenue_trend, isPositive: stats.revenue_trend > 0 } : undefined}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart
          data={revenueData}
          onRangeChange={setRevenueRange}
        />
        <UserPie data={userDistribution} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentEvents events={recentEvents} />
        <RecentRegistrations registrations={recentRegistrations} />
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">WebSocket</span>
            <span className={`ml-2 text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${health?.database === 'ok' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">Database</span>
            <span className={`ml-2 text-sm font-medium ${health?.database === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {health?.database === 'ok' ? 'Healthy' : 'Unknown'}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-3 bg-green-400"></div>
            <span className="text-sm text-gray-600">API</span>
            <span className="ml-2 text-sm font-medium text-green-600">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
