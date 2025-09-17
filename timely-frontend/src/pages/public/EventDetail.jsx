// src/pages/public/EventDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  PhotoIcon,
  NewspaperIcon,
  TicketIcon,
  ShareIcon,
  HeartIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

const tabs = [
  { id: 'overview', name: 'Overview', icon: CalendarDaysIcon },
  { id: 'schedule', name: 'Schedule', icon: ClockIcon },
  { id: 'results', name: 'Results', icon: TrophyIcon },
  { id: 'leaderboard', name: 'Leaderboard', icon: UserGroupIcon },
  { id: 'media', name: 'Media', icon: PhotoIcon },
  { id: 'news', name: 'News', icon: NewspaperIcon },
  { id: 'tickets', name: 'Tickets', icon: TicketIcon },
];

export default function EventDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Simulate API call
        setEvent({
          id: parseInt(id),
          name: "Championship Finals 2024",
          sport: "Basketball",
          description: "The ultimate basketball championship featuring the best teams from around the world. This prestigious event brings together top athletes and teams for an unforgettable competition.",
          startDate: "2024-03-15T18:00:00Z",
          endDate: "2024-03-17T22:00:00Z",
          venue: {
            name: "Madison Square Garden",
            address: "4 Pennsylvania Plaza, New York, NY 10001",
            capacity: 20000
          },
          price: 75,
          capacity: 20000,
          registered: 18500,
          status: "upcoming",
          image: "/images/events/championship-2024.jpg",
          rules: [
            "All participants must be 18 years or older",
            "Valid ID required for registration",
            "No outside food or beverages allowed",
            "Follow all venue safety protocols"
          ],
          prizes: [
            "1st Place: $10,000 + Trophy",
            "2nd Place: $5,000 + Medal",
            "3rd Place: $2,500 + Medal"
          ],
          schedule: [
            {
              time: "09:00",
              event: "Registration & Check-in",
              location: "Main Entrance"
            },
            {
              time: "10:00",
              event: "Opening Ceremony",
              location: "Main Arena"
            },
            {
              time: "11:00",
              event: "Preliminary Rounds",
              location: "Courts 1-4"
            },
            {
              time: "14:00",
              event: "Quarter Finals",
              location: "Main Court"
            },
            {
              time: "16:00",
              event: "Semi Finals",
              location: "Main Court"
            },
            {
              time: "18:00",
              event: "Championship Game",
              location: "Main Court"
            },
            {
              time: "20:00",
              event: "Awards Ceremony",
              location: "Main Arena"
            }
          ],
          results: [
            {
              team: "Team Alpha",
              score: 95,
              position: 1
            },
            {
              team: "Team Beta",
              score: 87,
              position: 2
            },
            {
              team: "Team Gamma",
              score: 82,
              position: 3
            }
          ],
          leaderboard: [
            {
              position: 1,
              team: "Team Alpha",
              points: 95,
              wins: 5,
              losses: 0
            },
            {
              position: 2,
              team: "Team Beta",
              points: 87,
              wins: 4,
              losses: 1
            },
            {
              position: 3,
              team: "Team Gamma",
              points: 82,
              wins: 3,
              losses: 2
            }
          ],
          media: [
            {
              type: "image",
              url: "/images/gallery/event-1.jpg",
              caption: "Opening ceremony highlights"
            },
            {
              type: "video",
              url: "/videos/event-highlights.mp4",
              caption: "Best moments from the tournament"
            }
          ],
          news: [
            {
              title: "Championship Finals Set to Begin",
              date: "2024-03-10",
              excerpt: "The highly anticipated championship finals are just days away..."
            },
            {
              title: "Top Teams Announced",
              date: "2024-03-08",
              excerpt: "The final list of participating teams has been released..."
            }
          ],
          tickets: [
            {
              type: "General Admission",
              price: 75,
              available: 1500,
              description: "Access to all games and events"
            },
            {
              type: "VIP",
              price: 150,
              available: 200,
              description: "Premium seating and exclusive access"
            },
            {
              type: "Student",
              price: 45,
              available: 500,
              description: "Discounted tickets for students with valid ID"
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    if (!event) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Description</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rules & Regulations</h3>
                <ul className="space-y-2">
                  {event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-600">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prizes</h3>
                <ul className="space-y-2">
                  {event.prizes.map((prize, index) => (
                    <li key={index} className="flex items-start">
                      <TrophyIcon className="flex-shrink-0 w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                      <span className="text-gray-600">{prize}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Schedule</h3>
            <div className="space-y-4">
              {event.schedule.map((item, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-indigo-600">
                    {item.time}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.event}</h4>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'results':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Results</h3>
            <div className="space-y-3">
              {event.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-indigo-600 mr-4">#{result.position}</span>
                    <span className="text-lg font-medium text-gray-900">{result.team}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{result.score}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Leaderboard</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Losses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {event.leaderboard.map((team, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{team.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.points}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.wins}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'media':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.media.map((item, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                    {item.type === 'image' ? (
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">▶</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.caption}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'news':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event News</h3>
            <div className="space-y-4">
              {event.news.map((article, index) => (
                <Card key={index} className="p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{article.title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{article.date}</p>
                  <p className="text-gray-600">{article.excerpt}</p>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'tickets':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tickets</h3>
            <div className="space-y-4">
              {event.tickets.map((ticket, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{ticket.type}</h4>
                      <p className="text-gray-600">{ticket.description}</p>
                      <p className="text-sm text-gray-500">{ticket.available} tickets available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">${ticket.price}</p>
                      <Button size="sm" className="mt-2">
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton variant="title" width="400px" className="mb-4" />
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="mr-4">
                <ChevronLeftIcon className="w-6 h-6 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="text-gray-600">{event.sport} • {event.venue.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-full ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              >
                <HeartIcon className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <ShareIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <Card className="p-6">
              {renderTabContent()}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date & Time</p>
                    <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Venue</p>
                    <p className="text-sm text-gray-600">{event.venue.name}</p>
                    <p className="text-sm text-gray-500">{event.venue.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <UserGroupIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Capacity</p>
                    <p className="text-sm text-gray-600">{event.registered.toLocaleString()} / {event.capacity.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            </Card>

            {/* Registration */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register Now</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-indigo-600">${event.price}</span>
                  <p className="text-sm text-gray-500">per person</p>
                </div>
                
                <Button className="w-full" size="lg">
                  Register for Event
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Registration closes 24 hours before the event
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
