/**
 * Basic API types for the Timely application
 */

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Event {
  id: number;
  name: string;
  description: string;
  sport: number;
  sport_name?: string;
  venue: number | null;
  venue_name?: string;
  start_datetime: string;
  end_datetime: string | null;
  fee_cents: number | null;
  capacity: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  visibility: 'PUBLIC' | 'PRIVATE';
  location?: string;
  registration_open_at?: string | null;
  registration_close_at?: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: number;
  event: number;
  event_name?: string;
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
  event_name?: string;
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

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SPECTATOR' | 'ATHLETE' | 'COACH' | 'ORGANIZER' | 'ADMIN';
  is_active: boolean;
  date_joined: string;
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

export interface VenueSlot {
  id: number;
  venue: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
  read_at: string | null;
}

export interface Counts {
  users: number;
  events: number;
  registrations: number;
  fixtures: number;
  results: number;
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}
