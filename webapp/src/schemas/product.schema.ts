import { z } from 'zod';

export const productCreateSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'El código es obligatorio' })
    .max(50, { message: 'El código no puede superar los 50 caracteres' }),
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(200, { message: 'El nombre no puede superar los 200 caracteres' }),
  description: z
    .string()
    .max(2000, { message: 'La descripción no puede superar los 2000 caracteres' })
    .optional(),
  price: z
    .number()
    .min(0, { message: 'El precio debe ser mayor o igual a 0' }),
  currency: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean(),
});

export type ProductCreateFormValues = z.output<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.omit({ code: true });

export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>;

export const bulkDiscountSchema = z.object({
  minQuantity: z
    .number()
    .int({ message: 'La cantidad debe ser un número entero' })
    .min(1, { message: 'La cantidad mínima debe ser al menos 1' }),
  discountPercent: z
    .number()
    .min(0, { message: 'El descuento debe ser mayor o igual a 0' })
    .max(100, { message: 'El descuento no puede superar el 100%' }),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type BulkDiscountFormValues = z.infer<typeof bulkDiscountSchema>;
