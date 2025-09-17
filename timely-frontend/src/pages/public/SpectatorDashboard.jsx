// src/pages/public/SpectatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  QrCodeIcon,
  BellIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import useLiveChannel from '../../hooks/useLiveChannel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function SpectatorDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates for public events
  const { 
    isConnected, 
    error: wsError 
  } = useLiveChannel('public_events', {
    onMessage: (data) => {
      if (data.type === 'event_update') {
        setUpcomingEvents(prev => prev.map(event => 
          event.id === data.data.event_id ? { ...event, ...data.data } : event
        ));
      }
      if (data.type === 'ticket_update') {
        setMyTickets(prev => prev.map(ticket => 
          ticket.id === data.data.ticket_id ? { ...ticket, ...data.data } : ticket
        ));
      }
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data - replace with actual API calls
        setUpcomingEvents([
          {
            id: 1,
            title: "Championship Finals 2024",
            date: "2024-03-15",
            time: "14:00",
            venue: "Main Arena",
            price: 25,
            status: "upcoming",
            category: "Basketball"
          },
          {
            id: 2,
            title: "Summer Olympics Qualifiers",
            date: "2024-03-20",
            time: "16:30",
            venue: "Field A",
            price: 35,
            status: "upcoming",
            category: "Soccer"
          },
          {
            id: 3,
            title: "Local Basketball Tournament",
            date: "2024-03-25",
            time: "18:00",
            venue: "Community Center",
            price: 15,
            status: "upcoming",
            category: "Basketball"
          }
        ]);

        setMyTickets([
          {
            id: 1,
            event: "Championship Finals 2024",
            date: "2024-03-15",
            venue: "Main Arena",
            qrCode: "QR123456",
            status: "confirmed",
            price: 25
          },
          {
            id: 2,
            event: "Summer Olympics Qualifiers",
            date: "2024-03-20",
            venue: "Field A",
            qrCode: "QR789012",
            status: "confirmed",
            price: 35
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton variant="title" width="200px" className="mb-2" />
          <Skeleton variant="text" width="400px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Timely Sports</h1>
        <p className="text-gray-600 mt-2">
          Discover upcoming events and manage your tickets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Live Events</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
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
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.category}</p>
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarDaysIcon className="w-3 h-3 mr-1" />
                        {event.date} at {event.time}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="w-3 h-3 mr-1">📍</span>
                        {event.venue}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${event.price}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'upcoming' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No Upcoming Events"
              description="Check back later for new events."
            />
          )}
        </Card>

        {/* My Tickets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
            <Link to="/tickets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {myTickets.length > 0 ? (
            <div className="space-y-4">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{ticket.event}</h3>
                    <p className="text-sm text-gray-600">{ticket.venue}</p>
                    <p className="text-xs text-gray-500">{ticket.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mb-2">
                      <QrCodeIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">{ticket.qrCode}</p>
                    <p className="text-sm font-medium text-gray-900">${ticket.price}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={QrCodeIcon}
              title="No Tickets Yet"
              description="Purchase tickets to events to see them here."
            />
          )}
        </Card>
      </div>

      {/* Call to Action */}
      <div className="mt-8">
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="text-center">
            <TrophyIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Experience Sports?</h2>
            <p className="text-gray-600 mb-6">
              Join thousands of sports fans and get tickets to the best events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events">
                <Button variant="primary" size="lg">
                  Browse Events
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
