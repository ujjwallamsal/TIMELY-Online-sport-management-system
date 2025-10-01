import React, { useState } from 'react';
import { Send, Bell, Users, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { z } from 'zod';
import { useForm } from '../../hooks/useForm';

interface Announcement {
  id: number;
  title: string;
  message: string;
  target_audience: string;
  created_at: string;
  author_name?: string;
}

const Announcements: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        const response = await api.get('/announcements/');
        return response.data.results || response.data || [];
      } catch (error) {
        console.warn('Announcements endpoint not available');
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/announcements/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement Sent', 'Your announcement has been sent to the selected audience.');
      form.reset();
      setActiveTab('list');
    },
    onError: (error: any) => {
      showError('Send Failed', error.response?.data?.detail || 'Failed to send announcement');
    },
  });

  const form = useForm({
    initialValues: {
      title: '',
      message: '',
      target_audience: 'all' as 'all' | 'athletes' | 'coaches' | 'spectators',
    },
    validationSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      message: z.string().min(1, 'Message is required'),
      target_audience: z.enum(['all', 'athletes', 'coaches', 'spectators']),
    }),
    onSubmit: async (values) => {
      createMutation.mutate(values);
    },
  });

  const audienceOptions = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'athletes', label: 'Athletes Only', icon: Users },
    { value: 'coaches', label: 'Coaches Only', icon: Users },
    { value: 'spectators', label: 'Spectators Only', icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Announcements</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card h-32 bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const announcementsList = announcements || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
          <p className="text-gray-600">
            Send announcements to athletes, coaches, and spectators
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="inline h-4 w-4 mr-2" />
              Recent Announcements
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="inline h-4 w-4 mr-2" />
              Create New
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <div>
            {announcementsList.length === 0 ? (
              <div className="card text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
                <p className="text-gray-500 mb-6">
                  Create your first announcement to notify users
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="btn btn-primary"
                >
                  Create Announcement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcementsList.map((announcement: Announcement) => (
                  <div key={announcement.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize">
                        {announcement.target_audience}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                    <div className="text-sm text-gray-500">
                      {new Date(announcement.created_at).toLocaleString()}
                      {announcement.author_name && ` • by ${announcement.author_name}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <form onSubmit={form.handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={form.values.title}
                  onChange={(e) => form.setValue('title', e.target.value)}
                  className="input"
                  placeholder="Enter announcement title..."
                />
                {form.errors.title && (
                  <p className="form-error">{form.errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.values.message}
                  onChange={(e) => form.setValue('message', e.target.value)}
                  rows={6}
                  className="input"
                  placeholder="Enter your announcement message..."
                />
                {form.errors.message && (
                  <p className="form-error">{form.errors.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {audienceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          form.values.target_audience === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="target_audience"
                          value={option.value}
                          checked={form.values.target_audience === option.value}
                          onChange={() => form.setValue('target_audience', option.value)}
                          className="sr-only"
                        />
                        <Icon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {option.label}
                        </span>
                        {form.values.target_audience === option.value && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                {form.errors.target_audience && (
                  <p className="form-error">{form.errors.target_audience}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Recipients will be notified immediately
                </div>
                <button
                  type="submit"
                  disabled={form.isSubmitting || createMutation.isPending}
                  className="btn btn-primary flex items-center"
                >
                  {form.isSubmitting || createMutation.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;

