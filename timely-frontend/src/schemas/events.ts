import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  sport: z.number().min(1, 'Please select a sport'),
  venue: z.number().min(1, 'Please select a venue'),
  start_datetime: z.string().min(1, 'Start date is required'),
  end_datetime: z.string().min(1, 'End date is required'),
  fee_cents: z.number().min(0, 'Registration fee must be positive').optional(),
  capacity: z.number().min(1, 'Maximum participants must be at least 1').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  location: z.string().optional(),
  registration_open_at: z.string().optional(),
  registration_close_at: z.string().optional(),
}).refine((data) => {
  const startDate = new Date(data.start_datetime);
  const endDate = new Date(data.end_datetime);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["end_datetime"],
});

export const eventCreateSchema = eventSchema.omit({ status: true });
export const eventUpdateSchema = eventSchema.partial();

export type EventFormData = z.infer<typeof eventSchema>;
export type EventCreateData = z.infer<typeof eventCreateSchema>;
export type EventUpdateData = z.infer<typeof eventUpdateSchema>;
