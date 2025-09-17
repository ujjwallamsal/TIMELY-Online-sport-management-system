// src/pages/athlete/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  TrophyIcon,
  QrCodeIcon,
  BellIcon,
  UserPlusIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import useLiveChannel from '../../hooks/useLiveChannel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function AthleteDashboard() {
  const [nextMatch, setNextMatch] = useState(null);
  const [myResults, setMyResults] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates for athlete data
  const { 
    isConnected, 
    error: wsError 
  } = useLiveChannel('athlete_updates', {
    onMessage: (data) => {
      if (data.type === 'match_update') {
        setNextMatch(prev => prev?.id === data.match_id ? { ...prev, ...data.data } : prev);
      }
      if (data.type === 'result_update') {
        setMyResults(prev => prev.map(result => 
          result.id === data.result_id ? { ...result, ...data.data } : result
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
        // Mock data - replace with actual API calls
        setNextMatch({
          id: 1,
          event: "Championship Finals 2024",
          opponent: "Storm Riders",
          date: "2024-03-15",
          time: "14:00",
          venue: "Main Arena",
          status: "upcoming"
        });

        setMyResults([
          {
            id: 1,
            event: "Spring Qualifiers",
            opponent: "Thunder Hawks",
            date: "2024-03-10",
            score: "3-1",
            result: "win",
            position: 1
          },
          {
            id: 2,
            event: "Regional Championship",
            opponent: "Fire Dragons",
            date: "2024-03-05",
            score: "2-2",
            result: "draw",
            position: 2
          }
        ]);

        setMyTickets([
          {
            id: 1,
            event: "Championship Finals 2024",
            date: "2024-03-15",
            venue: "Main Arena",
            qrCode: "QR123456",
            status: "confirmed"
          },
          {
            id: 2,
            event: "Summer Olympics Qualifiers",
            date: "2024-03-20",
            venue: "Field A",
            qrCode: "QR789012",
            status: "confirmed"
          }
        ]);

        setAnnouncements([
          {
            id: 1,
            title: "Match Schedule Update",
            message: "Your next match has been moved to 3 PM",
            date: "2024-03-12",
            priority: "high"
          },
          {
            id: 2,
            title: "Equipment Reminder",
            message: "Don't forget to bring your gear",
            date: "2024-03-10",
            priority: "medium"
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
        <h1 className="text-3xl font-bold text-gray-900">Athlete Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track your matches, results, and tickets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Next Match</p>
              <p className="text-2xl font-bold text-gray-900">
                {nextMatch ? '1' : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Results</p>
              <p className="text-2xl font-bold text-gray-900">{myResults.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{myTickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-6 h-6 text-purple-600" />
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="md">
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Register/Join Team
          </Button>
          <Button variant="outline" size="md">
            <QrCodeIcon className="w-5 h-5 mr-2" />
            View QR Tickets
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Match */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Next Match</h2>
            <ClockIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          {nextMatch ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{nextMatch.event}</h3>
              <p className="text-sm text-gray-600 mt-1">vs {nextMatch.opponent}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  {nextMatch.date} at {nextMatch.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-4 h-4 mr-2">📍</span>
                  {nextMatch.venue}
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  nextMatch.status === 'upcoming' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {nextMatch.status}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDaysIcon}
              title="No Upcoming Matches"
              description="You don't have any matches scheduled."
            />
          )}
        </Card>

        {/* My Results */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Results</h2>
            <Link to="/athlete/results">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {myResults.length > 0 ? (
            <div className="space-y-4">
              {myResults.slice(0, 3).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{result.event}</h3>
                    <p className="text-sm text-gray-600">vs {result.opponent}</p>
                    <p className="text-xs text-gray-500">{result.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{result.score}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.result === 'win' 
                        ? 'bg-green-100 text-green-800'
                        : result.result === 'draw'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.result}
                    </span>
                    {result.position && (
                      <p className="text-xs text-gray-500 mt-1">#{result.position}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrophyIcon}
              title="No Results Yet"
              description="Your match results will appear here."
            />
          )}
        </Card>

        {/* My Tickets (QR) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Tickets (QR)</h2>
            <Link to="/athlete/tickets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {myTickets.length > 0 ? (
            <div className="space-y-4">
              {myTickets.slice(0, 3).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{ticket.event}</h3>
                    <p className="text-sm text-gray-600">{ticket.venue}</p>
                    <p className="text-xs text-gray-500">{ticket.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <QrCodeIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ticket.qrCode}</p>
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
            <Link to="/athlete/announcements">
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
              description="No recent announcements for you."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
