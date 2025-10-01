import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { usePublicEvents, useEvents } from '../../api/queries';
import { useAuth } from '../../auth/AuthProvider';
import { formatDate, formatTime } from '../../utils/dateUtils';
import DataTable from '../../components/DataTable';
import { type Event } from '../../api/queries';

const EventsList: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isMyEventsRoute = location.pathname === '/events/mine';
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sport: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Use different query based on route
  const { data: publicEvents, isLoading: isLoadingPublic } = usePublicEvents(
    !isMyEventsRoute ? {
      page: currentPage,
      limit: 12,
      search: filters.search || undefined,
      status: filters.status || undefined,
      sport: filters.sport || undefined,
    } : undefined
  );

  const { data: myEvents, isLoading: isLoadingMy } = useEvents(
    isMyEventsRoute ? {
      page: currentPage,
      page_size: 12,
      created_by: user?.id,
      search: filters.search || undefined,
      status: filters.status || undefined,
      sport: filters.sport || undefined,
    } : undefined
  );

  const events = isMyEventsRoute ? myEvents?.results : publicEvents;
  const isLoading = isMyEventsRoute ? isLoadingMy : isLoadingPublic;

  const columns = [
    {
      key: 'name',
      title: 'Event',
      render: (value: string, event: Event) => (
        <div>
          <Link
            to={`/events/${event.id}`}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            {value}
          </Link>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {event.description}
          </p>
        </div>
      ),
    },
    {
      key: 'sport_name',
      title: 'Sport',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'venue_name',
      title: 'Venue',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {value || 'TBD'}
        </div>
      ),
    },
    {
      key: 'start_datetime',
      title: 'Date & Time',
      render: (value: string) => {
        return (
          <div className="text-sm">
            <div className="flex items-center text-gray-900">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(value)}
            </div>
            <div className="text-gray-500">
              {formatTime(value)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'fee_cents',
      title: 'Fee',
      render: (value: number) => (
        <span className="text-sm font-medium">
          {value ? `$${(value / 100).toFixed(2)}` : 'Free'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const statusClasses = {
          PUBLISHED: 'status-approved',
          DRAFT: 'status-pending',
          CANCELLED: 'status-cancelled',
          COMPLETED: 'status-approved',
        };
        return (
          <span className={`status-badge ${statusClasses[value as keyof typeof statusClasses] || 'status-pending'}`}>
            {value}
          </span>
        );
      },
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isMyEventsRoute ? 'My Events' : 'Sports Events'}
          </h1>
          <p className="text-gray-600">
            {isMyEventsRoute 
              ? 'Events you have created and manage' 
              : 'Discover and participate in exciting sports events happening around you.'}
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="form-label">
                  Search Events
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by event name or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label htmlFor="sport" className="form-label">
                  Sport
                </label>
                <input
                  id="sport"
                  type="text"
                  placeholder="Filter by sport..."
                  value={filters.sport}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('sport', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Events Table */}
        <DataTable
          data={events || []}
          columns={columns}
          loading={isLoading}
          emptyMessage="No events found matching your criteria."
          pagination={events ? {
            currentPage,
            totalPages: Math.ceil(events.length / 12),
            onPageChange: setCurrentPage,
          } : undefined}
        />

        {/* Quick Stats */}
        {events && events.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.length}
              </div>
              <div className="text-gray-600">Total Events</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.filter((e: Event) => e.status === 'PUBLISHED').length}
              </div>
              <div className="text-gray-600">Published Events</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.filter((e: Event) => e.fee_cents === 0 || !e.fee_cents).length}
              </div>
              <div className="text-gray-600">Free Events</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
