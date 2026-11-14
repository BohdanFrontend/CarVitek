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
        "flex items-start gap-3 rounded-[12px] border px-4 py-3.5 text-[15px] leading-snug",
        status === "error"
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-emerald-600/20 bg-emerald-50 text-emerald-800"
      )}
    >
      <Icon className="mt-px size-5 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  )
}
