import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { ENDPOINTS } from './ENDPOINTS';
import { getStoredToken } from './client';
import { useAuth } from '../auth/useAuth';

// Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SPECTATOR' | 'ATHLETE' | 'COACH' | 'ORGANIZER' | 'ADMIN';
  is_active: boolean;
  date_joined: string;
}

export interface Event {
  id: number;
  name: string; // API uses 'name' instead of 'title'
  description: string;
  sport: number | string;
  sport_name?: string;
  venue: number | null;
  venue_name?: string;
  start_datetime: string; // API uses 'start_datetime' instead of 'start_date'
  end_datetime: string; // API uses 'end_datetime' instead of 'end_date'
  fee_cents: number | null; // API uses 'fee_cents' instead of 'registration_fee'
  capacity: number | null; // API uses 'capacity' instead of 'max_participants'
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'UPCOMING';
  visibility: 'PUBLIC' | 'PRIVATE';
  location?: string;
  registration_open_at?: string | null;
  registration_close_at?: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  capacity: number | null;
  facilities: string[];
  contact_phone: string | null;
  contact_email: string | null;
}

export interface Sport {
  id: number;
  name: string;
  description: string;
  rules: string | null;
  equipment_required: string[];
}

export interface Team {
  id: number;
  name: string;
  sport: number;
  sport_name?: string;
  coach: number;
  coach_name?: string;
  members: number[];
  created_at: string;
}

export interface Registration {
  id: number;
  event: number;
  event_title?: string;
  user: number;
  user_name?: string;
  team: number | null;
  team_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registration_date: string;
  notes: string | null;
}

export interface Fixture {
  id: number;
  event: number;
  event_title?: string;
  home_team: number | null;
  home_team_name?: string;
  away_team: number | null;
  away_team_name?: string;
  venue: number;
  venue_name?: string;
  scheduled_date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  round: number;
  created_at: string;
}

export interface Result {
  id: number;
  fixture: number;
  fixture_details?: string;
  home_score: number | null;
  away_score: number | null;
  winner: number | null;
  winner_name?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'LOCKED';
  recorded_by: number;
  recorded_at: string;
  notes: string | null;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: number;
  author_name?: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  events: ['events'] as const,
  venues: ['venues'] as const,
  sports: ['sports'] as const,
  teams: ['teams'] as const,
  registrations: ['registrations'] as const,
  fixtures: ['fixtures'] as const,
  results: ['results'] as const,
  news: ['news'] as const,
  me: ['me'] as const,
  public: ['public'] as const,
} as const;

// Auth queries
export const useMe = () => {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<User>(ENDPOINTS.me).then(res => res.data),
    retry: false,
    enabled: !!getStoredToken(),
  });
};

export const useUsers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.users, params],
    queryFn: () => api.get<PaginatedResponse<User>>(ENDPOINTS.users, { params }).then(res => res.data),
  });
};

// Event queries
export const useEvents = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.events, params],
    queryFn: () => api.get<PaginatedResponse<Event>>(ENDPOINTS.events, { params }).then(res => res.data),
  });
};

export const useEvent = (id: number) => {
  return useQuery({
    queryKey: [...queryKeys.events, id],
    queryFn: () => api.get<Event>(ENDPOINTS.event(id)).then(res => res.data),
    enabled: !!id,
  });
};

export const usePublicEvents = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'events', params],
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.publicEvents, { params });
      // Normalize to array: support both paginated and plain list responses
      const data = res.data as any;
      return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    },
  });
};

// Venue queries
export const useVenues = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.venues, params],
    queryFn: () => api.get<PaginatedResponse<Venue>>(ENDPOINTS.venues, { params }).then(res => res.data),
  });
};

export const useVenue = (id: number) => {
  return useQuery({
    queryKey: [...queryKeys.venues, id],
    queryFn: () => api.get<Venue>(ENDPOINTS.venue(id)).then(res => res.data),
    enabled: !!id,
  });
};

