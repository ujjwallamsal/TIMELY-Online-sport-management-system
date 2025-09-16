import React from 'react';
import { 
  UserGroupIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Features = () => {
  const features = [
    {
      icon: UserGroupIcon,
      title: 'Team Management',
      description: 'Easily manage team rosters, player assignments, and coach permissions with our intuitive interface.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      details: ['Roster Management', 'Player Profiles', 'Coach Permissions', 'Team Communication']
    },
    {
      icon: CreditCardIcon,
      title: 'Payment Processing',
      description: 'Secure payment processing with support for multiple payment methods and automated invoicing.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      details: ['Stripe Integration', 'PayPal Support', 'Automated Invoicing', 'Refund Management']
    },
    {
      icon: ChartBarIcon,
      title: 'Live Results & Analytics',
      description: 'Real-time results tracking, leaderboards, and comprehensive analytics for better insights.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      details: ['Real-time Updates', 'Leaderboards', 'Performance Analytics', 'Custom Reports']
    },
    {
      icon: BellIcon,
      title: 'Smart Notifications',
      description: 'Automated notifications for registrations, payments, schedule changes, and important updates.',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      details: ['Email Alerts', 'SMS Notifications', 'Push Notifications', 'Custom Triggers']
    },
    {
      icon: ShieldCheckIcon,
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with GDPR compliance and data protection for all user information.',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      details: ['GDPR Compliant', 'SSL Encryption', 'Data Backup', 'Access Controls']
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-First Design',
      description: 'Fully responsive design that works perfectly on all devices with native mobile app features.',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      details: ['Responsive Design', 'Mobile Apps', 'Offline Support', 'Touch Optimized']
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm font-medium text-blue-600 mb-6">
            <SparklesIcon className="w-4 h-4" />
            Powerful Features
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Manage Sports Events
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive platform provides all the tools you need to organize, manage, 
            and grow your sports events with professional-grade features and real-time capabilities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
              </div>
              
              {/* Content */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Feature Details */}
              <div className="space-y-2 mb-6">
                {feature.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
              
              {/* Learn More Link */}
              <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all duration-300">
                <span>Learn more</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              
              {/* Decorative Element */}
              <div className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-r ${feature.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12 border border-blue-100">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Sports Management?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of organizations already using Timely to streamline their sports events and grow their communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50">
                Start Free Trial
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </button>
              <button className="text-gray-600 hover:text-gray-900 font-semibold text-lg transition-colors">
                View All Features →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;