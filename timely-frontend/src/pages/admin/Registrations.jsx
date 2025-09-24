import React, { useEffect, useMemo, useState } from 'react';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { 
  CalendarIcon, 
  UserIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminRegistrations() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    api.getEvents({ page_size: 100 })
      .then((response) => { 
        if (active) {
          const data = response.results || response.data || [];
          setEvents(data);
        }
      })
      .catch(() => { if (active) setEvents([]); });
    return () => { active = false; };
  }, []);

  const fetchPage = useMemo(() => {
    return async ({ page, pageSize }) => {
      if (!eventId) return { rows: [], total: 0 };
      const resp = await api.get(`/events/${eventId}/registrations/`, { page, page_size: pageSize });
      const data = resp.results || resp.data || [];
      return {
        rows: data,
        total: resp.count || data.length
      };
    };
  }, [eventId]);

  const handleAction = (registration, type) => {
    setSelectedRegistration(registration);
    setActionType(type);
    setReason('');
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedRegistration || !actionType) return;
    
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await api.patch(`/registrations/${selectedRegistration.id}/approve/`, { reason });
        push({ type: 'success', title: 'Registration approved', message: reason || 'No reason provided' });
      } else {
        await api.patch(`/registrations/${selectedRegistration.id}/reject/`, { reason });
        push({ type: 'success', title: 'Registration rejected', message: reason || 'No reason provided' });
      }
      setShowDialog(false);
      setSelectedRegistration(null);
      setReason('');
    } catch (err) {
      push({ 
        type: 'error', 
        title: actionType === 'approve' ? 'Approve failed' : 'Reject failed', 
        message: err.message || 'Please try again.' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    { 
      accessor: 'applicant', 
      header: 'Applicant',
      render: (value, registration) => (
        <div>
          <div className="flex items-center text-sm">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">
                {registration.applicant?.first_name} {registration.applicant?.last_name}
              </div>
              <div className="text-gray-500">{registration.applicant?.email}</div>
            </div>
          </div>
        </div>
      )
    },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (value, registration) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          registration.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
          registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {registration.status}
        </span>
      )
    },
    { 
      accessor: 'submitted_at', 
      header: 'Submitted',
      render: (value, registration) => (
        <div className="flex items-center text-sm">
          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
          {formatDate(registration.submitted_at)}
        </div>
      )
    },
    {
      accessor: 'team',
      header: 'Team',
      render: (value, registration) => (
        <div className="text-sm">
          {registration.team?.name || 'Individual'}
        </div>
      )
    },
    {
      accessor: 'reason',
      header: 'Reason',
      render: (value, registration) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {registration.reason || '-'}
        </div>
      )
    },
    { 
      accessor: 'id', 
      header: 'Actions', 
      render: (value, registration) => (
        <div className="flex items-center gap-2">
          {registration.status === 'PENDING' && (
            <>
              <button 
                onClick={() => handleAction(registration, 'approve')} 
                className="text-green-600 hover:text-green-800 p-1"
                title="Approve registration"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleAction(registration, 'reject')} 
                className="text-red-600 hover:text-red-800 p-1"
                title="Reject registration"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
          <button 
            onClick={() => { setSelectedRegistration(registration); setShowDialog(true); }}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Registrations</h1>
          <p className="text-gray-600">Review and approve/reject event registrations</p>
        </div>
        <div className="w-80">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
          <Select 
            value={eventId} 
            onChange={(value) => setEventId(value)}
            options={[
              { value: '', label: 'Select an event...' },
              ...events.map((ev) => ({ value: ev.id, label: ev.name }))
            ]}
          />
        </div>
      </div>

      {eventId ? (
        <DataTable columns={columns} fetchPage={fetchPage} />
      ) : (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No event selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select an event to view its registrations.</p>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={showDialog} 
        onClose={() => { setShowDialog(false); setSelectedRegistration(null); setReason(''); }}
        title={actionType === 'approve' ? 'Approve Registration' : actionType === 'reject' ? 'Reject Registration' : 'Registration Details'}
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Registration Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Applicant:</span> {selectedRegistration.applicant?.first_name} {selectedRegistration.applicant?.last_name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedRegistration.applicant?.email}
                </div>
                <div>
                  <span className="font-medium">Team:</span> {selectedRegistration.team?.name || 'Individual'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedRegistration.status}
                </div>
                <div>
                  <span className="font-medium">Submitted:</span> {formatDate(selectedRegistration.submitted_at)}
                </div>
              </div>
            </div>

            {actionType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {actionType === 'approve' ? 'Approval reason (optional)' : 'Rejection reason (required)'}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Enter reason for approval...' : 'Enter reason for rejection...'}
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => { setShowDialog(false); setSelectedRegistration(null); setReason(''); }}
              >
                Cancel
              </button>
              {actionType && (
                <button 
                  type="button"
                  onClick={confirmAction}
                  disabled={processing || (actionType === 'reject' && !reason.trim())}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                  }`}
                >
                  {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}


