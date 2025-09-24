import React, { useEffect, useMemo, useState } from 'react';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api, { eventFixturesAPI } from '../../services/api.js';
import { 
  CalendarIcon, 
  ClockIcon, 
  TrophyIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function AdminFixtures() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [mode, setMode] = useState('rr');
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [resultForm, setResultForm] = useState({ score_a: '', score_b: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ start_time: '' });
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
      const resp = await eventFixturesAPI.list(eventId, { page, page_size: pageSize });
      const data = resp.results || resp.data || [];
      return {
        rows: data,
        total: resp.count || data.length
      };
    };
  }, [eventId]);

  const generate = async () => {
    if (!eventId) return;
    setProcessing(true);
    try {
      await eventFixturesAPI.generate(eventId, mode);
      push({ type: 'success', title: 'Fixtures generated', message: `Generated ${mode === 'rr' ? 'round-robin' : 'knockout'} fixtures` });
    } catch (err) {
      push({ type: 'error', title: 'Generation failed', message: err.message || 'Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResult = (fixture) => {
    setSelectedFixture(fixture);
    setResultForm({ 
      score_a: fixture.score_a || '', 
      score_b: fixture.score_b || '' 
    });
    setShowResultDialog(true);
  };

  const handleReschedule = (fixture) => {
    setSelectedFixture(fixture);
    setRescheduleForm({ 
      start_time: fixture.start_time ? fixture.start_time.slice(0, 16) : '' 
    });
    setShowRescheduleDialog(true);
  };

  const confirmSubmitResult = async () => {
    if (!selectedFixture) return;
    
    setProcessing(true);
    try {
      await eventFixturesAPI.submitResult(selectedFixture.id, {
        score_a: parseInt(resultForm.score_a) || 0,
        score_b: parseInt(resultForm.score_b) || 0
      });
      push({ type: 'success', title: 'Result submitted', message: `${selectedFixture.team_a?.name} ${resultForm.score_a} - ${resultForm.score_b} ${selectedFixture.team_b?.name}` });
      setShowResultDialog(false);
    } catch (err) {
      push({ type: 'error', title: 'Submit failed', message: err.message || 'Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedFixture) return;
    
    setProcessing(true);
    try {
      await eventFixturesAPI.patchFixture(selectedFixture.id, { 
        start_time: rescheduleForm.start_time 
      });
      push({ type: 'success', title: 'Fixture rescheduled', message: `New time: ${new Date(rescheduleForm.start_time).toLocaleString()}` });
      setShowRescheduleDialog(false);
    } catch (err) {
      push({ type: 'error', title: 'Reschedule failed', message: err.message || 'Please try again.' });
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
      accessor: 'matchup', 
      header: 'Match',
      render: (value, fixture) => (
        <div className="flex items-center">
          <div className="flex-1 text-right pr-2">
            <div className="font-medium">{fixture.team_a?.name || 'TBA'}</div>
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
            {fixture.status === 'FINISHED' ? `${fixture.score_a || 0} - ${fixture.score_b || 0}` : 'vs'}
          </div>
          <div className="flex-1 text-left pl-2">
            <div className="font-medium">{fixture.team_b?.name || 'TBA'}</div>
          </div>
        </div>
      )
    },
    { 
      accessor: 'start_time', 
      header: 'Scheduled Time',
      render: (value, fixture) => (
        <div className="flex items-center text-sm">
          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
          <div>
            <div>{formatDate(fixture.start_time)}</div>
            {fixture.venue && (
              <div className="text-gray-500 text-xs">{fixture.venue}</div>
            )}
          </div>
        </div>
      )
    },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (value, fixture) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          fixture.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
          fixture.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
          fixture.status === 'SCHEDULED' ? 'bg-gray-100 text-gray-800' :
          fixture.status === 'RESCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {fixture.status}
        </span>
      )
    },
    { 
      accessor: 'id', 
      header: 'Actions', 
      render: (value, fixture) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleReschedule(fixture)} 
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Reschedule fixture"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {fixture.status !== 'FINISHED' && (
            <button 
              onClick={() => handleSubmitResult(fixture)} 
              className="text-green-600 hover:text-green-800 p-1"
              title="Submit result"
            >
              <TrophyIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Fixtures</h1>
          <p className="text-gray-600">Generate and manage event fixtures and results</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Fixtures</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Format</label>
            <Select 
              value={mode} 
              onChange={(value) => setMode(value)}
              options={[
                { value: 'rr', label: 'Round-robin' },
                { value: 'ko', label: 'Knockout' }
              ]}
            />
          </div>
          <div className="pt-6">
            <Button 
              onClick={generate} 
              disabled={!eventId || processing}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {processing ? 'Generating...' : 'Generate Fixtures'}
            </Button>
          </div>
        </div>
      </div>

      {eventId ? (
        <DataTable columns={columns} fetchPage={fetchPage} />
      ) : (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No event selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select an event to view and manage its fixtures.</p>
        </div>
      )}

      {/* Result Submission Dialog */}
      <Dialog 
        open={showResultDialog} 
        onClose={() => { setShowResultDialog(false); setSelectedFixture(null); }}
        title="Submit Match Result"
      >
        {selectedFixture && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Match Details</h4>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedFixture.team_a?.name || 'TBA'}</span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium">{selectedFixture.team_b?.name || 'TBA'}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  {formatDate(selectedFixture.start_time)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedFixture.team_a?.name || 'Team A'} Score
                </label>
                <Input
                  type="number"
                  value={resultForm.score_a}
                  onChange={(e) => setResultForm({...resultForm, score_a: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedFixture.team_b?.name || 'Team B'} Score
                </label>
                <Input
                  type="number"
                  value={resultForm.score_b}
                  onChange={(e) => setResultForm({...resultForm, score_b: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => { setShowResultDialog(false); setSelectedFixture(null); }}
              >
                Cancel
              </button>
              <Button 
                type="button"
                onClick={confirmSubmitResult}
                disabled={processing}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? 'Submitting...' : 'Submit Result'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog 
        open={showRescheduleDialog} 
        onClose={() => { setShowRescheduleDialog(false); setSelectedFixture(null); }}
        title="Reschedule Fixture"
      >
        {selectedFixture && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Fixture Details</h4>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedFixture.team_a?.name || 'TBA'}</span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium">{selectedFixture.team_b?.name || 'TBA'}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  Current: {formatDate(selectedFixture.start_time)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Start Time</label>
              <Input
                type="datetime-local"
                value={rescheduleForm.start_time}
                onChange={(e) => setRescheduleForm({...rescheduleForm, start_time: e.target.value})}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => { setShowRescheduleDialog(false); setSelectedFixture(null); }}
              >
                Cancel
              </button>
              <Button 
                type="button"
                onClick={confirmReschedule}
                disabled={processing || !rescheduleForm.start_time}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? 'Rescheduling...' : 'Reschedule'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}


