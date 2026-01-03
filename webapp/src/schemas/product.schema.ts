import { z } from 'zod';

export const productCreateSchema = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .min(1, { message: 'El código es obligatorio' })
    .max(64, { message: 'El código no puede superar los 64 caracteres' }),
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(1, { message: 'El nombre es obligatorio' })
    .max(200, { message: 'El nombre no puede superar los 200 caracteres' }),
  description: z
    .string()
    .max(2000, { message: 'La descripción no puede superar los 2000 caracteres' })
    .optional(),
  price: z
    .number({ required_error: 'El precio es obligatorio' })
    .positive({ message: 'El precio debe ser mayor a 0' })
    .max(100_000_000, { message: 'El precio es demasiado alto' }),
  currency: z
    .string()
    .length(3, { message: 'La moneda debe tener 3 caracteres (ISO)' })
    .default('ARS'),
  category: z.string().max(100, { message: 'La categoría no puede superar los 100 caracteres' }).optional(),
  isActive: z.boolean().default(true),
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
