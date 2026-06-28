import { z } from 'zod';

export const createPackageSchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().regex(/^[9][6-9]\d{8}$/, 'Invalid Nepal phone number'),
  recipientAddress: z.string().min(5).max(200),
  weight: z.number().positive(),
  description: z.string().max(500).optional(),
});

export const updatePackageStatusSchema = z.object({
  status: z.enum(['pending', 'picked_up', 'in_transit', 'delivered', 'failed']),
  notes: z.string().max(200).optional(),
});
