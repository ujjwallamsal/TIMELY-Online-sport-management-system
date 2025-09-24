import React, { useCallback, useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import { publicAPI } from '../../services/api.js';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Events() {
  const [filters, setFilters] = useState({
    sport: '',
    search: '',
    status: 'UPCOMING',
    date_from: '',
    date_to: ''
  });

  // Debounced search (300ms)
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchPage = useCallback(async ({ page, pageSize }) => {
    const params = {
      page,
      page_size: pageSize,
      sport: filters.sport,
      status: filters.status,
      search: debouncedSearch,
      date_from: filters.date_from,
      date_to: filters.date_to
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await publicAPI.getEvents(params);
    return { 
      rows: response.results || response.data || [], 
      total: response.count || response.total || 0
    };
  }, [filters, debouncedSearch]);

  const columns = [
    { 
      accessor: 'name', 
      header: 'Event Name',
      render: (value, event) => (
        <div>
          <div className="font-semibold text-gray-900">{event.name}</div>
          <div className="text-sm text-gray-500">{event.sport_name}</div>
        </div>
      )
    },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (value, event) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
          event.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {event.status}
        </span>
      )
    },
    { 
      accessor: 'start_datetime', 
      header: 'Start Date',
      render: (value, event) => (
        <div>
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
            {new Date(event.start_datetime).toLocaleDateString()}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            {new Date(event.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      )
    },
    {
      accessor: 'venue_name',
      header: 'Venue',
      render: (value, event) => (
        <div className="flex items-center text-sm">
          <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
          {event.venue_name || 'TBA'}
        </div>
      )
    },
    {
      accessor: 'fee_cents',
      header: 'Fee',
      render: (value, event) => (
        <div className="text-sm">
          {event.fee_cents ? `$${(event.fee_cents / 100).toFixed(2)}` : 'Free'}
        </div>
      )
    }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
        <p className="text-gray-600">Discover and participate in exciting sports events</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <Select
              value={filters.sport}
              onChange={(value) => handleFilterChange('sport', value)}
              options={[
                { value: '', label: 'All Sports' },
                { value: 'Basketball', label: 'Basketball' },
                { value: 'Football', label: 'Football' },
                { value: 'Soccer', label: 'Soccer' },
                { value: 'Tennis', label: 'Tennis' },
                { value: 'Volleyball', label: 'Volleyball' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'UPCOMING', label: 'Upcoming' },
                { value: 'ONGOING', label: 'Live Now' },
                { value: 'COMPLETED', label: 'Completed' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="space-y-1">
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                placeholder="From"
                className="text-sm"
              />
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                placeholder="To"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ sport: '', search: '', status: 'UPCOMING', date_from: '', date_to: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} fetchPage={fetchPage} />
    </div>
  );
}


