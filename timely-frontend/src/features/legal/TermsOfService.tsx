import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, Users, CreditCard } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="card mb-8">
          <div className="text-center mb-8">
            <FileText className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary-600" />
                  Acceptance of Terms
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>By accessing and using Timely Sports Management Platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  <p>If you do not agree to abide by the above, please do not use this service.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Scale className="h-6 w-6 mr-2 text-primary-600" />
                  Use License
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>Permission is granted to temporarily download one copy of the materials on Timely's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on the website</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-6 w-6 mr-2 text-primary-600" />
                  Payment Terms
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>All payments for event registrations and services are processed securely through Stripe. By making a payment, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate payment information</li>
                    <li>Pay all applicable fees and taxes</li>
                    <li>Accept our refund policy as stated during checkout</li>
                    <li>Authorize us to charge your payment method for the agreed amount</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-primary-600" />
                  User Responsibilities
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>As a user of our platform, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Use the platform in compliance with all applicable laws</li>
                    <li>Respect other users and maintain appropriate conduct</li>
                    <li>Not engage in any fraudulent or harmful activities</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
                <div className="space-y-4 text-gray-700">
                  <p>In no event shall Timely Sports Management Platform, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
                <div className="space-y-4 text-gray-700">
                  <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4 text-gray-700">
                  <p>If you have any questions about these Terms of Service, please contact us at:</p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p><strong>Email:</strong> legal@timely.local</p>
                    <p><strong>Address:</strong> Timely Sports Management, 123 Sports Ave, City, State 12345</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
