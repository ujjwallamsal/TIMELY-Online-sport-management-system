// src/pages/admin/AnnouncementsManage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Send,
  Eye,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AnnouncementsManage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    event: '',
    audience: 'ALL',
    subject: '',
    body: '',
    sendTest: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.map(ann => ({
          id: ann.id,
          event: ann.event?.name || 'Unknown Event',
          subject: ann.title,
          audience: ann.is_public ? 'ALL' : 'PARTICIPANTS',
          sentAt: new Date(ann.created_at).toLocaleString(),
          count: ann.target_teams?.length || 0
        })));
      } else {
        console.error('Error fetching announcements:', response.statusText);
        // Fallback to empty array
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Fallback to empty array
      setAnnouncements([]);
    }
  };

  const handleSendAnnouncement = async () => {
    try {
      if (!formData.event) {
        alert('Please select an event');
        return;
      }
      
      if (!formData.subject || !formData.body) {
        alert('Please fill in both subject and message');
        return;
      }

      const response = await fetch(`/api/events/${formData.event}/announce/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.subject,
          message: formData.body,
          audience: formData.audience
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Announcement sent successfully:', result);
        setShowForm(false);
        setFormData({
          event: '',
          audience: 'ALL',
          subject: '',
          body: '',
          sendTest: false
        });
        fetchAnnouncements(); // Refresh the list
        alert('Announcement sent successfully!');
      } else {
        const error = await response.json();
        console.error('Error sending announcement:', error);
        alert(`Error: ${error.error || 'Failed to send announcement'}`);
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement. Please try again.');
    }
  };

  const handleSendTest = async () => {
    try {
      // API call to send test announcement
      console.log('Sending test announcement:', formData);
    } catch (error) {
      console.error('Error sending test announcement:', error);
    }
  };

  const getAudienceBadge = (audience) => {
    const audienceClasses = {
      ALL: 'bg-blue-100 text-blue-800',
      PARTICIPANTS: 'bg-green-100 text-green-800',
      OFFICIALS: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${audienceClasses[audience]}`}>
        {audience}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4 mr-2" />
          New Announcement
        </button>
      </div>

      {/* Announcement Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Send Announcement</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event
              </label>
              <select
                value={formData.event}
                onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Event</option>
                <option value="basketball">Basketball Championship</option>
                <option value="soccer">Soccer League</option>
                <option value="tennis">Tennis Tournament</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audience
              </label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All</option>
                <option value="PARTICIPANTS">Participants</option>
                <option value="OFFICIALS">Officials</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter announcement subject"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Enter announcement message"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendTest"
                checked={formData.sendTest}
                onChange={(e) => setFormData(prev => ({ ...prev, sendTest: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendTest" className="ml-2 block text-sm text-gray-900">
                Send test email to myself first
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTest}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Send Test
            </button>
            <button
              onClick={handleSendAnnouncement}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Send Announcement
            </button>
          </div>
        </div>
      )}

      {/* Past Announcements */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Past Announcements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {announcement.event}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {announcement.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAudienceBadge(announcement.audience)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {announcement.sentAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {announcement.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManage;
