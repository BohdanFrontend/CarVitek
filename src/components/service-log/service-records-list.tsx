import Link from "next/link"

import { deleteServiceRecord } from "@/app/(app)/service-log/actions"
import { cardClass } from "@/components/common/buttons"
import { RowActions } from "@/components/common/row-actions"
import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"
import { formatDate } from "@/lib/dates"
import { formatKm, formatMoney, formatMoneyShort } from "@/lib/format"
import type { ServiceRow } from "@/lib/service-log/queries"
import { ExpandableComment } from "./expandable-comment"
import { ReceiptLink } from "./receipt-link"

/** «Oil change +2» — перша робота і кількість решти. */
function WorkTypes({ works, title }: { works: ServiceRow["works"]; title?: string | null }) {
  const [first, ...rest] = works
  if (!first) {
    return title ? (
      <span className="flex min-w-0 items-center gap-2.5">
        <WorkTypeIcon code={null} size="sm" />
        <span className="truncate font-medium text-[#0B1220]">{title}</span>
      </span>
    ) : (
      <span className="text-[#8A93A3]">—</span>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-2.5" title={works.map((w) => w.name).join(", ")}>
      <WorkTypeIcon code={first.code} size="sm" />
      <span className="truncate font-medium text-[#0B1220]">{first.name}</span>
      {rest.length > 0 && (
        <span className="shrink-0 rounded-full bg-[#EEF3FE] px-2 py-0.5 text-xs font-semibold text-[#1766F2]">
          +{rest.length}
          <span className="sr-only"> more: {rest.map((w) => w.name).join(", ")}</span>
        </span>
      )}
    </span>
  )
}

function Actions({ row, className }: { row: ServiceRow; className?: string }) {
  const date = formatDate(row.performed_at)
  return (
    <RowActions
      label={`Actions for service on ${date}`}
      editHref={`/service-log/${row.id}/edit`}
      onDelete={deleteServiceRecord.bind(null, row.id)}
      deleteTitle={`Delete service record from ${date}?`}
      deleteDescription="The record, its receipt and its mileage reading will be permanently deleted."
      deletedMessage="Service record deleted"
      className={className}
    />
  )
}

/**
 * Мобільна картка запису (< lg). Уся картка веде на редагування (посилання-підкладка),
 * а ⋮, мініатюра чека й «Show more» лежать над нею і клікаються окремо.
 */
function ServiceRecordCard({ row: r }: { row: ServiceRow }) {
  const [first, ...rest] = r.works
  const name = first?.name ?? r.title ?? "Service"
  const date = formatDate(r.performed_at)
  return (
    <li className="relative rounded-[18px] border border-[rgba(15,23,42,0.04)] bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
      <Link
        href={`/service-log/${r.id}/edit`}
        aria-label={`Edit ${name} service from ${date}`}
        className="absolute inset-0 rounded-[18px] outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
      />
      <div className="pointer-events-none relative grid grid-cols-1 gap-2.5">
        {/* Рядок 1: іконка, назва (+N), сума, ⋮ */}
        <div className="flex items-start gap-3">
          <WorkTypeIcon code={first?.code ?? null} className="size-10 rounded-[12px]" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 pt-2">
            <p className="min-w-0 text-base leading-tight font-bold break-words text-[#0B1220]">{name}</p>
            {rest.length > 0 && (
              <span
                className="rounded-full bg-[#EEF3FE] px-2 py-0.5 text-xs font-semibold text-[#1766F2]"
                title={rest.map((w) => w.name).join(", ")}
              >
                +{rest.length}
                <span className="sr-only"> more: {rest.map((w) => w.name).join(", ")}</span>
              </span>
            )}
          </div>
          <p className="shrink-0 pt-2 text-base leading-tight font-extrabold whitespace-nowrap text-[#0B1220]">
            {formatMoneyShort(r.total_cost)}
          </p>
          <div className="pointer-events-auto relative z-10 -mt-1.5 -mr-2.5">
            <Actions row={r} className="size-11" />
          </div>
        </div>

        {/* Рядок 2: дата · пробіг · СТО — з переносом, без обрізання */}
        <p className="flex flex-wrap gap-x-1.5 text-[13px] break-words text-[#5B6475]">
          <span>{date}</span>
          <span aria-hidden>·</span>
          <span className="whitespace-nowrap">{formatKm(r.mileage)}</span>
          {r.service_station && (
            <>
              <span aria-hidden>·</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">{r.service_station}</span>
            </>
          )}
        </p>

        {/* Рядок 3: роботи і запчастини */}
        <p className="text-[13px] text-[#0B1220]">
          Labor {formatMoneyShort(r.labor_cost)} · Parts {formatMoneyShort(r.parts_cost)}
        </p>

        {/* Коментар і чек */}
        {(r.comment || r.receipt_path) && (
          <div className="flex items-start gap-3">
            {r.comment ? (
              <ExpandableComment text={r.comment} className="flex-1" />
            ) : (
              <span className="flex-1" />
            )}
            <ReceiptLink
              path={r.receipt_path}
              url={r.receiptUrl}
              size="lg"
              className="pointer-events-auto relative z-10"
            />
          </div>
        )}
      </div>
    </li>
  )
}

const th = "px-3 py-3 text-left text-[13px] font-semibold text-[#5B6475] first:pl-6 last:pr-4"
const td = "px-3 py-3.5 align-middle first:pl-6 last:pr-4"

/** Журнал ТО: таблиця на десктопі, картки на мобільному. */
export function ServiceRecordsList({ rows }: { rows: ServiceRow[] }) {
  return (
    <>
      {/* Десктоп */}
      <div className={`${cardClass} hidden overflow-x-auto lg:block`}>
        <table className="w-full min-w-[960px] text-[15px] text-[#0B1220]">
          <thead className="border-b border-[#E5E9F0]">
            <tr>
              <th scope="col" className={th}>Date</th>
              <th scope="col" className={th}>Mileage</th>
              <th scope="col" className={th}>Work type</th>
              <th scope="col" className={th}>Service station</th>
              <th scope="col" className={`${th} text-right`}>Labor</th>
              <th scope="col" className={`${th} text-right`}>Parts</th>
              <th scope="col" className={`${th} text-right`}>Total</th>
              <th scope="col" className={th}>Receipt</th>
              <th scope="col" className={th}>Comment</th>
              <th scope="col" className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F6]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFBFD]">
                <td className={`${td} whitespace-nowrap`}>{formatDate(r.performed_at)}</td>
                <td className={`${td} whitespace-nowrap`}>{formatKm(r.mileage)}</td>
                <td className={`${td} max-w-[240px]`}><WorkTypes works={r.works} title={r.title} /></td>
                <td className={td}><div className="max-w-[180px] truncate" title={r.service_station ?? undefined}>{r.service_station ?? <span className="text-[#8A93A3]">—</span>}</div></td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatMoney(r.labor_cost)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatMoney(r.parts_cost)}</td>
                <td className={`${td} text-right font-semibold whitespace-nowrap`}>{formatMoney(r.total_cost)}</td>
                <td className={td}><ReceiptLink path={r.receipt_path} url={r.receiptUrl} /></td>
                <td className={`${td} text-[#5B6475]`}>
                  {/* truncate на <td> не обмежує ширину таблиці — обрізаємо внутрішній блок */}
                  <div className="max-w-[200px] truncate" title={r.comment ?? undefined}>
                    {r.comment ?? "—"}
                  </div>
                </td>
                <td className={`${td} w-12`}><Actions row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобільний */}
      <ul className="grid grid-cols-1 gap-3 lg:hidden">
        {rows.map((r) => (
          <ServiceRecordCard key={r.id} row={r} />
        ))}
      </ul>
    </>
  )
}
