import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email-ul este obligatoriu' })
  .email({ message: 'Adresa de email nu este validă' })
  .max(255, { message: 'Email-ul trebuie să aibă maxim 255 caractere' });

// Strong password validation schema
export const passwordSchema = z
  .string()
  .min(8, { message: 'Parola trebuie să aibă cel puțin 8 caractere' })
  .max(72, { message: 'Parola trebuie să aibă maxim 72 caractere' })
  .regex(/[a-z]/, { message: 'Parola trebuie să conțină cel puțin o literă mică' })
  .regex(/[A-Z]/, { message: 'Parola trebuie să conțină cel puțin o literă mare' })
  .regex(/[0-9]/, { message: 'Parola trebuie să conțină cel puțin o cifră' })
  .regex(/[^a-zA-Z0-9]/, { message: 'Parola trebuie să conțină cel puțin un caracter special (!@#$%^&*)' });

// Full name validation schema
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Numele trebuie să aibă cel puțin 2 caractere' })
  .max(100, { message: 'Numele trebuie să aibă maxim 100 caractere' })
  .regex(/^[a-zA-ZăâîșțĂÂÎȘȚ\s'-]+$/, { message: 'Numele poate conține doar litere, spații și cratimă' });

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Parola este obligatorie' }),
});

// Signup form schema
export const signupSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Confirmarea parolei este obligatorie' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu se potrivesc',
  path: ['confirmPassword'],
});

// Reset password form schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Contact form schema
export const contactSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, { message: 'Mesajul trebuie să aibă cel puțin 10 caractere' })
    .max(1000, { message: 'Mesajul trebuie să aibă maxim 1000 caractere' }),
});

// Booking form schema
export const bookingSchema = z.object({
  participants: z.number().int().min(1).max(50),
  specialRequests: z.string().max(500).optional(),
  bookingDate: z.date(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
