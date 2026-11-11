import { CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "cn"

/** Повідомлення над формою: помилка або успіх. */
export function FormAlert({
  status,
  message,
}: {
  status: "error" | "success"
  message?: string
}) {
  if (!message) return null
  const Icon = status === "error" ? CircleAlert : CircleCheck

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        status === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-emerald-600/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  )
}
