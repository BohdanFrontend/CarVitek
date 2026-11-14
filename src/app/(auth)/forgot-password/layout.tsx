import type { Metadata } from "next"
import type { ReactNode } from "react"

// Сторінка — клієнтський компонент, тому metadata задаємо тут
export const metadata: Metadata = { title: "Reset password" }

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children
}
