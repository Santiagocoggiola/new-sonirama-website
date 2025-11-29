import { z } from 'zod';

const orderStatusEnum = z.enum([
  'PendingApproval',
  'Approved',
  'Rejected',
  'ModificationPending',
  'Confirmed',
  'ReadyForPickup',
  'Completed',
  'Cancelled',
]);

export const orderConfirmSchema = z.object({
  note: z
    .string()
    .max(500, { message: 'La nota no puede superar los 500 caracteres' })
    .optional(),
});

export type OrderConfirmFormValues = z.infer<typeof orderConfirmSchema>;

export const orderCancelSchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'El motivo es obligatorio' })
    .max(500, { message: 'El motivo no puede superar los 500 caracteres' }),
});

export type OrderCancelFormValues = z.infer<typeof orderCancelSchema>;

export const orderApproveSchema = z.object({
  adminNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden superar los 500 caracteres' })
    .optional(),
});

export type OrderApproveFormValues = z.infer<typeof orderApproveSchema>;

export const orderRejectSchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'El motivo es obligatorio' })
    .max(500, { message: 'El motivo no puede superar los 500 caracteres' }),
});

export type OrderRejectFormValues = z.infer<typeof orderRejectSchema>;

export const orderReadySchema = z.object({
  readyNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden superar los 500 caracteres' })
    .optional(),
});

export type OrderReadyFormValues = z.infer<typeof orderReadySchema>;

export const orderCompleteSchema = z.object({
  completionNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden superar los 500 caracteres' })
    .optional(),
});

export type OrderCompleteFormValues = z.infer<typeof orderCompleteSchema>;

export const orderModifyItemSchema = z.object({
  productId: z.string().uuid({ message: 'ID de producto inválido' }),
  quantity: z
    .number()
    .int({ message: 'La cantidad debe ser un número entero' })
    .min(1, { message: 'La cantidad debe ser al menos 1' }),
});

export const orderModifySchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'El motivo es obligatorio' })
    .max(500, { message: 'El motivo no puede superar los 500 caracteres' }),
  items: z.array(orderModifyItemSchema).min(1, { message: 'Debe incluir al menos un ítem' }),
  adminNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden superar los 500 caracteres' })
    .optional(),
});

export type OrderModifyFormValues = z.infer<typeof orderModifySchema>;

export const orderListFiltersSchema = z.object({
  query: z.string().optional(),
  status: orderStatusEnum.optional(),
  createdFromUtc: z.string().optional(),
  createdToUtc: z.string().optional(),
  sortBy: z.enum(['CreatedAt', 'Number', 'Status', 'Total']).default('CreatedAt'),
  sortDir: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type OrderListFiltersFormValues = z.infer<typeof orderListFiltersSchema>;
