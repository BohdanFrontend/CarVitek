import { z } from "zod"

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "validation.enterEmail")
  .pipe(z.email("validation.invalidEmail"))

const newPassword = z
  .string()
  .min(8, "validation.passwordMin")
  .max(72, "validation.passwordMax")
  .regex(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/, "validation.passwordLetter")
  .regex(/\d/, "validation.passwordDigit")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "validation.enterPassword"),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "validation.nameMin").max(60, "validation.nameMax"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordsDontMatch",
  })

export const forgotPasswordSchema = z.object({ email })

export const updatePasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordsDontMatch",
  })

/** Зміна пароля в налаштуваннях: поточний + новий (ті самі правила, що й updatePasswordSchema). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.enterPassword"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordsDontMatch",
  })

export const fullNameSchema = z.string().trim().min(2, "validation.nameMin").max(60, "validation.nameMax")
