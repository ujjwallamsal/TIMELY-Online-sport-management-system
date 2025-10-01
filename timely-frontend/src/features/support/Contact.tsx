import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">General Support</h3>
                <p className="text-gray-600 mb-2">For general questions and support:</p>
                <p className="text-blue-600">admin@timely.local</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Technical Issues</h3>
                <p className="text-gray-600 mb-2">For technical problems and bugs:</p>
                <p className="text-blue-600">admin@timely.local</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Business Inquiries</h3>
                <p className="text-gray-600 mb-2">For partnerships and business:</p>
                <p className="text-blue-600">admin@timely.local</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Office Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900">Timely Sports Management</h3>
                  <p className="text-gray-600">123 Sports Avenue</p>
                  <p className="text-gray-600">City, State 12345</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p className="text-gray-600">Saturday: 10:00 AM - 2:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Response Time</h3>
                  <p className="text-gray-600">We typically respond within 24 hours during business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">How do I reset my password?</h3>
              <p className="text-gray-600">
                Contact your administrator at admin@timely.local to reset your password. We don't have self-service password reset enabled for security reasons.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">How do I upgrade my account role?</h3>
              <p className="text-gray-600">
                Use the Upgrade Center in your profile to apply for a new role. Your application will be reviewed by administrators.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Can I get a refund for event tickets?</h3>
              <p className="text-gray-600">
                Refunds are handled on a case-by-case basis. Contact support with your ticket details and reason for refund request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