// Sport queries
export const useSports = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.sports, params],
    queryFn: () => api.get<PaginatedResponse<Sport>>(ENDPOINTS.sports, { params }).then(res => res.data),
  });
};

// Team queries
export const useTeams = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.teams, params],
    queryFn: () => api.get<PaginatedResponse<Team>>('/api/teams/', { params }).then(res => res.data),
  });
};

// Registration queries
export const useRegistrations = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.registrations, params],
    queryFn: () => api.get<PaginatedResponse<Registration>>(ENDPOINTS.registrations, { params }).then(res => res.data),
  });
};

export const useEventRegistrations = (eventId: number, params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.registrations, 'event', eventId, params],
    queryFn: () => api.get<PaginatedResponse<Registration>>(ENDPOINTS.registrations, { params: { ...params, event: eventId } }).then(res => res.data),
    enabled: !!eventId,
  });
};

// Fixture queries
export const useFixtures = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.fixtures, params],
    queryFn: () => api.get<PaginatedResponse<Fixture>>(ENDPOINTS.fixtures, { params }).then(res => res.data),
  });
};

export const useEventFixtures = (eventId: number, params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.fixtures, 'event', eventId, params],
    queryFn: () => api.get<PaginatedResponse<Fixture>>(ENDPOINTS.eventFixtures(eventId), { params }).then(res => res.data),
    enabled: !!eventId,
  });
};

// Result queries
export const useResults = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.results, params],
    queryFn: () => api.get<PaginatedResponse<Result>>(ENDPOINTS.results, { params }).then(res => res.data),
  });
};

// News queries
export const useNews = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.news, params],
    queryFn: () => api.get<PaginatedResponse<NewsArticle>>(ENDPOINTS.news, { params }).then(res => res.data),
    retry: false,
  });
};

export const usePublicNews = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'news', params],
    queryFn: () => api.get<PaginatedResponse<NewsArticle>>(ENDPOINTS.publicNews, { params }).then(res => res.data),
    retry: false,
  });
};

// Gallery queries
export const useGalleryAlbums = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'gallery-albums', params],
    queryFn: () => api.get<any[]>(ENDPOINTS.galleryAlbums, { params }).then(res => res.data),
    retry: false,
  });
};

export const useGalleryMedia = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'gallery-media', params],
    queryFn: () => api.get<any[]>(ENDPOINTS.galleryMedia, { params }).then(res => res.data),
    retry: false,
  });
};

export const usePublicGalleryMedia = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'gallery-media', params],
    queryFn: () => api.get(ENDPOINTS.galleryMedia, { params: { ...params, visibility: 'public' } }).then(res => {
      // Normalize response to handle both array and paginated responses
      const data = res.data;
      if (Array.isArray(data?.results)) {
        return data.results;
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    }),
    retry: false,
  });
};

export const useMyGalleryMedia = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: [...queryKeys.public, 'gallery-media', 'mine', params],
    queryFn: () => api.get(ENDPOINTS.galleryMedia, { params: { ...params, mine: 1 } }).then(res => {
      // Normalize response to handle both array and paginated responses
      const data = res.data;
      if (Array.isArray(data?.results)) {
        return data.results;
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    }),
    retry: false,
    enabled: !!getStoredToken(),
  });
};

