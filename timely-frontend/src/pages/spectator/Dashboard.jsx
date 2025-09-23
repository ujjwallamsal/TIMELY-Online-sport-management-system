// src/pages/spectator/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  QrCodeIcon,
  BellIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import useLiveChannel from '../../hooks/useLiveChannel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { spectatorDashboardAPI, dashboardUtils } from '../../services/dashboardAPI';

export default function SpectatorDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates for spectator data
  const { 
    isConnected, 
    error: wsError 
  } = useLiveChannel('spectator_updates', {
    onMessage: (data) => {
      if (data.type === 'event_update') {
        setUpcomingEvents(prev => prev.map(event => 
          event.id === data.event_id ? { ...event, ...data.data } : event
        ));
      }
      if (data.type === 'ticket_update') {
        setMyTickets(prev => prev.map(ticket => 
          ticket.id === data.ticket_id ? { ...ticket, ...data.data } : ticket
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
        const [eventsData, ticketsData, announcementsData] = await Promise.all([
          spectatorDashboardAPI.getUpcomingEvents(),
          spectatorDashboardAPI.getMyTickets(),
          spectatorDashboardAPI.getAnnouncements()
        ]);

        setUpcomingEvents(eventsData);
        setMyTickets(ticketsData);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Spectator Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Discover upcoming events and manage your tickets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{myTickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-6 h-6 text-green-600" />
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

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingEvents.filter(e => e.status === 'ongoing').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
            <Link to="/events">
              <Button variant="outline" size="sm">
                View All
                <EyeIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.venue?.name || 'TBD'}</p>
                    <p className="text-xs text-gray-500">{dashboardUtils.formatDate(event.start_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'upcoming' 
                        ? 'bg-blue-100 text-blue-800'
                        : event.status === 'ongoing'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.ticket_price ? dashboardUtils.formatCurrency(event.ticket_price) : 'Free'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No Upcoming Events"
              description="No events are scheduled at the moment."
            />
          )}
        </Card>

        {/* My Tickets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
            <Link to="/tickets">
              <Button variant="outline" size="sm">
                View All
                <EyeIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {myTickets.length > 0 ? (
            <div className="space-y-4">
              {myTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{ticket.event?.title || 'Event'}</h3>
                    <p className="text-sm text-gray-600">{ticket.venue?.name || 'TBD'}</p>
                    <p className="text-xs text-gray-500">{dashboardUtils.formatDate(ticket.event?.start_date)}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <QrCodeIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ticket.qr_code || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={QrCodeIcon}
              title="No Tickets Yet"
              description="Your event tickets will appear here."
            />
          )}
        </Card>

        {/* Announcements */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Announcements</h2>
            <Link to="/announcements">
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
                    <p className="text-xs text-gray-500 mt-2">{dashboardUtils.formatDate(announcement.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BellIcon}
              title="No Announcements"
              description="No recent announcements for spectators."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
