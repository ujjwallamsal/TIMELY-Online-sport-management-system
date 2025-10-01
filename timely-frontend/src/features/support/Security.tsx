import React from 'react';

const Security: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Security</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Protection</h2>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Encryption</h3>
                <p className="text-green-800">
                  All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Secure Authentication</h3>
                <p className="text-green-800">
                  We use JWT tokens with short expiration times and secure refresh mechanisms.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Payment Security</h3>
                <p className="text-green-800">
                  Payment processing is handled by Stripe, which is PCI DSS compliant. We never store credit card information.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Security Responsibilities</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Strong Passwords</h3>
                <p className="text-blue-800">
                  Use a unique, strong password for your account. Avoid reusing passwords from other services.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Account Access</h3>
                <p className="text-blue-800">
                  Never share your login credentials with others. Always log out from shared or public computers.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Suspicious Activity</h3>
                <p className="text-blue-800">
                  Report any suspicious activity or unauthorized access to your account immediately.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy Controls</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Data Access</h3>
                <p className="text-gray-600">
                  You can view and update your personal information in your profile settings. Contact support to request data deletion.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Gallery Privacy</h3>
                <p className="text-gray-600">
                  You control the visibility of your gallery uploads. Choose between public and private visibility for each item.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Communication Preferences</h3>
                <p className="text-gray-600">
                  Manage your notification preferences in your profile to control what emails and notifications you receive.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Incident Response</h2>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-900 mb-2">Security Incidents</h3>
              <p className="text-yellow-800 mb-4">
                If you discover a security vulnerability or suspect unauthorized access to your account:
              </p>
              <ul className="list-disc list-inside text-yellow-800 space-y-1">
                <li>Contact us immediately at admin@timely.local</li>
                <li>Do not attempt to exploit the vulnerability</li>
                <li>Provide as much detail as possible about the incident</li>
                <li>We will respond within 24 hours and work to resolve the issue</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Compliance</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                Our platform is designed with security best practices in mind. We regularly audit our systems and update our security measures to protect your data and maintain the integrity of our platform.
              </p>
              <p className="text-gray-600 mt-2">
                For detailed information about our data handling practices, please review our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Security;
