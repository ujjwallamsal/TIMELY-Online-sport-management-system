# UI Component Library

A comprehensive set of reusable UI components built with React, Tailwind CSS, and modern form validation.

## Features

- **Accessible**: WCAG 2.1 AA compliant components
- **Form Integration**: Built-in support for React Hook Form and Zod validation
- **Responsive**: Mobile-first design with Tailwind CSS
- **TypeScript Ready**: Full type safety with proper prop types
- **Consistent**: Unified design system with consistent spacing and typography

## Components

### Core Components

#### Button
```jsx
import { Button } from './components/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost' | 'white'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `loading`: boolean
- `disabled`: boolean

#### Input
```jsx
import { Input } from './components/ui';

<Input
  name="email"
  label="Email Address"
  type="email"
  required
  placeholder="Enter your email"
/>
```

**Features:**
- Form integration with React Hook Form
- Automatic error display
- Accessible labels
- Helper text support

#### Select
```jsx
import { Select } from './components/ui';

<Select
  name="role"
  label="Role"
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' }
  ]}
  searchable
  multiple
/>
```

**Features:**
- Searchable dropdown
- Multi-select support
- Keyboard navigation
- Form integration

#### Dialog
```jsx
import { Dialog } from './components/ui';

<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
</Dialog>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick`: boolean
- `showCloseButton`: boolean

#### DataTable
```jsx
import { DataTable } from './components/ui';

<DataTable
  data={users}
  columns={columns}
  searchable
  pagination
  serverPagination
  bulkActions={bulkActions}
  rowActions={rowActions}
  onBulkAction={handleBulkAction}
  onRowAction={handleRowAction}
  onSearch={handleSearch}
/>
```

**Features:**
- Server-side pagination
- Debounced search (300ms)
- Sticky headers
- Bulk actions with confirmation
- Row actions with icons
- Sortable columns
- Responsive design

#### Toast
```jsx
import { useToast } from './components/ui';

const { success, error, warning, info } = useToast();

// Usage
success('User created successfully!');
error('Failed to save changes');
```

#### Skeleton
```jsx
import { Skeleton, SkeletonCard, SkeletonTable } from './components/ui';

<Skeleton variant="text" />
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
```

#### EmptyState
```jsx
import { EmptyState, EmptyEvents } from './components/ui';

<EmptyState
  title="No data found"
  description="Create your first item to get started"
  action={handleCreate}
  actionText="Create Item"
/>

<EmptyEvents action={handleCreateEvent} />
```

### Form Components

#### Form
```jsx
import { Form, FormField, FormSubmit, commonSchemas } from './components/ui';
import { z } from 'zod';

const schema = z.object({
  name: commonSchemas.required,
  email: commonSchemas.email,
});

<Form schema={schema} onSubmit={handleSubmit}>
  <FormField name="name" label="Name" required>
    <Input name="name" />
  </FormField>
  <FormField name="email" label="Email" required>
    <Input name="email" type="email" />
  </FormField>
  <FormSubmit>Submit</FormSubmit>
</Form>
```

**Features:**
- Zod schema validation
- Automatic error handling
- Loading states
- Reset functionality

## Setup

### 1. Install Dependencies
```bash
npm install react-hook-form @hookform/resolvers zod
```

### 2. Wrap Your App with ToastProvider
```jsx
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

### 3. Use Components
```jsx
import { Button, Input, DataTable, useToast } from './components/ui';

function MyComponent() {
  const { success } = useToast();
  
  return (
    <div>
      <Button onClick={() => success('Hello!')}>
        Show Toast
      </Button>
    </div>
  );
}
```

## DataTable Usage

### Basic Usage
```jsx
const columns = [
  { header: 'Name', accessor: 'name', sortable: true },
  { header: 'Email', accessor: 'email', sortable: true },
  { header: 'Status', accessor: 'status' },
];

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  // ... more data
];

<DataTable
  data={data}
  columns={columns}
  searchable
  pagination
  pageSize={10}
/>
```

### With Server Pagination
```jsx
<DataTable
  data={data}
  columns={columns}
  serverPagination
  currentPage={currentPage}
  totalCount={totalCount}
  onPageChange={handlePageChange}
  onSearch={handleSearch}
  onSortChange={handleSort}
/>
```

### With Bulk Actions
```jsx
const bulkActions = [
  { label: 'Delete', variant: 'danger' },
  { label: 'Activate', variant: 'success' },
];

<DataTable
  data={data}
  columns={columns}
  bulkActions={bulkActions}
  onBulkAction={handleBulkAction}
  confirmBulkAction={true}
/>
```

### With Row Actions
```jsx
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const rowActions = [
  { label: 'Edit', icon: PencilIcon, variant: 'primary' },
  { label: 'Delete', icon: TrashIcon, variant: 'danger' },
];

<DataTable
  data={data}
  columns={columns}
  rowActions={rowActions}
  onRowAction={handleRowAction}
/>
```

## Styling

All components use Tailwind CSS classes and follow a consistent design system:

- **Spacing**: px-4/py-3 for table cells, consistent spacing throughout
- **Typography**: 14px text (text-sm) for table content
- **Colors**: Blue primary, semantic colors for states
- **Focus States**: Ring-2 ring-blue-500 for accessibility
- **Transitions**: Smooth transitions for interactive elements

## Accessibility

- All components include proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- WCAG 2.1 AA compliant

## Examples

See `ExampleUsage.jsx` for comprehensive examples of all components working together.
