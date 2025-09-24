import React, { useCallback, useState } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { 
  MapPinIcon, 
  UsersIcon, 
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminVenues() {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    capacity: '', 
    facilities: '', 
    timezone: 'UTC' 
  });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const fetchPage = useCallback(async ({ page, pageSize }) => {
    const response = await api.getVenues({ page, page_size: pageSize });
    return {
      rows: response.results || response.data || [],
      total: response.count || response.total || 0
    };
  }, []);

  const resetForm = () => {
    setForm({ 
      name: '', 
      address: '', 
      capacity: '', 
      facilities: '', 
      timezone: 'UTC' 
    });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const formData = { ...form };
      if (formData.capacity) {
        formData.capacity = parseInt(formData.capacity);
      }
      if (formData.facilities) {
        // Try to parse as JSON array, otherwise treat as comma-separated string
        try {
          formData.facilities = JSON.parse(formData.facilities);
        } catch {
          formData.facilities = formData.facilities.split(',').map(f => f.trim()).filter(f => f);
        }
      }
      
      if (editing) {
        await api.updateVenue(editing.id, formData);
        push({ type: 'success', title: 'Venue updated', message: formData.name });
      } else {
        await api.createVenue(formData);
        push({ type: 'success', title: 'Venue created', message: formData.name });
      }
      
      setOpen(false);
      resetForm();
    } catch (err) {
      push({ 
        type: 'error', 
        title: editing ? 'Update failed' : 'Create failed', 
        message: err.message || 'Please try again.' 
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (venue) => {
    setEditing(venue);
    setForm({
      name: venue.name || '',
      address: venue.address || '',
      capacity: venue.capacity || '',
      facilities: Array.isArray(venue.facilities) ? venue.facilities.join(', ') : (venue.facilities || ''),
      timezone: venue.timezone || 'UTC'
    });
    setOpen(true);
  };

  const handleDelete = async (venue) => {
    if (!window.confirm(`Are you sure you want to delete "${venue.name}"?`)) return;
    
    try {
      await api.deleteVenue(venue.id);
      push({ type: 'success', title: 'Venue deleted', message: venue.name });
    } catch (err) {
      push({ type: 'error', title: 'Delete failed', message: err.message || 'Please try again.' });
    }
  };

  const viewAvailability = async () => {
    if (!from || !to) {
      push({ type: 'error', title: 'Invalid dates', message: 'Please select both start and end dates.' });
      return;
    }
    
    setCheckingAvailability(true);
    try {
      const res = await api.get('/venues/availability/', { from, to });
      setAvailability(res);
    } catch (err) {
      push({ type: 'error', title: 'Availability error', message: err.message || 'Please try again.' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const formatFacilities = (facilities) => {
    if (!facilities) return 'None';
    if (Array.isArray(facilities)) {
      return facilities.join(', ');
    }
    try {
      const parsed = JSON.parse(facilities);
      return Array.isArray(parsed) ? parsed.join(', ') : facilities;
    } catch {
      return facilities;
    }
  };

  const columns = [
    { 
      accessor: 'name', 
      header: 'Venue Name',
      render: (value, venue) => (
        <div>
          <div className="font-semibold text-gray-900">{venue.name}</div>
          <div className="text-sm text-gray-500">{venue.timezone}</div>
        </div>
      )
    },
    { 
      accessor: 'address', 
      header: 'Location',
      render: (value, venue) => (
        <div className="flex items-center text-sm">
          <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
          <span>{venue.address}</span>
        </div>
      )
    },
    {
      accessor: 'capacity',
      header: 'Capacity',
      render: (value, venue) => (
        <div className="flex items-center text-sm">
          <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
          <span>{venue.capacity || 'Unlimited'}</span>
        </div>
      )
    },
    {
      accessor: 'facilities',
      header: 'Facilities',
      render: (value, venue) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {formatFacilities(venue.facilities)}
        </div>
      )
    },
    { 
      accessor: 'id', 
      header: 'Actions', 
      render: (value, venue) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleEdit(venue)} 
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit venue"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDelete(venue)} 
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete venue"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Venues</h1>
          <p className="text-gray-600">Create and manage sports venues and check availability</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Create Venue
        </Button>
      </div>

      {/* Availability Checker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Venue Availability</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date & Time</label>
            <Input 
              type="datetime-local" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date & Time</label>
            <Input 
              type="datetime-local" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
          </div>
          <div>
            <Button 
              onClick={viewAvailability} 
              disabled={checkingAvailability}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {checkingAvailability ? 'Checking...' : 'Check Availability'}
            </Button>
          </div>
        </div>

        {availability && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Availability Results</h4>
            <div className="text-sm text-gray-600">
              {availability.available_venues ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Available Venues ({availability.available_venues.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availability.available_venues.map((venue, index) => (
                      <div key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {venue.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No availability data returned</div>
              )}
            </div>
          </div>
        )}
      </div>

      <DataTable columns={columns} fetchPage={fetchPage} />

      <Dialog 
        open={open} 
        onClose={() => { setOpen(false); resetForm(); }} 
        title={editing ? "Edit Venue" : "Create Venue"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                required 
                placeholder="Enter venue name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <Input 
                type="number" 
                value={form.capacity} 
                onChange={(e) => setForm({...form, capacity: e.target.value})} 
                placeholder="Maximum capacity"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <Input 
              value={form.address} 
              onChange={(e) => setForm({...form, address: e.target.value})} 
              required 
              placeholder="Enter venue address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facilities</label>
              <Input 
                value={form.facilities} 
                onChange={(e) => setForm({...form, facilities: e.target.value})} 
                placeholder="e.g., Parking, Changing Rooms, Concessions"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple facilities with commas</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <Input 
                value={form.timezone} 
                onChange={(e) => setForm({...form, timezone: e.target.value})} 
                placeholder="e.g., America/New_York, UTC"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={() => { setOpen(false); resetForm(); }}
            >
              Cancel
            </button>
            <Button type="submit" disabled={creating}>
              {creating ? (editing ? 'Updating...' : 'Creating...') : (editing ? 'Update Venue' : 'Create Venue')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}


