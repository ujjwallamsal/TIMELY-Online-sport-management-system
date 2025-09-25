import { z } from 'zod';

export const resultSchema = z.object({
  fixture: z.number().min(1, 'Fixture is required'),
  home_score: z.number().min(0, 'Home score must be non-negative').optional(),
  away_score: z.number().min(0, 'Away score must be non-negative').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine((data) => {
  // At least one score must be provided
  return data.home_score !== undefined || data.away_score !== undefined;
}, {
  message: "At least one score must be provided",
  path: ["home_score"],
});

export const resultCreateSchema = resultSchema;
export const resultUpdateSchema = resultSchema.partial();

export type ResultFormData = z.infer<typeof resultSchema>;
export type ResultCreateData = z.infer<typeof resultCreateSchema>;
export type ResultUpdateData = z.infer<typeof resultUpdateSchema>;
