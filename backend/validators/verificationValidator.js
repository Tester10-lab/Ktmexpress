import { z } from 'zod';
import { PACKAGE_STATUSES } from '../constants/packageStatus.js';
import { PAYMENT_METHODS } from '../constants/paymentMethod.js';

export const saveDraftSchema = z.object({
  status: z.enum(PACKAGE_STATUSES).optional(),
  amount: z.number().nonnegative('COD Amount cannot be negative.').optional(),
  deliveryCharge: z.number().nonnegative('Delivery charge cannot be negative.').optional(),
  comments: z.string().max(1000).optional(),
  receiverName: z.string().min(2).max(100).optional(),
  receiverPhone: z.string().optional(),
  deliveryDate: z.string().optional(),
  holdReason: z.string().max(500).optional(),
  rejectReason: z.string().max(500).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  collectionType: z.string().max(100).optional(),
});

export const verifyActionSchema = z.object({
  version: z.number().int().nonnegative('Version is required for optimistic concurrency check.'),
  status: z.enum(PACKAGE_STATUSES),
  amount: z.number().nonnegative('COD Amount cannot be negative.'),
  deliveryCharge: z.number().nonnegative('Delivery charge cannot be negative.').optional(),
  comments: z.string().max(1000).optional(),
  receiverName: z.string().min(2).max(100).optional(),
  receiverPhone: z.string().optional(),
  deliveryDate: z.string().optional(),
  holdReason: z.string().max(500).optional(),
  rejectReason: z.string().max(500).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  collectionType: z.string().max(100).optional(),
  reason: z.enum([
    'Customer unavailable',
    'Wrong amount entered',
    'Wrong delivery status',
    'Returned partial order',
    'Duplicate submission',
    'System correction',
    'Other'
  ]),
  customRemarks: z.string().max(1000).optional(),
});

export const bulkVerifySchema = z.object({
  packageIds: z.array(z.string()).nonempty('Package IDs array cannot be empty.'),
});
