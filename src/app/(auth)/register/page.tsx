import type { Metadata } from "next"

import { AuthHeader } from "@/components/auth/auth-header"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Реєстрація" }

export default function RegisterPage() {
  return (
    <>
      <AuthHeader
        title="Створіть акаунт"
        subtitle="Уся історія обслуговування авто в одному місці"
      />
      <RegisterForm />
    </>
  )
}
