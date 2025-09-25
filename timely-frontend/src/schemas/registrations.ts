import { z } from 'zod';

export const registrationSchema = z.object({
  event: z.number().min(1, 'Event is required'),
  team: z.number().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const registrationCreateSchema = registrationSchema;

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type RegistrationCreateData = z.infer<typeof registrationCreateSchema>;
