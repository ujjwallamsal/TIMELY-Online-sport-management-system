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
  commonSchemas
} from './ui';
import { useToast } from './ui/ToastProvider';
import { useEvents, useEventCrud } from '../hooks/useEvents';
import { useUsers, useUserCrud } from '../hooks/useUsers';
import { useRegistrations, useRegistrationManagement } from '../hooks/useRegistrations';
import { PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

const RealDataExample = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  const { success, error } = useToast();

  // Events data and operations
  const {
    data: events,
    pagination: eventsPagination,
    loading: eventsLoading,
    handlePageChange: handleEventsPageChange,
    handleSearch: handleEventsSearch,
    handleSort: handleEventsSort,
    refetch: refetchEvents
  } = useEvents({ page_size: 10 });

  const {
    create: createEvent,
    update: updateEvent,
    remove: deleteEvent,
    loading: eventCrudLoading
  } = useEventCrud();

  // Users data and operations
  const {
    data: users,
    pagination: usersPagination,
    loading: usersLoading,
    handlePageChange: handleUsersPageChange,
    handleSearch: handleUsersSearch,
    handleSort: handleUsersSort,
    refetch: refetchUsers
  } = useUsers({ page_size: 10 });

  const {
    create: createUser,
    update: updateUser,
    remove: deleteUser,
    loading: userCrudLoading
  } = useUserCrud();

  // Registrations data and operations
  const {
    data: registrations,
    pagination: registrationsPagination,
    loading: registrationsLoading,
    handlePageChange: handleRegistrationsPageChange,
    handleSearch: handleRegistrationsSearch,
    handleSort: handleRegistrationsSort,
    refetch: refetchRegistrations
  } = useRegistrations({ page_size: 10 });

  const {
    approveRegistration,
    rejectRegistration
  } = useRegistrationManagement();

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
      onClick: async (event) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
          try {
            await deleteEvent(event.id);
            refetchEvents();
          } catch (err) {
            error('Failed to delete event');
          }
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
      onClick: async (user) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
          try {
            await deleteUser(user.id);
            refetchUsers();
          } catch (err) {
            error('Failed to delete user');
          }
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
      onClick: async (registration) => {
        try {
          await approveRegistration(registration.id);
          refetchRegistrations();
        } catch (err) {
          error('Failed to approve registration');
        }
      }
    },
    { 
      label: 'Reject', 
      icon: XMarkIcon, 
      variant: 'danger',
      onClick: async (registration) => {
        const reason = prompt('Reason for rejection (optional):');
        try {
          await rejectRegistration(registration.id, reason);
          refetchRegistrations();
        } catch (err) {
          error('Failed to reject registration');
        }
      }
    }
  ];

  // Form handlers
  const handleEventSubmit = async (data) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        success('Event updated successfully');
      } else {
        await createEvent(data);
        success('Event created successfully');
      }
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      refetchEvents();
    } catch (err) {
      error('Failed to save event');
    }
  };

  const handleUserSubmit = async (data) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
        success('User updated successfully');
      } else {
        await createUser(data);
        success('User created successfully');
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
      refetchUsers();
    } catch (err) {
      error('Failed to save user');
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    console.log('Bulk action:', action.label, selectedIds);
    // Implement bulk actions here
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Real Database Data</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'events', label: 'Events', count: eventsPagination.total },
              { id: 'users', label: 'Users', count: usersPagination.total },
              { id: 'registrations', label: 'Registrations', count: registrationsPagination.total }
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
              data={events || []}
              columns={eventColumns}
              loading={eventsLoading}
              pagination
              serverPagination
              currentPage={eventsPagination.page}
              totalCount={eventsPagination.total}
              pageSize={eventsPagination.pageSize}
              onPageChange={handleEventsPageChange}
              onSortChange={handleEventsSort}
              onSearch={handleEventsSearch}
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
              data={users || []}
              columns={userColumns}
              loading={usersLoading}
              pagination
              serverPagination
              currentPage={usersPagination.page}
              totalCount={usersPagination.total}
              pageSize={usersPagination.pageSize}
              onPageChange={handleUsersPageChange}
              onSortChange={handleUsersSort}
              onSearch={handleUsersSearch}
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
              data={registrations || []}
              columns={registrationColumns}
              loading={registrationsLoading}
              pagination
              serverPagination
              currentPage={registrationsPagination.page}
              totalCount={registrationsPagination.total}
              pageSize={registrationsPagination.pageSize}
              onPageChange={handleRegistrationsPageChange}
              onSortChange={handleRegistrationsSort}
              onSearch={handleRegistrationsSearch}
              searchable
              searchPlaceholder="Search registrations..."
              rowActions={registrationRowActions}
              onRowAction={(action, row) => action.onClick(row)}
              emptyMessage="No registrations found"
            />
          </div>
        )}

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
              <FormSubmit loading={eventCrudLoading}>
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
              <FormSubmit loading={userCrudLoading}>
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

export default RealDataExample;
