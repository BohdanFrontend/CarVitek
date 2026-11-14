import { z } from "zod"

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .pipe(z.email("Enter a valid email"))

const newPassword = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/, "Must contain at least one letter")
  .regex(/\d/, "Must contain at least one digit")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "At least 2 characters").max(60, "Name is too long"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })

export const forgotPasswordSchema = z.object({ email })

export const updatePasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
