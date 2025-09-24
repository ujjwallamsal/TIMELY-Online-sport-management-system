import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';
import DataTable from '../../components/ui/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { smartConnect } from '../../lib/realtime.js';

export default function AdminResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [fixtureFilter, setFixtureFilter] = useState(searchParams.get('fixture') || '');

  // Form state
  const [formData, setFormData] = useState({
    fixture: '',
    team1_score: 0,
    team2_score: 0,
    notes: ''
  });

  useEffect(() => {
    loadResults();
    loadFixtures();
    
    // Connect to real-time updates
    const connection = smartConnect('general', (data) => {
      if (data.type === 'result_update') {
        loadResults();
      }
    });

    return () => {
      connection.close();
    };
  }, [fixtureFilter]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = fixtureFilter ? { fixture: fixtureFilter } : {};
      const data = await api.getResults(params);
      setResults(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const loadFixtures = async () => {
    try {
      const data = await api.getFixtures();
      setFixtures(data.results || data);
    } catch (err) {
      console.error('Failed to load fixtures:', err);
    }
  };

  const handleCreateResult = async (e) => {
    e.preventDefault();
    try {
      await api.createResult(formData);
      setShowCreateDialog(false);
      resetForm();
      loadResults();
    } catch (err) {
      setError(err.message || 'Failed to create result');
    }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    try {
      await api.updateResult(editingResult.id, formData);
      setShowEditDialog(false);
      setEditingResult(null);
      resetForm();
      loadResults();
    } catch (err) {
      setError(err.message || 'Failed to update result');
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) {
      return;
    }
    
    try {
      await api.deleteResult(resultId);
      loadResults();
    } catch (err) {
      setError(err.message || 'Failed to delete result');
    }
  };

  const resetForm = () => {
    setFormData({
      fixture: '',
      team1_score: 0,
      team2_score: 0,
      notes: ''
    });
  };

  const openEditDialog = (result) => {
    setEditingResult(result);
    setFormData({
      fixture: result.fixture?.id || '',
      team1_score: result.team1_score || 0,
      team2_score: result.team2_score || 0,
      notes: result.notes || ''
    });
    setShowEditDialog(true);
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

  const getWinner = (result) => {
    if (result.team1_score > result.team2_score) {
      return result.fixture?.team1?.name || 'Team 1';
    } else if (result.team2_score > result.team1_score) {
      return result.fixture?.team2?.name || 'Team 2';
    } else {
      return 'Draw';
    }
  };

  const columns = [
    {
      header: 'Fixture',
      accessor: 'fixture',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {value?.team1?.name || 'TBD'} vs {value?.team2?.name || 'TBD'}
          </div>
          <div className="text-sm text-gray-500">{value?.event?.name}</div>
        </div>
      )
    },
    {
      header: 'Score',
      accessor: 'team1_score',
      render: (value, row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {row.team1_score} - {row.team2_score}
          </div>
          <div className="text-sm text-gray-500">
            Winner: {getWinner(row)}
          </div>
        </div>
      )
    },
    {
      header: 'Created At',
      accessor: 'created_at',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (value) => value || '-'
    }
  ];

  const fetchPage = async ({ page, pageSize, sortBy, sortDir, filters }) => {
    const params = {
      page,
      page_size: pageSize,
      ordering: sortDir === 'desc' ? `-${sortBy}` : sortBy,
      fixture: fixtureFilter,
      ...filters
    };

    const data = await api.getResults(params);
    return {
      rows: data.results || data,
      total: data.count || data.length || 0
    };
  };

  const rowActions = (row) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => openEditDialog(row)}
      >
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleDeleteResult(row.id)}
      >
        Delete
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="mt-1 text-sm text-gray-600">Record and manage match results</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={fixtureFilter}
            onChange={(e) => setFixtureFilter(e.target.value)}
            options={[
              { value: '', label: 'All Fixtures' },
              ...fixtures.map(fixture => ({ 
                value: fixture.id, 
                label: `${fixture.team1?.name || 'TBD'} vs ${fixture.team2?.name || 'TBD'} (${fixture.event?.name})`
              }))
            ]}
          />
          <Button
            variant="primary"
            onClick={() => setShowCreateDialog(true)}
          >
            Add Result
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <DataTable
        columns={columns}
        fetchPage={fetchPage}
        rowActions={rowActions}
        pageSize={10}
        initialSortBy="created_at"
        initialSortDir="desc"
        emptyDescription="No results found."
      />

      {/* Create Result Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          resetForm();
        }}
        title="Add New Result"
      >
        <form onSubmit={handleCreateResult} className="space-y-4">
          <Select
            label="Fixture"
            value={formData.fixture}
            onChange={(e) => setFormData({ ...formData, fixture: e.target.value })}
            options={fixtures.map(fixture => ({ 
              value: fixture.id, 
              label: `${fixture.team1?.name || 'TBD'} vs ${fixture.team2?.name || 'TBD'} (${fixture.event?.name})`
            }))}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Team 1 Score"
              type="number"
              value={formData.team1_score}
              onChange={(e) => setFormData({ ...formData, team1_score: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
            <Input
              label="Team 2 Score"
              type="number"
              value={formData.team2_score}
              onChange={(e) => setFormData({ ...formData, team2_score: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
          </div>
          
          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Result
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Result Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingResult(null);
          resetForm();
        }}
        title="Edit Result"
      >
        <form onSubmit={handleUpdateResult} className="space-y-4">
          <Select
            label="Fixture"
            value={formData.fixture}
            onChange={(e) => setFormData({ ...formData, fixture: e.target.value })}
            options={fixtures.map(fixture => ({ 
              value: fixture.id, 
              label: `${fixture.team1?.name || 'TBD'} vs ${fixture.team2?.name || 'TBD'} (${fixture.event?.name})`
            }))}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Team 1 Score"
              type="number"
              value={formData.team1_score}
              onChange={(e) => setFormData({ ...formData, team1_score: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
            <Input
              label="Team 2 Score"
              type="number"
              value={formData.team2_score}
              onChange={(e) => setFormData({ ...formData, team2_score: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
          </div>
          
          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditDialog(false);
                setEditingResult(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Result
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}