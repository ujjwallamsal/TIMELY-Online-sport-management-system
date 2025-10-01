import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Accessibility as AccessibilityIcon, Eye, Ear, Hand, Brain } from 'lucide-react';

const Accessibility: React.FC = () => {
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
            <AccessibilityIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Timely Sports Management Platform is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="h-6 w-6 mr-2 text-primary-600" />
                  Visual Accessibility
                </h2>
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>High contrast color schemes and text</li>
                    <li>Scalable fonts and responsive design</li>
                    <li>Alt text for all images and graphics</li>
                    <li>Clear visual hierarchy and navigation</li>
                    <li>Focus indicators for keyboard navigation</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Ear className="h-6 w-6 mr-2 text-primary-600" />
                  Audio Accessibility
                </h2>
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Captions and transcripts for video content</li>
                    <li>Audio descriptions where appropriate</li>
                    <li>Volume controls and audio alternatives</li>
                    <li>Clear audio feedback for interactions</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Hand className="h-6 w-6 mr-2 text-primary-600" />
                  Motor Accessibility
                </h2>
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Full keyboard navigation support</li>
                    <li>Large click targets and touch areas</li>
                    <li>Customizable interaction timeouts</li>
                    <li>Voice control compatibility</li>
                    <li>Assistive technology support</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-6 w-6 mr-2 text-primary-600" />
                  Cognitive Accessibility
                </h2>
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Clear and simple language</li>
                    <li>Consistent navigation and layout</li>
                    <li>Progress indicators and status messages</li>
                    <li>Error prevention and clear instructions</li>
                    <li>Customizable interface elements</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Standards Compliance</h2>
                <div className="space-y-4 text-gray-700">
                  <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines help make web content more accessible to people with disabilities and user-friendly for everyone.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback and Support</h2>
                <div className="space-y-4 text-gray-700">
                  <p>We welcome your feedback on the accessibility of Timely Sports Management Platform. Please let us know if you encounter accessibility barriers:</p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p><strong>Email:</strong> accessibility@timely.local</p>
                    <p><strong>Phone:</strong> 1-800-TIMELY-1</p>
                    <p><strong>Response Time:</strong> We aim to respond to accessibility feedback within 2 business days.</p>
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

export default Accessibility;
