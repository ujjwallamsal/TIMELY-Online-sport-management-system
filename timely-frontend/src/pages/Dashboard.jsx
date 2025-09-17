import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome, {user?.first_name || user?.email}!
      </h1>
      <p className="text-gray-600 mt-2">
        This is your personal dashboard.
      </p>
    </div>
  );
}