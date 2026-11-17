"use client"

import { Check, Fuel, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { cn } from "cn"

import { deleteFuelRecord } from "@/app/(app)/fuel/actions"
import { cardClass, primaryButtonClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { RowActions } from "@/components/common/row-actions"
import { useFormat } from "@/i18n/format-client"
import type { ConsumptionPeriod } from "@/lib/fuel/consumption"
import type { FuelRow } from "@/lib/fuel/queries"
import { ConsumptionCard, type ConsumptionStats } from "./consumption-card"
import { FuelRecordDialog, type EditableFuelRecord } from "./fuel-record-dialog"

type Props = {
  carId: string
  carLabel: string
  unit: "L" | "kWh"
  currentMileage: number
  rows: FuelRow[]
  total: number
  hasSegments: boolean
  period: ConsumptionPeriod
  stats: ConsumptionStats
  history: { id: string; date: string; mileage: number }[]
  /** «Load more» для мобільного списку (серверне посилання) */
  loadMore: React.ReactNode
  /** Посилання «Load more» у підвалі таблиці (null — усе показано) */
  nextLimitHref: string | null
}


/** Квадрат «Full»: лише для показу, не інтерактивний. */
function FullMark({ full, electric }: { full: boolean; electric: boolean }) {
  const t = useTranslations("fuel")
  const label = full ? (electric ? t("fullCharge") : t("fullTank")) : t("partial")
  return full ? (
    <span role="img" aria-label={label} className="inline-grid size-[22px] place-items-center rounded-[6px] bg-[#1766F2] text-white">
      <Check className="size-4" strokeWidth={3} aria-hidden />
    </span>
  ) : (
    <span role="img" aria-label={label} className="inline-block size-[22px] rounded-[6px] border-2 border-[#CBD5E1] bg-white" />
  )
}

/**
 * Журнал заправок за макетом «10. Fuel Log».
 * Десктоп: таблиця (~55%) і картка графіка (~45%) поруч, однакової висоти.
 * Мобільний: спочатку графік, під ним картки заправок.
 */
export function FuelLog({
  carId,
  carLabel,
  unit,
  currentMileage,
  rows,
  total,
  hasSegments,
  period,
  stats,
  history,
  loadMore,
  nextLimitHref,
}: Props) {
  const t = useTranslations("fuel")
  const tc = useTranslations("common")
  const f = useFormat()
  // 45 → «45», 46.5 → «46.5» / «46,5»
  const amount = (n: number) => f.number(n, Number.isInteger(n) ? 0 : n * 10 === Math.round(n * 10) ? 1 : 2)
  const electric = unit === "kWh"
  // ключ перемонтовує діалог, щоб форма щоразу починалась з потрібних значень
  const [dialog, setDialog] = useState<{ key: number; record: EditableFuelRecord | null } | null>(null)
  const open = (record: EditableFuelRecord | null) => setDialog({ key: Date.now(), record })

  const addButton = (
    <button type="button" onClick={() => open(null)} className={cn(primaryButtonClass, "lg:h-12 lg:rounded-[14px] lg:px-6")}>
      <Plus className="size-5" aria-hidden />
      {electric ? t("addElectric") : t("add")}
    </button>
  )

  const actions = (r: FuelRow) => (
    <RowActions
      label={t(electric ? "actionsForElectric" : "actionsFor", { date: f.date(r.filled_at) })}
      onEdit={() => open(r)}
      onDelete={() => deleteFuelRecord(r.id)}
      deleteTitle={t(electric ? "deleteTitleElectric" : "deleteTitle", { date: f.date(r.filled_at) })}
      deleteDescription={t("deleteText")}
      deletedMessage={electric ? t("deletedElectric") : t("deleted")}
    />
  )

  const th = "h-14 px-3 text-sm font-bold whitespace-nowrap text-[#0B1220] first:pl-6 last:pr-3"
  const td = "h-16 px-3 align-middle whitespace-nowrap tabular-nums first:pl-6 last:pr-3"
  const per100 = t("per100", { unit: f.units[unit] })

  return (
    <div>
      <PageHeader title={electric ? t("titleElectric") : t("title")} description={carLabel} action={addButton} />

      {total === 0 ? (
        <EmptyState
          icon={Fuel}
          title={electric ? t("emptyTitleElectric") : t("emptyTitle")}
          description={t("emptyText")}
          action={addButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:items-stretch">
          {/* Графік: на мобільному — першим, на десктопі — праворуч */}
          <div className="min-w-0 lg:order-2">
            <ConsumptionCard unit={unit} period={period} stats={stats} hasSegments={hasSegments} onAdd={() => open(null)} />
          </div>

          {/* Десктоп: таблиця */}
          <section
            aria-label={electric ? t("recordsElectric") : t("records")}
            className="hidden min-w-0 flex-col rounded-[20px] border border-[#E5E9F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] lg:order-1 lg:flex"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] text-[#0B1220]">
                <thead className="border-b border-[#EEF2F7]">
                  <tr>
                    <th scope="col" className={`${th} text-left`}>{t("col.date")}</th>
                    <th scope="col" className={`${th} text-right`}>{t("col.mileage")}</th>
                    <th scope="col" className={`${th} text-right`}>{electric ? t("col.kwh") : t("col.liters")}</th>
                    <th scope="col" className={`${th} text-right`}>{t("col.price")}</th>
                    <th scope="col" className={`${th} text-center`}>{t("col.full")}</th>
                    <th scope="col" className={`${th} text-right`}>{per100}</th>
                    <th scope="col" className={`${th} w-12`}><span className="sr-only">{tc("actions")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {rows.map((r, i) => (
                    <tr key={r.id} className={i === 0 ? "bg-[#F5F8FF]" : "hover:bg-[#FAFBFD]"}>
                      <td className={td}>{f.date(r.filled_at)}</td>
                      <td className={`${td} text-right`}>{f.km(r.mileage)}</td>
                      <td className={`${td} text-right`}>{amount(r.liters)}</td>
                      <td className={`${td} text-right`}>
                        <span className="block font-semibold">{f.money(r.total_cost)}</span>
                        <span className="block text-xs text-[#5B6475]">
                          {f.money(r.price_per_liter)}/{f.units[unit]}
                        </span>
                      </td>
                      <td className={`${td} text-center`}>
                        <FullMark full={r.is_full_tank} electric={electric} />
                      </td>
                      <td className={`${td} text-right font-semibold`}>
                        {r.consumption != null ? f.number(r.consumption, 1) : <span className="font-normal text-[#8A93A3]">—</span>}
                      </td>
                      <td className={`${td} w-12`}>{actions(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-auto border-t border-[#EEF2F7] px-6 py-4 text-sm text-[#5B6475]">
              {t("showing", { shown: rows.length, total })}
              {nextLimitHref && (
                <>
                  {" · "}
                  <Link href={nextLimitHref} scroll={false} className="rounded font-semibold text-[#1766F2] outline-none hover:underline focus-visible:ring-3 focus-visible:ring-[#1766F2]/30">
                    {tc("loadMore")}
                  </Link>
                </>
              )}
            </p>
          </section>

          {/* Мобільний: картки */}
          <div className="min-w-0 lg:hidden">
            <ul className="grid grid-cols-1 gap-3">
              {rows.map((r) => (
                <li key={r.id} className={cn(cardClass, "p-4")}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0B1220] tabular-nums">
                        {amount(r.liters)} {f.units[unit]} · {f.money(r.total_cost)}
                      </p>
                      <p className="mt-1 text-sm break-words text-[#5B6475]">
                        {f.date(r.filled_at)} · {f.km(r.mileage)}
                        {r.station && <> · {r.station}</>}
                      </p>
                    </div>
                    <div className="-mt-1 -mr-1.5">{actions(r)}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-[#5B6475]">
                      <FullMark full={r.is_full_tank} electric={electric} />
                      {f.money(r.price_per_liter)}/{f.units[unit]}
                    </span>
                    {r.consumption != null && (
                      <span className="font-semibold text-[#0B1220] tabular-nums">
                        {f.number(r.consumption, 1)} {per100}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {loadMore}
          </div>
        </div>
      )}

      {dialog && (
        <FuelRecordDialog
          key={dialog.key}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          carId={carId}
          unit={unit}
          currentMileage={currentMileage}
          history={history}
          record={dialog.record}
        />
      )}
    </div>
  )
}
