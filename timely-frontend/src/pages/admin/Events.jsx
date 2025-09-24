import React, { useCallback, useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api, { cancelEvent, getVenues } from '../../services/api.js';
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements.jsx';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AdminEvents() {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceForm, setAnnounceForm] = useState({
    event_id: '',
    title: '',
    message: '',
    audience: 'ALL'
  });
  const [form, setForm] = useState({
    name: '',
    description: '',
    sport: '',
    start_datetime: '',
    end_datetime: '',
    venue: '',
    location: '',
    capacity: '',
    fee_cents: '',
    visibility: 'PUBLIC',
    status: 'UPCOMING'
  });

  // Load venues and events for the dropdowns
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const response = await getVenues();
        setVenues(response.results || response.data || []);
      } catch (err) {
        console.error('Failed to load venues:', err);
      }
    };
    
    const loadEvents = async () => {
      try {
        const response = await api.getEvents({ page_size: 100 });
        setEvents(response.results || response.data || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    
    loadVenues();
    loadEvents();
  }, []);

  const fetchPage = useCallback(async ({ page, pageSize }) => {
    const response = await api.getEvents({ page, page_size: pageSize });
    return {
      rows: response.results || response.data || [],
      total: response.count || response.total || 0
    };
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      sport: '',
      start_datetime: '',
      end_datetime: '',
      venue: '',
      location: '',
      capacity: '',
      fee_cents: '',
      visibility: 'PUBLIC',
      status: 'UPCOMING'
    });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // Convert fee to cents if provided
      const formData = { ...form };
      if (formData.fee_cents) {
        formData.fee_cents = Math.round(parseFloat(formData.fee_cents) * 100);
      }
      
      if (editing) {
        await api.updateEvent(editing.id, formData);
        push({ type: 'success', title: 'Event updated', message: formData.name });
      } else {
        await api.createEvent(formData);
        push({ type: 'success', title: 'Event created', message: formData.name });
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

  const handleEdit = (event) => {
    setEditing(event);
    setForm({
      name: event.name || '',
      description: event.description || '',
      sport: event.sport || '',
      start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : '',
      end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : '',
      venue: event.venue || '',
      location: event.location || '',
      capacity: event.capacity || '',
      fee_cents: event.fee_cents ? (event.fee_cents / 100).toString() : '',
      visibility: event.visibility || 'PUBLIC',
      status: event.status || 'UPCOMING'
    });
    setOpen(true);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    
    try {
      await cancelEvent(id);
      push({ type: 'success', title: 'Event canceled' });
    } catch (err) {
      push({ type: 'error', title: 'Cancel failed', message: err.message || 'Please try again.' });
    }
  };

  const handleAnnounceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post(`/events/${announceForm.event_id}/announce/`, {
        title: announceForm.title,
        message: announceForm.message,
        audience: announceForm.audience
      });
      
      push({ type: 'success', title: 'Announcement sent', message: 'Announcement has been broadcast to all users.' });
      setAnnounceOpen(false);
      setAnnounceForm({ event_id: '', title: '', message: '', audience: 'ALL' });
    } catch (err) {
      push({ type: 'error', title: 'Announcement failed', message: err.message || 'Please try again.' });
    }
  };

  const columns = [
    { 
      accessor: 'name', 
      header: 'Event Name',
      render: (value, event) => (
        <div>
          <div className="font-semibold text-gray-900">{event.name}</div>
          <div className="text-sm text-gray-500">{event.sport}</div>
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
          event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
          event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
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
          {event.venue_name || event.location || 'TBA'}
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
    },
    { 
      accessor: 'id', 
      header: 'Actions', 
      render: (value, event) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleEdit(event)} 
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit event"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleCancel(event.id)} 
            className="text-red-600 hover:text-red-800 p-1"
            title="Cancel event"
            disabled={event.status === 'CANCELLED'}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-600">Create, edit, and manage sports events</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setAnnounceOpen(true); }} variant="outline">Send Announcement</Button>
          <Button onClick={() => { resetForm(); setOpen(true); }}>Create Event</Button>
        </div>
      </div>

      {/* Live Announcements */}
      <div className="mb-6">
        <RealtimeAnnouncements showInDashboard={true} />
      </div>
      
      <DataTable columns={columns} fetchPage={fetchPage} />

      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} title={editing ? "Edit Event" : "Create Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                required 
                placeholder="Enter event name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
              <Input 
                value={form.sport} 
                onChange={(e) => setForm({...form, sport: e.target.value})} 
                required 
                placeholder="e.g., Basketball, Football"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm({...form, description: e.target.value})} 
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <Input 
                type="datetime-local" 
                value={form.start_datetime} 
                onChange={(e) => setForm({...form, start_datetime: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
              <Input 
                type="datetime-local" 
                value={form.end_datetime} 
                onChange={(e) => setForm({...form, end_datetime: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <Select
                value={form.venue}
                onChange={(value) => setForm({...form, venue: value})}
                options={[
                  { value: '', label: 'Select a venue' },
                  ...venues.map(venue => ({ value: venue.id, label: venue.name }))
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input 
                value={form.location} 
                onChange={(e) => setForm({...form, location: e.target.value})} 
                placeholder="Alternative location if no venue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <Input 
                type="number" 
                value={form.capacity} 
                onChange={(e) => setForm({...form, capacity: e.target.value})} 
                placeholder="Max participants"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee ($)</label>
              <Input 
                type="number" 
                step="0.01" 
                value={form.fee_cents} 
                onChange={(e) => setForm({...form, fee_cents: e.target.value})} 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <Select
                value={form.visibility}
                onChange={(value) => setForm({...form, visibility: value})}
                options={[
                  { value: 'PUBLIC', label: 'Public' },
                  { value: 'PRIVATE', label: 'Private' }
                ]}
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
              {creating ? (editing ? 'Updating...' : 'Creating...') : (editing ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog 
        open={announceOpen} 
        onClose={() => { setAnnounceOpen(false); setAnnounceForm({ event_id: '', title: '', message: '', audience: 'ALL' }); }} 
        title="Send Announcement"
      >
        <form onSubmit={handleAnnounceSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event *</label>
            <Select
              value={announceForm.event_id}
              onChange={(value) => setAnnounceForm({...announceForm, event_id: value})}
              options={[
                { value: '', label: 'Select an event' },
                ...events.map(event => ({ value: event.id, label: event.name }))
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input 
              value={announceForm.title} 
              onChange={(e) => setAnnounceForm({...announceForm, title: e.target.value})} 
              required 
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <Textarea 
              value={announceForm.message} 
              onChange={(e) => setAnnounceForm({...announceForm, message: e.target.value})} 
              required 
              placeholder="Announcement message"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <Select
              value={announceForm.audience}
              onChange={(value) => setAnnounceForm({...announceForm, audience: value})}
              options={[
                { value: 'ALL', label: 'All Users' },
                { value: 'PARTICIPANTS', label: 'Event Participants Only' },
                { value: 'ORGANIZERS', label: 'Organizers Only' }
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={() => { setAnnounceOpen(false); setAnnounceForm({ event_id: '', title: '', message: '', audience: 'ALL' }); }}
            >
              Cancel
            </button>
            <Button type="submit" disabled={!announceForm.event_id || !announceForm.title || !announceForm.message}>
              Send Announcement
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}


