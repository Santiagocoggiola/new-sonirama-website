import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
  slug: z
    .string()
    .min(1, { message: 'El slug es obligatorio' })
    .max(100, { message: 'El slug no puede superar los 100 caracteres' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'El slug solo puede contener letras minúsculas, números y guiones',
    }),
  description: z
    .string()
    .max(500, { message: 'La descripción no puede superar los 500 caracteres' })
    .optional(),
  isActive: z.boolean(),
  parentIds: z.array(z.string().uuid()).optional(),
});

// Use z.output for the form values type to get the type after defaults are applied
export type CategoryCreateFormValues = z.output<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema;

export type CategoryUpdateFormValues = z.infer<typeof categoryUpdateSchema>;

export const categoryListFiltersSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['Name', 'Slug', 'CreatedAt']).default('Name'),
  sortDir: z.enum(['ASC', 'DESC']).default('ASC'),
});

export type CategoryListFiltersFormValues = z.infer<typeof categoryListFiltersSchema>;
