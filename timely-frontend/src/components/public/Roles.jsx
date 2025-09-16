import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  UserGroupIcon, 
  EyeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Roles = () => {
  const roles = [
    {
      icon: UserIcon,
      title: 'Athletes',
      description: 'Join events, track your performance, and connect with your team.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      features: [
        'Event Registration',
        'Performance Tracking',
        'Team Communication',
        'Results & Leaderboards'
      ],
      cta: 'Join as Athlete',
      link: '/signup?role=athlete'
    },
    {
      icon: UserGroupIcon,
      title: 'Coaches',
      description: 'Manage your team, track progress, and coordinate with athletes.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      features: [
        'Team Management',
        'Player Development',
        'Event Coordination',
        'Performance Analytics'
      ],
      cta: 'Start Coaching',
      link: '/signup?role=coach'
    },
    {
      icon: EyeIcon,
      title: 'Spectators',
      description: 'Follow your favorite teams and events, get live updates.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      features: [
        'Live Event Updates',
        'Team Following',
        'Results & News',
        'Event Discovery'
      ],
      cta: 'Start Following',
      link: '/signup?role=spectator'
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm font-medium text-blue-600 mb-6">
            <SparklesIcon className="w-4 h-4" />
            Choose Your Role
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Built for
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether you're an athlete, coach, or spectator, Timely provides the perfect tools 
            and features tailored to your role in the sports community.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {roles.map((role, index) => (
            <div
              key={role.title}
              className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${role.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <role.icon className={`w-8 h-8 ${role.iconColor}`} />
              </div>
              
              {/* Content */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {role.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {role.description}
                </p>
                
                {/* Features */}
                <div className="space-y-3">
                  {role.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Button */}
              <Link
                to={role.link}
                className={`group/btn w-full bg-gradient-to-r ${role.color} text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2`}
              >
                <span>{role.cta}</span>
                <ArrowRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              
              {/* Decorative Element */}
              <div className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-r ${role.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of athletes, coaches, and spectators who are already using Timely 
              to enhance their sports experience.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600 font-semibold">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-green-600 mb-2">1K+</div>
                <div className="text-gray-600 font-semibold">Events Hosted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-purple-600 mb-2">99.9%</div>
                <div className="text-gray-600 font-semibold">Satisfaction Rate</div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                Get Started Free
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </Link>
              <button className="text-gray-600 hover:text-gray-900 font-semibold text-lg transition-colors">
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roles;