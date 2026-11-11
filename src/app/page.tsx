import { redirect } from "next/navigation"

// Гість потрапить на /login завдяки proxy.ts, увійшовший — на дашборд
export default function Home() {
  redirect("/dashboard")
}
