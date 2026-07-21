import { z } from 'zod';

export const dashboardSchema = z
  .object({
    query: z.object({}).strict().optional(),
  })
  .passthrough();
