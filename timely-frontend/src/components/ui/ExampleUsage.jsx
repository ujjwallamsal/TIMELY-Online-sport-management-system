import React, { useState } from 'react';
import { z } from 'zod';
import { Form, FormField, FormSubmit, FormReset, commonSchemas } from './Form';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Dialog from './Dialog';
import DataTable from './DataTable';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import { useToast } from './ToastProvider';

// Example validation schema
const userSchema = z.object({
  name: commonSchemas.required,
  email: commonSchemas.email,
  role: commonSchemas.required,
  phone: commonSchemas.phone.optional(),
  age: commonSchemas.positiveNumber.optional(),
});

// Example data for DataTable
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'Active' },
];

const columns = [
  { header: 'Name', accessor: 'name', sortable: true },
  { header: 'Email', accessor: 'email', sortable: true },
  { header: 'Role', accessor: 'role', sortable: true },
  { header: 'Status', accessor: 'status', sortable: true },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
];

const ExampleUsage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const { success, error, warning, info } = useToast();

  const handleFormSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('User created successfully!');
      setIsDialogOpen(false);
    } catch (err) {
      error('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = (action, selectedIds) => {
    console.log('Bulk action:', action, selectedIds);
    success(`${action.label} applied to ${selectedIds.length} items`);
  };

  const handleRowAction = (action, row) => {
    console.log('Row action:', action, row);
    info(`${action.label} clicked for ${row.name}`);
  };

  const bulkActions = [
    { label: 'Delete', variant: 'danger' },
    { label: 'Activate', variant: 'success' },
  ];

  const rowActions = [
    { label: 'Edit', variant: 'primary' },
    { label: 'Delete', variant: 'danger' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UI Components Example</h1>
        
        {/* Buttons Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Form Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Form with Validation</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <Form
              schema={userSchema}
              onSubmit={handleFormSubmit}
              defaultValues={{ role: 'user' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" label="Full Name" required>
                  <Input name="name" placeholder="Enter your full name" />
                </FormField>
                
                <FormField name="email" label="Email Address" required>
                  <Input name="email" type="email" placeholder="Enter your email" />
                </FormField>
                
                <FormField name="role" label="Role" required>
                  <Select
                    name="role"
                    options={roleOptions}
                    placeholder="Select a role"
                  />
                </FormField>
                
                <FormField name="phone" label="Phone Number">
                  <Input name="phone" type="tel" placeholder="Enter phone number" />
                </FormField>
                
                <FormField name="age" label="Age">
                  <Input name="age" type="number" placeholder="Enter age" />
                </FormField>
              </div>
              
              <div className="flex gap-4 mt-6">
                <FormSubmit loading={isLoading}>
                  Create User
                </FormSubmit>
                <FormReset>Reset</FormReset>
              </div>
            </Form>
          </div>
        </section>

        {/* Toast Examples */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
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
        </section>

        {/* DataTable Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Table</h2>
          <DataTable
            data={sampleData}
            columns={columns}
            searchable
            pagination
            pageSize={2}
            bulkActions={bulkActions}
            rowActions={rowActions}
            onBulkAction={handleBulkAction}
            onRowAction={handleRowAction}
            onSearch={(term) => console.log('Search:', term)}
            searchPlaceholder="Search users..."
          />
        </section>

        {/* Skeleton Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Loading States</h2>
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
        </section>

        {/* Empty State Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Empty States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <EmptyState
                title="No events found"
                description="Create your first event to get started"
                action={() => setIsDialogOpen(true)}
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
        </section>

        {/* Dialog Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Dialog</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            Open Dialog
          </Button>
        </section>

        {/* Dialog */}
        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title="Create New Event"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This is an example dialog. In a real application, this would contain
              a form for creating a new event.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Create Event
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default ExampleUsage;
