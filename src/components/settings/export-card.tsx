"use client"

import { Download, FileText, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { primaryButtonClass } from "@/components/common/buttons"
import { inputClass } from "@/components/forms/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { settingsCardClass, settingsLabelClass, settingsTitleClass } from "./styles"

export type ExportCar = { id: string; label: string }

/** Ім'я файлу з Content-Disposition (filename*=UTF-8''… або filename="…"). */
function fileName(header: string | null) {
  const star = header?.match(/filename\*=UTF-8''([^;]+)/i)
  if (star) return decodeURIComponent(star[1])
  return header?.match(/filename="?([^";]+)"?/i)?.[1] ?? "carvitex-service-history.pdf"
}

/** Експорт історії обслуговування вибраного авто в PDF. */
export function ExportCard({ cars, activeCarId }: { cars: ExportCar[]; activeCarId: string | null }) {
  const t = useTranslations("settings.export")
  const id = useId()
  const [carId, setCarId] = useState(activeCarId ?? cars[0]?.id ?? null)
  const [busy, setBusy] = useState(false)

  const download = async () => {
    if (!carId || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/export/service-history?carId=${encodeURIComponent(carId)}`)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName(res.headers.get("Content-Disposition"))
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast.success(t("done"))
    } catch {
      toast.error(t("failed"))
    } finally {
      setBusy(false)
    }
  }

  const items = cars.map((c) => ({ value: c.id, label: c.label }))

  return (
    <section aria-labelledby="export-title" className={settingsCardClass}>
      <h2 id="export-title" className={settingsTitleClass}>
        {t("title")}
      </h2>

      <div className="mt-5 flex items-start gap-3.5">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[#FDECEC] text-[#DC2626]">
          <FileText className="size-5.5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[#0B1220]">{t("serviceHistory")}</p>
          <p className="text-sm text-[#5B6475]">{t("text")}</p>
        </div>
      </div>

      {cars.length === 0 ? (
        <p className="mt-4 text-sm text-[#5B6475]">{t("noCars")}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <label htmlFor={id} className={settingsLabelClass}>
              {t("car")}
            </label>
            <Select items={items} value={carId} onValueChange={(v) => v && setCarId(v)} disabled={busy}>
              <SelectTrigger id={id} className={cn(inputClass, "w-full pr-3 pl-4 data-[size=default]:h-12")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {items.map((i) => (
                  <SelectItem key={i.value} value={i.value} className="h-10 text-[15px]">
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={busy || !carId}
            aria-busy={busy || undefined}
            className={cn(primaryButtonClass, "h-12 w-full text-base sm:w-auto sm:justify-self-start")}
          >
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Download className="size-5" aria-hidden />}
            {busy ? t("exporting") : t("button")}
          </button>
        </div>
      )}
    </section>
  )
}
