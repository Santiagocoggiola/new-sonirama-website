import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Formato de email inválido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  remember: z.boolean(),
});

export type LoginFormValues = z.output<typeof loginSchema>;

export const passwordResetStartSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Formato de email inválido' }),
});

export type PasswordResetStartFormValues = z.infer<typeof passwordResetStartSchema>;

export const passwordResetConfirmSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Formato de email inválido' }),
  code: z
    .string()
    .min(1, { message: 'El código es obligatorio' })
    .length(6, { message: 'El código debe tener 6 caracteres' }),
});

export type PasswordResetConfirmFormValues = z.infer<typeof passwordResetConfirmSchema>;
