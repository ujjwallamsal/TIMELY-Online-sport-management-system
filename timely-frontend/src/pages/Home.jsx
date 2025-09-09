import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../lib/api';
import Hero from '../components/Hero';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHomeData = async () => {
    try {
      setLoading(true);
        const response = await publicAPI.getPublicHome();
        setHomeData(response.data);
    } catch (err) {
        console.error('Failed to load home data:', err);
        setError('Failed to load home data. Please try again later.');
    } finally {
      setLoading(false);
    }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero 
        events={homeData?.heroEvents || []} 
        highlights={homeData?.highlights || { ticketsSold: 0, upcomingCount: 0 }}
      />

      {/* Latest News Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest News</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest announcements and news from our sports community.
          </p>
        </div>

        {homeData?.news && homeData.news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homeData.news.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
              >
                  <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.body}
                  </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                      {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    <Link
                      to={`/news/${article.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No news available</h3>
            <p className="text-gray-600">
              Check back later for the latest announcements and updates.
            </p>
          </div>
        )}

        {/* View All News Link */}
        <div className="text-center mt-12">
          <Link
            to="/news"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            View All News
          </Link>
        </div>
        </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find what you're looking for quickly and easily.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/events"
              className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold mb-2">Browse Events</h3>
              <p className="text-blue-100 text-sm">
                Discover upcoming tournaments and competitions
              </p>
            </Link>

            <Link
              to="/schedule"
              className="group bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg font-semibold mb-2">View Schedule</h3>
              <p className="text-green-100 text-sm">
                Check match times and venue information
              </p>
            </Link>

            <Link
              to="/results"
              className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">🏅</div>
              <h3 className="text-lg font-semibold mb-2">See Results</h3>
              <p className="text-purple-100 text-sm">
                Track scores and leaderboards
              </p>
            </Link>

            <Link
              to="/news"
              className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">📰</div>
              <h3 className="text-lg font-semibold mb-2">Read News</h3>
              <p className="text-orange-100 text-sm">
                Stay updated with announcements
              </p>
            </Link>
          </div>
        </div>
        </div>
    </div>
  );
};

export default Home;