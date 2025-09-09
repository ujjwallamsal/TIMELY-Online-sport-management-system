import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../lib/api';
import KpiGrid from '../components/KpiGrid';
import DrilldownTable from '../components/DrilldownTable';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  TrophyIcon, 
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [drilldownData, setDrilldownData] = useState({});
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load KPIs
  const loadKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getKPIs();
      setKpis(response.data);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load drilldown data
  const loadDrilldownData = useCallback(async (type, params = {}) => {
    try {
      setDrilldownLoading(true);
      let response;
      
      switch (type) {
        case 'users':
          response = await adminAPI.drillUsers(params);
          break;
        case 'events':
          response = await adminAPI.drillEvents(params);
          break;
        case 'registrations':
          response = await adminAPI.drillRegistrations(params);
          break;
        case 'orders':
          response = await adminAPI.drillOrders(params);
          break;
        case 'audit':
          response = await adminAPI.getAuditLogs(params);
          break;
        default:
          throw new Error(`Unknown drilldown type: ${type}`);
      }
      
      setDrilldownData(prev => ({
        ...prev,
        [type]: response.data
      }));
    } catch (err) {
      console.error(`Failed to load ${type} data:`, err);
      setError(`Failed to load ${type} data`);
    } finally {
      setDrilldownLoading(false);
    }
  }, []);

  // Handle CSV export
  const handleExport = useCallback(async (kind, filters = {}) => {
    try {
      const response = await adminAPI.exportCSV(kind, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${kind}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${kind}:`, err);
      setError(`Failed to export ${kind} data`);
    }
  }, []);

  // Handle drilldown
  const handleDrilldown = useCallback((type) => {
    setActiveTab(type);
    if (!drilldownData[type]) {
      loadDrilldownData(type);
    }
  }, [drilldownData, loadDrilldownData]);

  // Handle page change
  const handlePageChange = useCallback((type, page) => {
    const currentData = drilldownData[type];
    if (currentData) {
      loadDrilldownData(type, { ...currentData.filters, page });
    }
  }, [drilldownData, loadDrilldownData]);

  // Handle filter change
  const handleFilterChange = useCallback((type, filters) => {
    loadDrilldownData(type, { ...filters, page: 1 });
  }, [loadDrilldownData]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  // Auto-refresh KPIs every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadKPIs, 30000);
    return () => clearInterval(interval);
  }, [loadKPIs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadKPIs} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define table columns for each drilldown type
  const tableColumns = {
    users: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'first_name', label: 'First Name', sortable: true },
      { key: 'last_name', label: 'Last Name', sortable: true },
      { key: 'role', label: 'Role', sortable: true, type: 'status' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'email_verified', label: 'Verified', type: 'boolean' },
      { key: 'created_at', label: 'Created', type: 'datetime', sortable: true }
    ],
    events: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sport', label: 'Sport', sortable: true },
      { key: 'location', label: 'Location', sortable: true },
      { key: 'lifecycle_status', label: 'Status', type: 'status', sortable: true },
      { key: 'start_datetime', label: 'Start Date', type: 'datetime', sortable: true },
      { key: 'capacity', label: 'Capacity', sortable: true },
      { key: 'fee_cents', label: 'Fee', type: 'currency', sortable: true }
    ],
    registrations: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'user_id', label: 'User ID', sortable: true },
      { key: 'event_id', label: 'Event ID', sortable: true },
      { key: 'status', label: 'Status', type: 'status', sortable: true },
      { key: 'payment_status', label: 'Payment', type: 'status', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'team_name', label: 'Team Name' },
      { key: 'fee_cents', label: 'Fee', type: 'currency', sortable: true },
      { key: 'submitted_at', label: 'Submitted', type: 'datetime', sortable: true }
    ],
    orders: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'user_id', label: 'User ID', sortable: true },
      { key: 'event_id', label: 'Event ID', sortable: true },
      { key: 'status', label: 'Status', type: 'status', sortable: true },
      { key: 'total_cents', label: 'Total', type: 'currency', sortable: true },
      { key: 'currency', label: 'Currency', sortable: true },
      { key: 'provider', label: 'Provider', sortable: true },
      { key: 'created_at', label: 'Created', type: 'datetime', sortable: true }
    ],
    audit: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'user_id', label: 'User ID', sortable: true },
      { key: 'action', label: 'Action', type: 'status', sortable: true },
      { key: 'resource_type', label: 'Resource Type', sortable: true },
      { key: 'resource_id', label: 'Resource ID', sortable: true },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'created_at', label: 'Created', type: 'datetime', sortable: true }
    ]
  };

  // Define filters for each drilldown type
  const tableFilters = {
    users: {
      role: {
        label: 'Role',
        type: 'select',
        options: [
          { value: 'ADMIN', label: 'Admin' },
          { value: 'ORGANIZER', label: 'Organizer' },
          { value: 'ATHLETE', label: 'Athlete' },
          { value: 'COACH', label: 'Coach' },
          { value: 'SPECTATOR', label: 'Spectator' }
        ]
      }
    },
    events: {
      status: {
        label: 'Status',
        type: 'select',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      }
    },
    registrations: {
      status: {
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'withdrawn', label: 'Withdrawn' }
        ]
      },
      event: {
        label: 'Event ID',
        type: 'number',
        placeholder: 'Enter event ID'
      }
    },
    orders: {
      status: {
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      event: {
        label: 'Event ID',
        type: 'number',
        placeholder: 'Enter event ID'
      }
    },
    audit: {
      action: {
        label: 'Action',
        type: 'select',
        options: [
          { value: 'CREATE', label: 'Create' },
          { value: 'UPDATE', label: 'Update' },
          { value: 'DELETE', label: 'Delete' },
          { value: 'LOGIN', label: 'Login' },
          { value: 'LOGOUT', label: 'Logout' }
        ]
      },
      actor: {
        label: 'User ID',
        type: 'number',
        placeholder: 'Enter user ID'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-purple-600 rounded-full flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xl text-gray-600 mt-2">System overview and management</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'users', label: 'Users', icon: UserGroupIcon },
              { id: 'events', label: 'Events', icon: CalendarIcon },
              { id: 'registrations', label: 'Registrations', icon: TrophyIcon },
              { id: 'orders', label: 'Orders', icon: ShoppingCartIcon },
              { id: 'audit', label: 'Audit Log', icon: DocumentTextIcon }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleDrilldown(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <KpiGrid
            kpis={kpis}
            loading={loading}
            onDrilldown={handleDrilldown}
            onRefresh={loadKPIs}
          />
        )}

        {activeTab !== 'overview' && (
          <DrilldownTable
            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management`}
            data={drilldownData[activeTab]?.results || []}
            columns={tableColumns[activeTab] || []}
            pagination={drilldownData[activeTab] || {}}
            filters={tableFilters[activeTab] || {}}
            loading={drilldownLoading}
            onPageChange={(page) => handlePageChange(activeTab, page)}
            onFilterChange={(filters) => handleFilterChange(activeTab, filters)}
            onExport={(filters) => handleExport(activeTab, filters)}
            onRefresh={() => loadDrilldownData(activeTab)}
          />
        )}

        {/* Quick Actions */}
        <Card className="mt-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button as={Link} to="/admin/users/create" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <PlusIcon className="w-6 h-6 mr-3" />
              Add User
            </Button>
            <Button as={Link} to="/admin/events/create" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <PlusIcon className="w-6 h-6 mr-3" />
              Create Event
            </Button>
            <Button as={Link} to="/admin/approvals" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
              Review Approvals
            </Button>
            <Button as={Link} to="/admin/reports" variant="outline" size="lg" className="justify-center h-20 text-lg hover:shadow-lg transition-all duration-200">
              <ChartBarIcon className="w-6 h-6 mr-3" />
              Generate Reports
            </Button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Database: Online</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">API: Operational</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Storage: Active</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
