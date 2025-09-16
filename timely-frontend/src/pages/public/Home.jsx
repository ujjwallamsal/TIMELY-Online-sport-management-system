import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../../components/public/Hero';
import Stats from '../../components/public/Stats';
import Features from '../../components/public/Features';
import UpcomingEvents from '../../components/public/UpcomingEvents';
import Roles from '../../components/public/Roles';
import Testimonials from '../../components/public/Testimonials';
import CTA from '../../components/public/CTA';
import PublicFooter from '../../components/public/PublicFooter';
import { 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Timely</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#events" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Events</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
            </nav>
            
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
              >
                Get Started Free
                <ArrowRightIcon className="inline-block w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#features"
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#events"
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </a>
              <a
                href="#testimonials"
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <Link
                  to="/login"
                  className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content">
        <Hero />
        <Stats />
        <Features />
        <UpcomingEvents />
        <Roles />
        <Testimonials />
        <CTA />
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};

export default Home;