// src/pages/admin/FixturesManage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Clock,
  Plus,
  Settings,
  Trophy
} from 'lucide-react';

const FixturesManage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [filters, setFilters] = useState({
    event: '',
    phase: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchFixtures();
  }, [filters]);

  const fetchFixtures = async () => {
    try {
      // Mock data - replace with actual API call
      setFixtures([
        {
          id: 1,
          round: 1,
          phase: 'RR',
          home: 'Team Alpha',
          away: 'Team Beta',
          venue: 'Sports Center',
          startAt: '2024-01-20 14:00',
          status: 'SCHEDULED'
        },
        {
          id: 2,
          round: 1,
          phase: 'RR',
          home: 'Team Gamma',
          away: 'Team Delta',
          venue: 'Field A',
          startAt: '2024-01-20 16:30',
          status: 'LIVE'
        },
        {
          id: 3,
          round: 2,
          phase: 'KO',
          home: 'Team Epsilon',
          away: 'Team Zeta',
          venue: 'Arena B',
          startAt: '2024-01-21 10:00',
          status: 'FINAL'
        }
      ]);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const handleGenerateFixtures = async (data) => {
    try {
      // API call to generate fixtures
      console.log('Generating fixtures:', data);
      setShowGenerateModal(false);
      fetchFixtures(); // Refresh the list
    } catch (error) {
      console.error('Error generating fixtures:', error);
    }
  };

  const handleReschedule = async (id, newData) => {
    try {
      // API call to reschedule fixture
      console.log('Rescheduling fixture:', id, newData);
    } catch (error) {
      console.error('Error rescheduling fixture:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      LIVE: 'bg-red-100 text-red-800',
      FINAL: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {status}
      </span>
    );
  };

  const getPhaseBadge = (phase) => {
    const phaseClasses = {
      RR: 'bg-purple-100 text-purple-800',
      KO: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${phaseClasses[phase]}`}>
        {phase}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fixtures</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Fixtures
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event
            </label>
            <select
              value={filters.event}
              onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Events</option>
              <option value="basketball">Basketball Championship</option>
              <option value="soccer">Soccer League</option>
              <option value="tennis">Tennis Tournament</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase
            </label>
            <select
              value={filters.phase}
              onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Phases</option>
              <option value="RR">Round Robin</option>
              <option value="KO">Knockout</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Fixtures Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Round
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Home
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Away
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fixtures.map((fixture) => (
                <tr key={fixture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fixture.round}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPhaseBadge(fixture.phase)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fixture.home}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fixture.away}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fixture.venue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fixture.startAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(fixture.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Trophy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Fixtures Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Fixtures</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Type
                  </label>
                  <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="RR">Round Robin</option>
                    <option value="KO">Knockout</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teams
                  </label>
                  <input
                    type="number"
                    placeholder="Number of teams"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seeding
                  </label>
                  <input
                    type="text"
                    placeholder="Seeding order (comma separated)"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Byes
                  </label>
                  <input
                    type="number"
                    placeholder="Number of byes"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerateFixtures({})}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixturesManage;
