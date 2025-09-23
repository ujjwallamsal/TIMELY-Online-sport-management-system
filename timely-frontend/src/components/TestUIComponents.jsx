import React, { useState } from 'react';
import { z } from 'zod';
import { 
  DataTable, 
  Button, 
  Dialog, 
  Form, 
  FormField, 
  FormSubmit, 
  FormReset,
  Input,
  Select,
  commonSchemas,
  useToast,
  Skeleton,
  EmptyState
} from './ui';
import { PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Mock data for testing
const mockEvents = [
  { 
    id: 1, 
    name: 'Summer Football Championship', 
    sport: 'FOOTBALL',
    start_datetime: '2024-06-15T10:00:00Z',
    venue: { name: 'Central Stadium' },
    status: 'UPCOMING',
    participant_count: 24,
    max_participants: 32
  },
  { 
    id: 2, 
    name: 'Basketball Tournament', 
    sport: 'BASKETBALL',
    start_datetime: '2024-06-20T14:00:00Z',
    venue: { name: 'Sports Complex' },
    status: 'ONGOING',
    participant_count: 16,
    max_participants: 16
  },
  { 
    id: 3, 
    name: 'Tennis Open', 
    sport: 'TENNIS',
    start_datetime: '2024-06-10T09:00:00Z',
    venue: { name: 'Tennis Club' },
    status: 'COMPLETED',
    participant_count: 8,
    max_participants: 8
  }
];

const mockUsers = [
  { 
    id: 1, 
    first_name: 'John', 
    last_name: 'Doe', 
    email: 'john@example.com',
    role: 'ADMIN',
    phone: '+1234567890',
    date_joined: '2024-01-15T10:00:00Z'
  },
  { 
    id: 2, 
    first_name: 'Jane', 
    last_name: 'Smith', 
    email: 'jane@example.com',
    role: 'ORGANIZER',
    phone: '+1234567891',
    date_joined: '2024-02-20T10:00:00Z'
  },
  { 
    id: 3, 
    first_name: 'Bob', 
    last_name: 'Johnson', 
    email: 'bob@example.com',
    role: 'ATHLETE',
    phone: '+1234567892',
    date_joined: '2024-03-10T10:00:00Z'
  }
];

const mockRegistrations = [
  { 
    id: 1, 
    event: { name: 'Summer Football Championship' },
    participant: { first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com' },
    status: 'APPROVED',
    created_at: '2024-05-15T10:00:00Z'
  },
  { 
    id: 2, 
    event: { name: 'Basketball Tournament' },
    participant: { first_name: 'Charlie', last_name: 'Wilson', email: 'charlie@example.com' },
    status: 'PENDING',
    created_at: '2024-05-20T10:00:00Z'
  },
  { 
    id: 3, 
    event: { name: 'Tennis Open' },
    participant: { first_name: 'Diana', last_name: 'Davis', email: 'diana@example.com' },
    status: 'REJECTED',
    created_at: '2024-05-10T10:00:00Z'
  }
];

// Event form schema
const eventSchema = z.object({
  name: commonSchemas.required,
  description: commonSchemas.required,
  sport: commonSchemas.required,
  start_datetime: commonSchemas.datetime,
  end_datetime: commonSchemas.datetime,
  venue: commonSchemas.required,
  max_participants: commonSchemas.positiveNumber.optional(),
  registration_fee: commonSchemas.number.optional(),
  status: z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  visibility: z.enum(['PUBLIC', 'PRIVATE'])
});

// User form schema
const userSchema = z.object({
  first_name: commonSchemas.required,
  last_name: commonSchemas.required,
  email: commonSchemas.email,
  role: z.enum(['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SPECTATOR']),
  phone: commonSchemas.phone.optional(),
  date_of_birth: commonSchemas.date.optional()
});

const TestUIComponents = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  const { success, error, warning, info } = useToast();

  // Event columns
  const eventColumns = [
    { 
      header: 'Name', 
      accessor: 'name', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.sport}</div>
        </div>
      )
    },
    { 
      header: 'Start Date', 
      accessor: 'start_datetime', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      header: 'Venue', 
      accessor: 'venue', 
      sortable: true,
      render: (value) => value?.name || 'N/A'
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
          value === 'ONGOING' ? 'bg-green-100 text-green-800' :
          value === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
          value === 'CANCELLED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      header: 'Participants', 
      accessor: 'participant_count', 
      sortable: true,
      render: (value, row) => `${value || 0}/${row.max_participants || '∞'}`
    }
  ];

  // User columns
  const userColumns = [
    { 
      header: 'Name', 
      accessor: 'first_name', 
      sortable: true,
      render: (value, row) => `${value} ${row.last_name}`
    },
    { 
      header: 'Email', 
      accessor: 'email', 
      sortable: true
    },
    { 
      header: 'Role', 
      accessor: 'role', 
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
          value === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
          value === 'COACH' ? 'bg-green-100 text-green-800' :
          value === 'ATHLETE' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      header: 'Phone', 
      accessor: 'phone', 
      sortable: true,
      render: (value) => value || 'N/A'
    },
    { 
      header: 'Joined', 
      accessor: 'date_joined', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Registration columns
  const registrationColumns = [
    { 
      header: 'Event', 
      accessor: 'event', 
      sortable: true,
      render: (value) => value?.name || 'N/A'
    },
    { 
      header: 'Participant', 
      accessor: 'participant', 
      sortable: true,
      render: (value) => value ? `${value.first_name} ${value.last_name}` : 'N/A'
    },
    { 
      header: 'Email', 
      accessor: 'participant', 
      sortable: true,
      render: (value) => value?.email || 'N/A'
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'APPROVED' ? 'bg-green-100 text-green-800' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          value === 'REJECTED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      header: 'Registered', 
      accessor: 'created_at', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Event actions
  const eventRowActions = [
    { 
      label: 'View', 
      icon: EyeIcon, 
      variant: 'primary',
      onClick: (event) => console.log('View event:', event.id)
    },
    { 
      label: 'Edit', 
      icon: PencilIcon, 
      variant: 'primary',
      onClick: (event) => {
        setEditingEvent(event);
        setIsEventDialogOpen(true);
      }
    },
    { 
      label: 'Delete', 
      icon: TrashIcon, 
      variant: 'danger',
      onClick: (event) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
          success('Event deleted successfully');
        }
      }
    }
  ];

  const eventBulkActions = [
    { label: 'Delete Selected', variant: 'danger' },
    { label: 'Publish Selected', variant: 'success' }
  ];

  // User actions
  const userRowActions = [
    { 
      label: 'Edit', 
      icon: PencilIcon, 
      variant: 'primary',
      onClick: (user) => {
        setEditingUser(user);
        setIsUserDialogOpen(true);
      }
    },
    { 
      label: 'Delete', 
      icon: TrashIcon, 
      variant: 'danger',
      onClick: (user) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
          success('User deleted successfully');
        }
      }
    }
  ];

  // Registration actions
  const registrationRowActions = [
    { 
      label: 'Approve', 
      icon: CheckIcon, 
      variant: 'success',
      onClick: (registration) => {
        success('Registration approved successfully');
      }
    },
    { 
      label: 'Reject', 
      icon: XMarkIcon, 
      variant: 'danger',
      onClick: (registration) => {
        const reason = prompt('Reason for rejection (optional):');
        success('Registration rejected successfully');
      }
    }
  ];

  // Form handlers
  const handleEventSubmit = async (data) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
      setIsEventDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      error('Failed to save event');
    }
  };

  const handleUserSubmit = async (data) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success(editingUser ? 'User updated successfully!' : 'User created successfully!');
      setIsUserDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      error('Failed to save user');
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    console.log('Bulk action:', action.label, selectedIds);
    success(`${action.label} applied to ${selectedIds.length} items`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UI Components Test with Mock Data</h1>
        
        {/* Toast Test Buttons */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Toast Notifications Test</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => success('Success message!')}>
              Show Success
            </Button>
            <Button onClick={() => error('Error message!')}>
              Show Error
            </Button>
            <Button onClick={() => warning('Warning message!')}>
              Show Warning
            </Button>
            <Button onClick={() => info('Info message!')}>
              Show Info
            </Button>
          </div>
        </div>

        {/* Skeleton Test */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Loading States Test</h2>
          <div className="space-y-4">
            <Button onClick={() => setShowSkeleton(!showSkeleton)}>
              Toggle Skeleton
            </Button>
            {showSkeleton && (
              <div className="space-y-4">
                <Skeleton variant="card" />
                <Skeleton variant="table" />
                <Skeleton variant="list" />
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'events', label: 'Events', count: mockEvents.length },
              { id: 'users', label: 'Users', count: mockUsers.length },
              { id: 'registrations', label: 'Registrations', count: mockRegistrations.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Events Management</h2>
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventDialogOpen(true);
                }}
              >
                Create Event
              </Button>
            </div>
            
            <DataTable
              data={mockEvents}
              columns={eventColumns}
              pagination
              pageSize={2}
              searchable
              searchPlaceholder="Search events..."
              bulkActions={eventBulkActions}
              rowActions={eventRowActions}
              onBulkAction={handleBulkAction}
              onRowAction={(action, row) => action.onClick(row)}
              emptyMessage="No events found"
            />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Users Management</h2>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setIsUserDialogOpen(true);
                }}
              >
                Create User
              </Button>
            </div>
            
            <DataTable
              data={mockUsers}
              columns={userColumns}
              pagination
              pageSize={2}
              searchable
              searchPlaceholder="Search users..."
              rowActions={userRowActions}
              onRowAction={(action, row) => action.onClick(row)}
              emptyMessage="No users found"
            />
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Registrations Management</h2>
            </div>
            
            <DataTable
              data={mockRegistrations}
              columns={registrationColumns}
              pagination
              pageSize={2}
              searchable
              searchPlaceholder="Search registrations..."
              rowActions={registrationRowActions}
              onRowAction={(action, row) => action.onClick(row)}
              emptyMessage="No registrations found"
            />
          </div>
        )}

        {/* Empty State Test */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Empty State Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <EmptyState
                title="No events found"
                description="Create your first event to get started"
                action={() => setIsEventDialogOpen(true)}
                actionText="Create Event"
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <EmptyState
                title="No results available"
                description="Results will appear here once events are completed"
              />
            </div>
          </div>
        </div>

        {/* Event Dialog */}
        <Dialog
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setEditingEvent(null);
          }}
          title={editingEvent ? 'Edit Event' : 'Create Event'}
          size="lg"
        >
          <Form
            schema={eventSchema}
            onSubmit={handleEventSubmit}
            defaultValues={editingEvent || {
              status: 'DRAFT',
              visibility: 'PUBLIC'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="name" label="Event Name" required>
                <Input name="name" placeholder="Enter event name" />
              </FormField>
              
              <FormField name="sport" label="Sport" required>
                <Select
                  name="sport"
                  options={[
                    { value: 'FOOTBALL', label: 'Football' },
                    { value: 'BASKETBALL', label: 'Basketball' },
                    { value: 'TENNIS', label: 'Tennis' },
                    { value: 'VOLLEYBALL', label: 'Volleyball' },
                    { value: 'CRICKET', label: 'Cricket' }
                  ]}
                  placeholder="Select sport"
                />
              </FormField>
              
              <FormField name="start_datetime" label="Start Date & Time" required>
                <Input name="start_datetime" type="datetime-local" />
              </FormField>
              
              <FormField name="end_datetime" label="End Date & Time" required>
                <Input name="end_datetime" type="datetime-local" />
              </FormField>
              
              <FormField name="venue" label="Venue" required>
                <Input name="venue" placeholder="Enter venue name" />
              </FormField>
              
              <FormField name="max_participants" label="Max Participants">
                <Input name="max_participants" type="number" placeholder="Enter max participants" />
              </FormField>
              
              <FormField name="registration_fee" label="Registration Fee">
                <Input name="registration_fee" type="number" step="0.01" placeholder="Enter fee amount" />
              </FormField>
              
              <FormField name="status" label="Status" required>
                <Select
                  name="status"
                  options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'UPCOMING', label: 'Upcoming' },
                    { value: 'ONGOING', label: 'Ongoing' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'CANCELLED', label: 'Cancelled' }
                  ]}
                  placeholder="Select status"
                />
              </FormField>
              
              <FormField name="visibility" label="Visibility" required>
                <Select
                  name="visibility"
                  options={[
                    { value: 'PUBLIC', label: 'Public' },
                    { value: 'PRIVATE', label: 'Private' }
                  ]}
                  placeholder="Select visibility"
                />
              </FormField>
            </div>
            
            <FormField name="description" label="Description" required>
              <Input 
                name="description" 
                as="textarea" 
                rows={4}
                placeholder="Enter event description" 
              />
            </FormField>
            
            <div className="flex gap-4 mt-6">
              <FormSubmit>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </FormSubmit>
              <FormReset>Reset</FormReset>
            </div>
          </Form>
        </Dialog>

        {/* User Dialog */}
        <Dialog
          isOpen={isUserDialogOpen}
          onClose={() => {
            setIsUserDialogOpen(false);
            setEditingUser(null);
          }}
          title={editingUser ? 'Edit User' : 'Create User'}
          size="lg"
        >
          <Form
            schema={userSchema}
            onSubmit={handleUserSubmit}
            defaultValues={editingUser || {
              role: 'ATHLETE'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="first_name" label="First Name" required>
                <Input name="first_name" placeholder="Enter first name" />
              </FormField>
              
              <FormField name="last_name" label="Last Name" required>
                <Input name="last_name" placeholder="Enter last name" />
              </FormField>
              
              <FormField name="email" label="Email" required>
                <Input name="email" type="email" placeholder="Enter email address" />
              </FormField>
              
              <FormField name="phone" label="Phone">
                <Input name="phone" type="tel" placeholder="Enter phone number" />
              </FormField>
              
              <FormField name="role" label="Role" required>
                <Select
                  name="role"
                  options={[
                    { value: 'ADMIN', label: 'Administrator' },
                    { value: 'ORGANIZER', label: 'Organizer' },
                    { value: 'COACH', label: 'Coach' },
                    { value: 'ATHLETE', label: 'Athlete' },
                    { value: 'SPECTATOR', label: 'Spectator' }
                  ]}
                  placeholder="Select role"
                />
              </FormField>
              
              <FormField name="date_of_birth" label="Date of Birth">
                <Input name="date_of_birth" type="date" />
              </FormField>
            </div>
            
            <div className="flex gap-4 mt-6">
              <FormSubmit>
                {editingUser ? 'Update User' : 'Create User'}
              </FormSubmit>
              <FormReset>Reset</FormReset>
            </div>
          </Form>
        </Dialog>
      </div>
    </div>
  );
};

export default TestUIComponents;
