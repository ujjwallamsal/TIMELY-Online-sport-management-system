import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Simulate loading data - replace with actual API calls
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'ATHLETE', status: 'active', createdAt: '2024-01-15', lastLogin: '2024-01-20' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'ORGANIZER', status: 'active', createdAt: '2024-01-10', lastLogin: '2024-01-19' },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'COACH', status: 'pending', createdAt: '2024-01-18', lastLogin: 'Never' },
        { id: 4, name: 'Alice Johnson', email: 'alice@example.com', role: 'ATHLETE', status: 'active', createdAt: '2024-01-12', lastLogin: '2024-01-18' },
        { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'SPECTATOR', status: 'active', createdAt: '2024-01-14', lastLogin: '2024-01-17' },
        { id: 6, name: 'Diana Prince', email: 'diana@example.com', role: 'ORGANIZER', status: 'inactive', createdAt: '2024-01-08', lastLogin: '2024-01-10' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'ORGANIZER': return 'purple';
      case 'ATHLETE': return 'success';
      case 'COACH': return 'info';
      case 'SPECTATOR': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'danger';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return '⚙️';
      case 'ORGANIZER': return '🎯';
      case 'ATHLETE': return '🏃';
      case 'COACH': return '👨‍🏫';
      case 'SPECTATOR': return '👀';
      default: return '👤';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Never') return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-xl text-gray-600 mt-2">Manage all system users and their roles</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 text-center">
          <Button 
            onClick={() => setShowCreateModal(true)} 
            variant="primary" 
            size="xl" 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
          >
            <PlusIcon className="w-6 h-6 mr-3" />
            Add New User
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-3">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{users.length}</h3>
            <p className="text-blue-100 text-sm">Total Users</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-3">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{users.filter(u => u.status === 'active').length}</h3>
            <p className="text-green-100 text-sm">Active Users</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-3">
              <ClockIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{users.filter(u => u.status === 'pending').length}</h3>
            <p className="text-orange-100 text-sm">Pending</p>
          </Card>

          <Card className="text-center transform hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full mx-auto mb-3">
              <StarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{users.filter(u => u.role === 'ORGANIZER').length}</h3>
            <p className="text-purple-100 text-sm">Organizers</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="flex-1 text-lg"
              />
              <Button variant="primary" size="lg">
                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="ATHLETE">Athlete</option>
                <option value="COACH">Coach</option>
                <option value="SPECTATOR">Spectator</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('');
                  setSelectedStatus('');
                }}
                className="justify-center"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleColor(user.role)} size="lg">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(user.status)} size="sm">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria or create a new user.</p>
              <Button onClick={() => setShowCreateModal(true)} variant="primary" size="lg">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add User
              </Button>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="lg"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-6 py-3"
              >
                Previous
              </Button>
              <span className="px-6 py-3 text-lg text-gray-700 font-medium">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-6 py-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create User Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                <p className="text-gray-500 mb-6">This feature will be implemented soon.</p>
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
