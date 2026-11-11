import { z } from "zod"

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Введіть email")
  .pipe(z.email("Некоректний email"))

const newPassword = z
  .string()
  .min(8, "Мінімум 8 символів")
  .max(72, "Максимум 72 символи")
  .regex(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/, "Має містити хоча б одну літеру")
  .regex(/\d/, "Має містити хоча б одну цифру")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Введіть пароль"),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Мінімум 2 символи").max(60, "Задовге ім'я"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Паролі не збігаються",
  })

export const forgotPasswordSchema = z.object({ email })

export const updatePasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Паролі не збігаються",
  })
