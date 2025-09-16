import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const CTA = () => {
  const features = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    '24/7 support included'
  ];

  const benefits = [
    {
      icon: TrophyIcon,
      title: 'Win More Events',
      description: 'Streamline operations and focus on what matters'
    },
    {
      icon: UserGroupIcon,
      title: 'Grow Your Community',
      description: 'Engage participants and build lasting relationships'
    },
    {
      icon: CalendarIcon,
      title: 'Save Time & Money',
      description: 'Automate processes and reduce administrative overhead'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 hover:scale-105 transition-transform duration-300">
            <SparklesIcon className="w-4 h-4 text-yellow-400" />
            <span>Limited Time Offer</span>
          </div>
          
          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Transform
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Your Sports Management?
            </span>
          </h2>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join thousands of sports organizations already using Timely to streamline their operations, 
            engage their communities, and grow their events.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{benefit.title}</h3>
                </div>
                <p className="text-blue-100 text-left">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link
              to="/signup"
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Your Free Trial
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
            </Link>
            
            <button className="group flex items-center gap-4 text-white hover:text-blue-200 font-semibold text-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:bg-white/20 transition-all duration-300">
                <TrophyIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="font-bold">See Success Stories</div>
                <div className="text-sm text-blue-200">Real results from real users</div>
              </div>
            </button>
          </div>
          
          {/* Features List */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-blue-100 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="font-semibold">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-2">50K+</div>
              <div className="text-blue-200 font-semibold">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-2">1K+</div>
              <div className="text-blue-200 font-semibold">Events Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-2">99.9%</div>
              <div className="text-blue-200 font-semibold">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;