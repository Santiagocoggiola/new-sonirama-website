import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
  email: z
    .string()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Formato de email inválido' })
    .max(255, { message: 'El email no puede superar los 255 caracteres' }),
  subject: z
    .string()
    .max(200, { message: 'El asunto no puede superar los 200 caracteres' })
    .optional(),
  message: z
    .string()
    .min(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
    .max(5000, { message: 'El mensaje no puede superar los 5000 caracteres' }),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
