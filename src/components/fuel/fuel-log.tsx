"use client"

import { Check, Fuel, Plus } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import { deleteFuelRecord } from "@/app/(app)/fuel/actions"
import { cardClass, primaryButtonClass } from "@/components/common/buttons"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { RowActions } from "@/components/common/row-actions"
import { formatDate } from "@/lib/dates"
import { formatKm, formatMoney } from "@/lib/format"
import type { FuelRow } from "@/lib/fuel/queries"
import { ConsumptionChart } from "./consumption-chart"
import { FuelRecordDialog, type EditableFuelRecord } from "./fuel-record-dialog"

type Props = {
  carId: string
  carLabel: string
  unit: "L" | "kWh"
  currentMileage: number
  rows: FuelRow[]
  total: number
  average: number | null
  chart: { date: string; value: number }[]
  history: { id: string; date: string; mileage: number }[]
  /** «Load more» (серверне посилання) */
  loadMore: React.ReactNode
}

const amount = (n: number) => n.toFixed(2).replace(/\.?0+$/, "")

/** Журнал заправок: графік витрати, список і діалог додавання / редагування. */
export function FuelLog({ carId, carLabel, unit, currentMileage, rows, total, average, chart, history, loadMore }: Props) {
  const electric = unit === "kWh"
  // ключ перемонтовує діалог, щоб форма щоразу починалась з потрібних значень
  const [dialog, setDialog] = useState<{ key: number; record: EditableFuelRecord | null } | null>(null)
  const open = (record: EditableFuelRecord | null) => setDialog({ key: Date.now(), record })

  const addButton = (
    <button type="button" onClick={() => open(null)} className={primaryButtonClass}>
      <Plus className="size-5" aria-hidden />
      {electric ? "Add charging" : "Add refueling"}
    </button>
  )

  const actions = (r: FuelRow) => (
    <RowActions
      label={`Actions for ${electric ? "charging" : "refueling"} on ${formatDate(r.filled_at)}`}
      onEdit={() => open(r)}
      onDelete={() => deleteFuelRecord(r.id)}
      deleteTitle={`Delete ${electric ? "charging" : "refueling"} from ${formatDate(r.filled_at)}?`}
      deleteDescription="This record and its mileage reading will be permanently deleted. Consumption will be recalculated."
      deletedMessage={electric ? "Charging deleted" : "Refueling deleted"}
    />
  )

  const th = "px-3 py-3 text-left text-[13px] font-semibold text-[#5B6475] first:pl-6 last:pr-4"
  const td = "px-3 py-3.5 align-middle whitespace-nowrap first:pl-6 last:pr-4"
  const per100 = `${unit}/100 km`

  return (
    <div>
      <PageHeader title={electric ? "Charging Log" : "Fuel Log"} description={carLabel} action={addButton} />

      {/* Картка витрати */}
      <section aria-labelledby="consumption-title" className={cn(cardClass, "mb-5 p-5 lg:mb-6 lg:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="consumption-title" className="text-base font-bold text-[#0B1220] lg:text-[17px]">
              {electric ? "Energy consumption" : "Fuel consumption"}, {per100}
            </h2>
            <p className="mt-1 text-[32px] leading-tight font-extrabold tracking-[-0.02em] text-[#0B1220]">
              {average != null ? average.toFixed(1) : "—"}
              <span className="ml-1.5 text-lg font-semibold">{per100}</span>
            </p>
          </div>
          <p className="text-sm text-[#5B6475]">
            Average for {chart.length} full-to-full {chart.length === 1 ? "segment" : "segments"}
          </p>
        </div>
        {chart.length >= 2 ? (
          <>
            <div className="mt-4">
              <ConsumptionChart data={chart} unit={unit} />
            </div>
            <p className="sr-only">
              Consumption by segment: {chart.map((c) => `${formatDate(c.date)} ${c.value} ${per100}`).join("; ")}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#5B6475]">
            Add at least {chart.length === 1 ? "one more" : "two"} {electric ? "full charges" : "full-tank refuelings"} to
            see the consumption chart.
          </p>
        )}
      </section>

      {total === 0 ? (
        <EmptyState
          icon={Fuel}
          title={electric ? "No charging records yet" : "No refuelings yet"}
          description="Log every refueling to track consumption and fuel costs"
          action={addButton}
        />
      ) : (
        <>
          {/* Десктоп */}
          <div className={cn(cardClass, "hidden overflow-x-auto lg:block")}>
            <table className="w-full min-w-[880px] text-[15px] text-[#0B1220]">
              <thead className="border-b border-[#E5E9F0]">
                <tr>
                  <th scope="col" className={th}>Date</th>
                  <th scope="col" className={th}>Mileage</th>
                  <th scope="col" className={`${th} text-right`}>{electric ? "kWh" : "Liters"}</th>
                  <th scope="col" className={`${th} text-right`}>Price/{unit}</th>
                  <th scope="col" className={`${th} text-right`}>Total</th>
                  <th scope="col" className={`${th} text-center`}>{electric ? "Full" : "Full tank"}</th>
                  <th scope="col" className={th}>Station</th>
                  <th scope="col" className={`${th} text-right`}>{per100}</th>
                  <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F6]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFBFD]">
                    <td className={td}>{formatDate(r.filled_at)}</td>
                    <td className={td}>{formatKm(r.mileage)}</td>
                    <td className={`${td} text-right`}>{amount(r.liters)}</td>
                    <td className={`${td} text-right`}>{formatMoney(r.price_per_liter)}</td>
                    <td className={`${td} text-right font-semibold`}>{formatMoney(r.total_cost)}</td>
                    <td className={`${td} text-center`}>
                      {r.is_full_tank ? (
                        <Check className="mx-auto size-5 text-[#16A34A]" aria-label="Yes" />
                      ) : (
                        <span className="text-[#8A93A3]" aria-label="No">—</span>
                      )}
                    </td>
                    <td className={`${td} max-w-[160px] truncate`}>{r.station ?? <span className="text-[#8A93A3]">—</span>}</td>
                    <td className={`${td} text-right font-semibold`}>
                      {r.consumption != null ? r.consumption.toFixed(1) : <span className="font-normal text-[#8A93A3]">—</span>}
                    </td>
                    <td className={`${td} w-12`}>{actions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобільний */}
          <ul className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <li key={r.id} className={cn(cardClass, "p-4")}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0B1220]">
                      {amount(r.liters)} {unit} · {formatMoney(r.total_cost)}
                    </p>
                    <p className="mt-1 text-sm text-[#5B6475]">
                      {formatDate(r.filled_at)} · {formatKm(r.mileage)}
                      {r.station && <> · {r.station}</>}
                    </p>
                  </div>
                  <div className="-mt-1 -mr-1.5">{actions(r)}</div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#5B6475]">
                    {formatMoney(r.price_per_liter)}/{unit} · {r.is_full_tank ? (electric ? "Full charge" : "Full tank") : "Partial"}
                  </span>
                  {r.consumption != null && (
                    <span className="font-semibold text-[#0B1220]">
                      {r.consumption.toFixed(1)} {per100}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {loadMore}
        </>
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
