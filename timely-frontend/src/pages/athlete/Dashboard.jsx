import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  TicketIcon, 
  DocumentTextIcon, 
  BellIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import api from '../../lib/api';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import EmptyState, { EmptyRegistrations, EmptyTickets } from '../../components/ui/EmptyState';
import AnnouncementContainer from '../../components/ui/AnnouncementBanner';

const AthleteDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    registrations: [],
    tickets: [],
    notifications: [],
    announcements: [],
    stats: {}
  });

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      },
      onPolling: () => {
        // Fallback polling when WebSocket is disconnected
        fetchDashboardData();
      }
    }
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [registrationsRes, ticketsRes, notificationsRes, announcementsRes] = await Promise.all([
        api.get('registrations/mine/'),
        api.get('tickets/mine/'),
        api.get('notify/'),
        api.get('notify/announcements/')
      ]);

      setData({
        registrations: registrationsRes.data.results || [],
        tickets: ticketsRes.data.results || [],
        notifications: notificationsRes.data.results || [],
        announcements: announcementsRes.data.results || [],
        stats: {
          totalRegistrations: registrationsRes.data.count || 0,
          totalTickets: ticketsRes.data.count || 0,
          unreadNotifications: notificationsRes.data.results?.filter(n => !n.read_at).length || 0
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
      case 'registration_update':
        // Update registrations list
        setData(prev => ({
          ...prev,
          registrations: prev.registrations.map(reg => 
            reg.id === message.data.id ? { ...reg, ...message.data } : reg
          )
        }));
        break;
      case 'ticket_update':
        // Update tickets list
        setData(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket => 
            ticket.id === message.data.id ? { ...ticket, ...message.data } : ticket
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
          <h1 className="text-2xl font-bold text-gray-900">Athlete Dashboard</h1>
          <Skeleton className="w-32 h-8" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
          <p className="text-gray-600">Here's what's happening with your sports activities</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Registrations"
          value={data.stats.totalRegistrations}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Tickets"
          value={data.stats.totalTickets}
          icon={TicketIcon}
          color="green"
        />
        <StatCard
          title="Notifications"
          value={data.stats.unreadNotifications}
          icon={BellIcon}
          color="yellow"
        />
      </div>

      {/* Recent Registrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
            <a href="/athlete/registrations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all
            </a>
          </div>
        </div>
        <div className="p-6">
          {data.registrations.length > 0 ? (
            <div className="space-y-4">
              {data.registrations.slice(0, 3).map(registration => (
                <div key={registration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{registration.event_name}</h3>
                    <p className="text-sm text-gray-500">{registration.event_sport}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {registration.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(registration.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRegistrations 
              action={
                <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Browse Events
                </a>
              }
            />
          )}
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <a href="/athlete/tickets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all
            </a>
          </div>
        </div>
        <div className="p-6">
          {data.tickets.length > 0 ? (
            <div className="space-y-4">
              {data.tickets.slice(0, 3).map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{ticket.ticket_type}</h3>
                    <p className="text-sm text-gray-500">{ticket.event_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ticket.status === 'valid' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'used' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {ticket.serial}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTickets 
              action={
                <a href="/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Buy Tickets
                </a>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
