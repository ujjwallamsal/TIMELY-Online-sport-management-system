import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Event Organizer',
      company: 'City Sports League',
      content: 'Timely has revolutionized how we manage our sports events. The registration process is seamless, and the real-time updates keep everyone informed. Our participants love the mobile experience!',
      rating: 5,
      avatar: 'SJ',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Mike Chen',
      role: 'Basketball Coach',
      company: 'Westside High School',
      content: 'As a coach, I need to focus on my team, not paperwork. Timely handles all the administrative tasks so I can concentrate on what matters most - developing my players.',
      rating: 5,
      avatar: 'MC',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Athlete',
      company: 'Track & Field',
      content: 'The athlete dashboard is incredible! I can track my results, see upcoming events, and communicate with my team all in one place. It makes managing my sports career so much easier.',
      rating: 5,
      avatar: 'ER',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'David Thompson',
      role: 'Sports Director',
      company: 'Metro Recreation',
      content: 'The analytics and reporting features have given us insights we never had before. We can now make data-driven decisions about our programs and see real growth in participation.',
      rating: 5,
      avatar: 'DT',
      color: 'from-orange-500 to-red-500'
    },
    {
      name: 'Lisa Wang',
      role: 'Parent & Volunteer',
      company: 'Youth Soccer League',
      content: 'As a parent, I love how easy it is to stay updated on my daughter\'s games and events. The notifications are perfect, and I never miss important updates anymore.',
      rating: 5,
      avatar: 'LW',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      name: 'James Wilson',
      role: 'League Commissioner',
      company: 'Regional Basketball',
      content: 'Timely has streamlined our entire league operations. From scheduling to results, everything is automated and real-time. Our efficiency has improved by 300%.',
      rating: 5,
      avatar: 'JW',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-600 mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            What Our Users Say
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Loved by
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sports Communities
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what athletes, coaches, and organizers 
            are saying about their experience with Timely.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-200 group-hover:text-blue-200 transition-colors duration-300" />
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              
              {/* Content */}
              <blockquote className="text-gray-700 leading-relaxed mb-8 text-lg">
                "{testimonial.content}"
              </blockquote>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  <div className="text-gray-500 text-sm">{testimonial.company}</div>
                </div>
              </div>
              
              {/* Decorative Element */}
              <div className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-r ${testimonial.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300 -translate-y-8 translate-x-8`}></div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">
              Join Thousands of Satisfied Users
            </h3>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black text-blue-600 mb-2">4.9/5</div>
                <div className="text-gray-600 font-semibold">Average Rating</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-green-600 mb-2">98%</div>
                <div className="text-gray-600 font-semibold">Would Recommend</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-purple-600 mb-2">50K+</div>
                <div className="text-gray-600 font-semibold">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600 font-semibold">Support</div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50">
                Read More Reviews
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </button>
              <button className="text-gray-600 hover:text-gray-900 font-semibold text-lg transition-colors">
                Write a Review →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;