import { deleteServiceRecord } from "@/app/(app)/service-log/actions"
import { cardClass } from "@/components/common/buttons"
import { RowActions } from "@/components/common/row-actions"
import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"
import { formatDate } from "@/lib/dates"
import { formatKm, formatMoney } from "@/lib/format"
import type { ServiceRow } from "@/lib/service-log/queries"
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

function Actions({ row }: { row: ServiceRow }) {
  const date = formatDate(row.performed_at)
  return (
    <RowActions
      label={`Actions for service on ${date}`}
      editHref={`/service-log/${row.id}/edit`}
      onDelete={deleteServiceRecord.bind(null, row.id)}
      deleteTitle={`Delete service record from ${date}?`}
      deleteDescription="The record, its receipt and its mileage reading will be permanently deleted."
      deletedMessage="Service record deleted"
    />
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
                <td className={`${td} max-w-[180px] truncate`}>{r.service_station ?? <span className="text-[#8A93A3]">—</span>}</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatMoney(r.labor_cost)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatMoney(r.parts_cost)}</td>
                <td className={`${td} text-right font-semibold whitespace-nowrap`}>{formatMoney(r.total_cost)}</td>
                <td className={td}><ReceiptLink path={r.receipt_path} url={r.receiptUrl} /></td>
                <td className={`${td} max-w-[200px] truncate text-[#5B6475]`} title={r.comment ?? undefined}>
                  {r.comment ?? "—"}
                </td>
                <td className={`${td} w-12`}><Actions row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобільний */}
      <ul className="grid gap-3 lg:hidden">
        {rows.map((r) => (
          <li key={r.id} className={`${cardClass} p-4`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <WorkTypes works={r.works} title={r.title} />
                <p className="mt-1.5 text-sm text-[#5B6475]">
                  {formatDate(r.performed_at)} · {formatKm(r.mileage)}
                  {r.service_station && <> · {r.service_station}</>}
                </p>
              </div>
              <div className="-mt-1 -mr-1.5"><Actions row={r} /></div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-[#5B6475]">
                Labor {formatMoney(r.labor_cost)} · Parts {formatMoney(r.parts_cost)}
              </div>
              <ReceiptLink path={r.receipt_path} url={r.receiptUrl} />
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-[#5B6475]">{r.comment}</p>
              <p className="shrink-0 text-lg font-bold text-[#0B1220]">{formatMoney(r.total_cost)}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
