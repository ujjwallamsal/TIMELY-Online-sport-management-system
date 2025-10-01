import React from 'react';
import { Users, UserPlus, Mail, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  sport_name?: string;
  members: TeamMember[];
  coach_id: number;
}

const Teams: React.FC = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        // Try to fetch teams from backend
        const response = await api.get('/teams/');
        return response.data.results || response.data || [];
      } catch (error) {
        console.warn('Teams endpoint not available, returning empty array');
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Teams</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card h-48 bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const teamsList = teams || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Teams</h1>
            <p className="text-gray-600">
              Manage your teams and athletes
            </p>
          </div>
        </div>

        {teamsList.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
            <p className="text-gray-500 mb-6">
              Teams you coach will appear here. Contact an administrator to create a team.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {teamsList.map((team: Team) => (
              <div key={team.id} className="card">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{team.name}</h2>
                    {team.sport_name && (
                      <p className="text-gray-600">Sport: {team.sport_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary flex items-center"
                      onClick={() => alert('Add member feature - to be implemented via Django Admin')}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Team Members ({team.members?.length || 0})
                  </h3>

                  {!team.members || team.members.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No members in this team yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-semibold">
                                  {member.first_name[0]}{member.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {member.first_name} {member.last_name}
                                </h4>
                                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

