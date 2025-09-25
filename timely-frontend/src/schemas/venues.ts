import { z } from 'zod';

export const venueSchema = z.object({
  name: z.string().min(1, 'Venue name is required').max(200, 'Name must be less than 200 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  postal_code: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be less than 20 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must be less than 100 characters'),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  facilities: z.array(z.string()).default([]),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

export const venueCreateSchema = venueSchema;
export const venueUpdateSchema = venueSchema.partial();

export type VenueFormData = z.infer<typeof venueSchema>;
export type VenueCreateData = z.infer<typeof venueCreateSchema>;
export type VenueUpdateData = z.infer<typeof venueUpdateSchema>;
