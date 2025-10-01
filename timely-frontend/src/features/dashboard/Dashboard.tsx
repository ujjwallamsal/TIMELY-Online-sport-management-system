import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import UserDashboard from './User';
import SpectatorDashboard from './Spectator';
import AthleteDashboard from './Athlete';
import CoachDashboard from './Coach';
import OrganizerDashboard from './Organizer';
import AdminDashboard from './Admin';

const Dashboard: React.FC = () => {
  const { user, roles } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user's primary role
  const primaryRole = user.role || 'SPECTATOR';

  switch (primaryRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'ORGANIZER':
      return <OrganizerDashboard />;
    case 'COACH':
      return <CoachDashboard />;
    case 'ATHLETE':
      return <AthleteDashboard />;
    case 'SPECTATOR':
    default:
      return <SpectatorDashboard />;
  }
};

export default Dashboard;
