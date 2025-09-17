import React, { useState, useEffect } from 'react';
import { publicAPI } from '../../services/api';
import useSocket from '../../hooks/useSocket';
import Skeleton from '../ui/Skeleton';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  MapPinIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Stats = () => {
  const [stats, setStats] = useState({
    events: 0,
    participants: 0,
    teams: 0,
    venues: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({
    events: 0,
    participants: 0,
    teams: 0,
    venues: 0
  });

  // WebSocket connection for real-time updates
  const { connectionStatus } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/content/public/`,
    {
      onMessage: (message) => {
        if (message.type === 'stats_updated') {
          // Refresh stats when real-time event is received
          fetchStats();
        }
      }
    }
  );

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicAPI.getPublicStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Animate counters
  useEffect(() => {
    if (!loading && stats) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;
      
      Object.keys(stats).forEach(key => {
        if (key !== 'last_updated') {
          const targetValue = stats[key];
          const increment = targetValue / steps;
          let currentValue = 0;
          
          const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
              currentValue = targetValue;
              clearInterval(timer);
            }
            
            setAnimatedStats(prev => ({
              ...prev,
              [key]: Math.floor(currentValue)
            }));
          }, stepDuration);
        }
      });
    }
  }, [loading, stats]);

  useEffect(() => {
    fetchStats();
  }, []);

  const statItems = [
    {
      icon: CalendarIcon,
      label: 'Events Hosted',
      value: animatedStats.events,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: UserGroupIcon,
      label: 'Active Athletes',
      value: animatedStats.participants,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: TrophyIcon,
      label: 'Teams Competing',
      value: animatedStats.teams,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: MapPinIcon,
      label: 'Venues Worldwide',
      value: animatedStats.venues,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-20 w-20 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-600 mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            Live Statistics
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Trusted by
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sports Organizations
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of organizations that trust Timely to manage their sports events, 
            teams, and participants with real-time updates and seamless experiences.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-white/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${item.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-8 h-8 ${item.iconColor}`} />
              </div>
              
              {/* Animated Number */}
              <div className="mb-4">
                <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  {item.value.toLocaleString()}
                  {item.value >= 1000 && <span className="text-2xl">+</span>}
                </div>
              </div>
              
              {/* Label */}
              <div className="text-gray-600 font-semibold text-lg group-hover:text-gray-900 transition-colors">
                {item.label}
              </div>
              
              {/* Decorative Element */}
              <div className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-r ${item.color} rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium">
            <ChartBarIcon className="w-4 h-4" />
            <span>Numbers updated in real-time</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;