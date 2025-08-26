import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVenues, getDivisions, createEvent } from '../lib/api';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sport_type: '',
    description: '',
    start_date: '',
    end_date: '',
    registration_open: '',
    registration_close: '',
    venue: '',
    capacity: 100,
    fee_cents: 0,
    divisions: [],
    eligibility_notes: '',
    rules_and_regulations: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [venuesData, divisionsData] = await Promise.all([
        getVenues(),
        getDivisions()
      ]);
      setVenues(venuesData || []);
      setDivisions(divisionsData || []);
    } catch (err) {
      setError('Failed to load venues and divisions');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = e.target.checked;
      if (name === 'divisions') {
        const divisionId = parseInt(value);
        setFormData(prev => ({
          ...prev,
          divisions: checked 
            ? [...prev.divisions, divisionId]
            : prev.divisions.filter(id => id !== divisionId)
        }));
      }
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Event name is required');
    if (!formData.sport_type.trim()) errors.push('Sport type is required');
    if (!formData.start_date) errors.push('Start date is required');
    if (!formData.end_date) errors.push('End date is required');
    if (!formData.venue) errors.push('Venue is required');
    if (formData.capacity < 1) errors.push('Capacity must be at least 1');
    if (formData.fee_cents < 0) errors.push('Fee cannot be negative');
    
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.push('End date must be after start date');
    }
    
    if (formData.registration_close && formData.start_date && 
        new Date(formData.registration_close) > new Date(formData.start_date)) {
      errors.push('Registration must close before event starts');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Convert fee to cents
      const eventData = {
        ...formData,
        fee_cents: Math.round(parseFloat(formData.fee_cents) * 100)
      };
      
      await createEvent(eventData);
      navigate('/manage-events');
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center py-8">
            <div className="loading-spinner"></div>
            <p className="mt-3">Loading venues and divisions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !['ORGANIZER', 'ADMIN'].includes(user.role)) {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You need organizer privileges to create events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="card">
        <div className="card-header">
          <h1>Create New Event</h1>
          <p className="text-gray-600">Fill in the details below to create your event</p>
        </div>
        <div className="card-body">
          {error && <div className="error-message mb-4"><p>{error}</p></div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., Summer Soccer Championship"
                />
              </div>
              
              <div>
                <label className="form-label">Sport Type *</label>
                <input
                  type="text"
                  name="sport_type"
                  value={formData.sport_type}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., Soccer, Basketball, Swimming"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="form-input"
                placeholder="Describe your event..."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Registration Opens</label>
                <input
                  type="datetime-local"
                  name="registration_open"
                  value={formData.registration_open}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Registration Closes</label>
                <input
                  type="datetime-local"
                  name="registration_close"
                  value={formData.registration_close}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Venue and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Venue *</label>
                <select
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  max="10000"
                  className="form-input"
                />
              </div>
            </div>

            {/* Financial */}
            <div>
              <label className="form-label">Registration Fee (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="fee_cents"
                  value={formData.fee_cents / 100}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Divisions */}
            <div>
              <label className="form-label">Event Divisions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {divisions.map(division => (
                  <label key={division.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="divisions"
                      value={division.id}
                      checked={formData.divisions.includes(division.id)}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="text-sm">{division.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Eligibility Notes</label>
                <textarea
                  name="eligibility_notes"
                  value={formData.eligibility_notes}
                  onChange={handleChange}
                  rows={3}
                  className="form-input"
                  placeholder="Who can participate..."
                />
              </div>
              
              <div>
                <label className="form-label">Rules & Regulations</label>
                <textarea
                  name="rules_and_regulations"
                  value={formData.rules_and_regulations}
                  onChange={handleChange}
                  rows={3}
                  className="form-input"
                  placeholder="Event rules..."
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Creating Event...' : 'Create Event'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/manage-events')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
