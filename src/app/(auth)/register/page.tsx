import type { Metadata } from "next"

import { AuthHeader } from "@/components/auth/auth-header"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Sign up" }

export default function RegisterPage() {
  return (
    <>
      <AuthHeader
        title="Create an account"
        subtitle="Your car's full service history in one place"
      />
      <RegisterForm />
    </>
  )
}
