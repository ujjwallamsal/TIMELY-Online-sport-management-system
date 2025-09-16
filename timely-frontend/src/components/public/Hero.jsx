import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlayIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-screen flex items-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 hover:scale-105 transition-transform duration-300">
            <StarSolid className="w-4 h-4 text-yellow-400" />
            <span>Trusted by 50,000+ athletes worldwide</span>
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
          </div>
          
          {/* Main Heading with Gradient */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tight">
            <span className="block">The Future of</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Sports Management
            </span>
          </h1>
          
          {/* Subheading with better typography */}
          <p className="text-xl md:text-2xl lg:text-3xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Transform your sports organization with our all-in-one platform. 
            <span className="text-white font-semibold"> Streamline registrations</span>, 
            <span className="text-white font-semibold"> manage teams</span>, and 
            <span className="text-white font-semibold"> track results</span> in real-time.
          </p>
          
          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              to="/signup"
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Free Trial
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
            </Link>
            
            <button className="group flex items-center gap-4 text-white hover:text-blue-200 font-semibold text-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:bg-white/20 transition-all duration-300">
                <PlayIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="font-bold">Watch Demo</div>
                <div className="text-sm text-blue-200">See it in action</div>
              </div>
            </button>
          </div>
          
          {/* Enhanced Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <div className="text-left">
                <div className="text-white font-semibold">No Credit Card</div>
                <div className="text-blue-200 text-sm">Start completely free</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <ClockIcon className="w-6 h-6 text-blue-400" />
              <div className="text-left">
                <div className="text-white font-semibold">14-Day Trial</div>
                <div className="text-blue-200 text-sm">Full access included</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <div className="text-white font-semibold">Cancel Anytime</div>
                <div className="text-blue-200 text-sm">No commitments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;