import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const stats = [
    { number: "500+", label: "Events Created", icon: "🏟️" },
    { number: "10K+", label: "Athletes", icon: "🏃‍♂️" },
    { number: "50+", label: "Venues", icon: "📍" },
    { number: "25+", label: "Sports", icon: "⚽" }
  ];

  const features = [
    {
      icon: "🎯",
      title: "Smart Scheduling",
      description: "AI-powered fixture generation with conflict detection and venue optimization"
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description: "Integrated Stripe & PayPal with automatic ticket generation and QR codes"
    },
    {
      icon: "📱",
      title: "Real-time Updates",
      description: "Live notifications, results, and schedule changes via WebSocket"
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Comprehensive reporting, leaderboards, and performance tracking"
    }
  ];

  const sports = [
    { name: "Football", icon: "⚽", color: "from-green-500 to-green-600" },
    { name: "Basketball", icon: "🏀", color: "from-orange-500 to-orange-600" },
    { name: "Swimming", icon: "🏊‍♂️", color: "from-blue-500 to-blue-600" },
    { name: "Tennis", icon: "🎾", color: "from-yellow-500 to-yellow-600" },
    { name: "Cricket", icon: "🏏", color: "from-red-500 to-red-600" },
    { name: "Athletics", icon: "🏃‍♂️", color: "from-purple-500 to-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Timely
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Your comprehensive sports events management platform. Create, organize, and participate in exciting sporting events with professional tools and real-time updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/signup"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-2xl text-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/events"
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-2xl text-lg hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl"
                >
                  Browse Events
                </Link>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Timely?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for organizers, athletes, and spectators with cutting-edge technology and user experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sports We Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From traditional sports to emerging disciplines, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sports.map((sport, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {sport.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{sport.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Sports Events?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of organizers and athletes who trust Timely for their sports management needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                >
                  Start Organizing
                </Link>
                <Link
                  to="/events"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl text-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300"
                >
                  Browse Events
                </Link>
              </>
            ) : (
              <Link
                to="/events"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-2xl"
              >
                Explore Events
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">⏰</div>
                <h3 className="text-2xl font-bold">Timely</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The ultimate platform for sports event management. Streamline your events, engage participants, and deliver exceptional experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link to="/matches" className="hover:text-white transition-colors">Matches</Link></li>
                <li><Link to="/results" className="hover:text-white transition-colors">Results</Link></li>
                <li><Link to="/news" className="hover:text-white transition-colors">News</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Timely. All rights reserved. Built with ❤️ for the sports community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
