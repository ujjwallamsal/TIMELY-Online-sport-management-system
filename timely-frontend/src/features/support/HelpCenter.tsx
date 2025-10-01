import React from 'react';

const HelpCenter: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Help Center</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Creating an Account</h3>
                <p className="text-gray-600">
                  Sign up with your email address and basic information. Choose your role as a Spectator, Athlete, Coach, or Organizer.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Finding Events</h3>
                <p className="text-gray-600">
                  Browse the Events page to find upcoming sports events. Use filters to narrow down by sport, date, or location.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Registering for Events</h3>
                <p className="text-gray-600">
                  Click on any event to view details and register. Some events may require approval from organizers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Common Issues</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Can't log in?</h3>
                <p className="text-gray-600">
                  Make sure you're using the correct email address and password. If you've forgotten your password, contact your administrator at admin@timely.local.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Event registration not working?</h3>
                <p className="text-gray-600">
                  Check if the event is still open for registration and if you meet any eligibility requirements. Some events have limited capacity.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Payment issues?</h3>
                <p className="text-gray-600">
                  We use Stripe for secure payments. Make sure your payment method is valid and has sufficient funds. Contact support if charges appear but tickets aren't issued.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Support</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Need additional help? Our support team is here to assist you.
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <strong>Email:</strong> admin@timely.local
                </p>
                <p className="text-gray-600">
                  <strong>Response Time:</strong> Within 24 hours during business days
                </p>
                <p className="text-gray-600">
                  <strong>Business Hours:</strong> Monday - Friday, 9 AM - 5 PM
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
