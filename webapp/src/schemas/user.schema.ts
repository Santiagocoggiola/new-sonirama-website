import { z } from 'zod';

const userRoleEnum = z.enum(['ADMIN', 'USER']);

export const userCreateSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Formato de email inválido' }),
  firstName: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
  lastName: z
    .string()
    .min(1, { message: 'El apellido es obligatorio' })
    .max(100, { message: 'El apellido no puede superar los 100 caracteres' }),
  phoneNumber: z
    .string()
    .max(30, { message: 'El teléfono no puede superar los 30 caracteres' })
    .optional(),
  role: userRoleEnum.default('USER'),
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
  lastName: z
    .string()
    .min(1, { message: 'El apellido es obligatorio' })
    .max(100, { message: 'El apellido no puede superar los 100 caracteres' }),
  phoneNumber: z
    .string()
    .max(30, { message: 'El teléfono no puede superar los 30 caracteres' })
    .optional(),
  role: userRoleEnum,
  isActive: z.boolean(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

export const userListFiltersSchema = z.object({
  query: z.string().optional(),
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['Email', 'FirstName', 'LastName', 'CreatedAt']).default('CreatedAt'),
  sortDir: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type UserListFiltersFormValues = z.infer<typeof userListFiltersSchema>;

// Profile update schema (self-service)
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
  lastName: z
    .string()
    .min(1, { message: 'El apellido es obligatorio' })
    .max(100, { message: 'El apellido no puede superar los 100 caracteres' }),
  phoneNumber: z
    .string()
    .max(30, { message: 'El teléfono no puede superar los 30 caracteres' })
    .nullable()
    .optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'La contraseña actual es obligatoria' }),
    newPassword: z
      .string()
      .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
      .regex(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
      .regex(/[0-9]/, { message: 'Debe contener al menos un número' }),
    confirmNewPassword: z
      .string()
      .min(1, { message: 'Confirma tu nueva contraseña' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