// Mutations
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post(ENDPOINTS.login, credentials).then(res => res.data),
    onSuccess: (data) => {
      const { access, refresh } = data;
      setStoredTokens(access, refresh);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      clearStoredTokens();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// Role application mutations (disabled since endpoints don't exist)
export const useApplyCoach = () => {
  return useMutation({
    mutationFn: (data: FormData | Record<string, any>) => {
      const payload = data instanceof FormData ? data : toFormData(data);
      return api.post(ENDPOINTS.applyCoach, payload).then(res => res.data);
    },
  });
};

export const useApplyOrganizer = () => {
  return useMutation({
    mutationFn: (data: FormData | Record<string, any>) => {
      const payload = data instanceof FormData ? data : toFormData(data);
      return api.post(ENDPOINTS.applyOrganizer, payload).then(res => res.data);
    },
  });
};

export const useApplyAthlete = () => {
  return useMutation({
    mutationFn: (data: FormData | Record<string, any>) => {
      const payload = data instanceof FormData ? data : toFormData(data);
      return api.post(ENDPOINTS.applyAthlete, payload).then(res => res.data);
    },
  });
};

export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get<any>(ENDPOINTS.myApplications).then(res => res.data),
    retry: false,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      password_confirm: string;
      first_name: string;
      last_name: string;
    }) => api.post(ENDPOINTS.register, userData).then(res => res.data),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventData: Partial<Event>) =>
      api.post(ENDPOINTS.events, eventData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...eventData }: Partial<Event> & { id: number }) =>
      api.put(ENDPOINTS.event(id), eventData).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.events, variables.id] });
    },
  });
};

export const useCreateRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (registrationData: Partial<Registration>) =>
      api.post(ENDPOINTS.registrations, registrationData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations });
    },
  });
};

export const useApproveRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (registrationId: number) =>
      api.post(ENDPOINTS.registrationApprove(registrationId)).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations });
    },
  });
};

export const useRejectRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (registrationId: number) =>
      api.post(ENDPOINTS.registrationReject(registrationId)).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations });
    },
  });
};

export const useGenerateFixtures = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventId: number) =>
      api.post(ENDPOINTS.eventGenFixtures(eventId)).then(res => res.data),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.fixtures, 'event', eventId] });
    },
  });
};

export const useCreateResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resultData: Partial<Result>) =>
      api.post(ENDPOINTS.results, resultData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.results });
    },
  });
};

export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...resultData }: Partial<Result> & { id: number }) =>
      api.put(ENDPOINTS.result(id), resultData).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.results });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.results, variables.id] });
    },
  });
};

// Helper functions
export const setStoredTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('timely_access_token', accessToken);
  localStorage.setItem('timely_refresh_token', refreshToken);
};

export const clearStoredTokens = (): void => {
  localStorage.removeItem('timely_access_token');
  localStorage.removeItem('timely_refresh_token');
};

// Missing API functions that are referenced in components
export const useGetAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        const response = await api.get('/announcements/');
        return response.data;
      } catch (error) {
        // Return empty array if endpoint doesn't exist yet
        console.warn('Announcements endpoint not available:', error);
        return [];
      }
    },
    retry: false,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ userId, currentPassword, newPassword }: {
      userId: number;
      currentPassword: string;
      newPassword: string;
    }) => {
      return api.post(ENDPOINTS.changePassword(userId), {
        current_password: currentPassword,
        new_password: newPassword,
      }).then(res => res.data);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, profileData }: {
      userId: number;
      profileData: Partial<User>;
    }) => {
      return api.patch(`/users/${userId}/`, profileData).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get(ENDPOINTS.notifications).then(res => {
      // Normalize response to handle both array and paginated responses
      const data = res.data;
      if (Array.isArray(data?.results)) {
        return data.results;
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    }),
    retry: false,
  });
};

export const useGetUnreadNotificationsCount = () => {
  const { isAuthenticated } = useAuth();
  const token = getStoredToken();
  
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        // Backend uses underscore not dash: /api/notifications/unread_count/
        const response = await api.get(`${ENDPOINTS.notifications}unread_count/`);
        return response.data.count || 0;
      } catch (error) {
        // Fallback: fetch notifications and count unread client-side
        try {
          const list = await api.get(ENDPOINTS.notifications, { params: { read: 'false' } });
          const data = list.data;
          const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          return items.length;
        } catch (e) {
          console.warn('Notifications endpoint not available:', e);
          return 0;
        }
      }
    },
    enabled: isAuthenticated && !!token,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: number) => {
      return api.patch(`${ENDPOINTS.notifications}${notificationId}/mark-read/`).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Internal helper
function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(`${key}[]`, v as any));
    } else {
      fd.append(key, value as any);
    }
  });
  return fd;
}
