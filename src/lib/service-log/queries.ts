import { getSignedUrls } from "@/lib/cars/photos"
import { workGroup, type WorkGroup } from "@/lib/maintenance/groups"
import { getMaintenanceTypes, type MaintenanceType } from "@/lib/maintenance/types"
import { createClient } from "@/lib/supabase/server"

export type ServiceRow = {
  id: string
  performed_at: string
  mileage: number
  /** Назва візиту (для записів без робіт із довідника) */
  title: string | null
  labor_cost: number
  parts_cost: number
  total_cost: number
  service_station: string | null
  comment: string | null
  receipt_path: string | null
  receiptUrl: string | null
  /** Роботи запису (з назвою і code для іконки), у порядку довідника */
  works: Pick<MaintenanceType, "id" | "code" | "name">[]
}

const RECORD_COLUMNS =
  "id, performed_at, mileage, title, labor_cost, parts_cost, total_cost, service_station, comment, receipt_path, service_record_items(maintenance_type_id)"

/**
 * Записи ТО авто: новіші зверху, з фільтром за групою робіт і пагінацією.
 * Повертає також суму за всіма відфільтрованими записами (не лише за сторінкою).
 */
export async function listServiceRecords(
  carId: string,
  { group, limit }: { group: WorkGroup | null; limit: number }
) {
  const supabase = await createClient()
  const types = await getMaintenanceTypes()
  const typeById = new Map(types.map((t) => [t.id, t]))

  // Фільтр за групою: id записів, де є хоч одна робота цієї групи
  let recordIds: string[] | null = null
  if (group) {
    const groupTypeIds = types.filter((t) => workGroup(t.code) === group).map((t) => t.id)
    const { data, error } = await supabase
      .from("service_record_items")
      .select("service_record_id, service_records!inner(car_id)")
      .eq("service_records.car_id", carId)
      .in("maintenance_type_id", groupTypeIds.length ? groupTypeIds : ["00000000-0000-0000-0000-000000000000"])
    if (error) throw new Error(`Failed to filter service records: ${error.message}`)
    recordIds = [...new Set(data.map((d) => d.service_record_id))]
  }

  let totalsQuery = supabase.from("service_records").select("id, total_cost").eq("car_id", carId)
  let pageQuery = supabase
    .from("service_records")
    .select(RECORD_COLUMNS)
    .eq("car_id", carId)
    .order("performed_at", { ascending: false })
    .order("mileage", { ascending: false })
    .range(0, limit - 1)
  if (recordIds) {
    totalsQuery = totalsQuery.in("id", recordIds)
    pageQuery = pageQuery.in("id", recordIds)
  }
  const [totals, page] = await Promise.all([totalsQuery, pageQuery])
  if (totals.error) throw new Error(`Failed to load service totals: ${totals.error.message}`)
  if (page.error) throw new Error(`Failed to load service records: ${page.error.message}`)

  const receiptUrls = await getSignedUrls("receipts", page.data.map((r) => r.receipt_path))
  const sortOrder = new Map(types.map((t, i) => [t.id, i]))

  const rows: ServiceRow[] = page.data.map(({ service_record_items, ...r }) => ({
    ...r,
    labor_cost: Number(r.labor_cost),
    parts_cost: Number(r.parts_cost),
    total_cost: Number(r.total_cost ?? 0),
    receiptUrl: r.receipt_path ? (receiptUrls.get(r.receipt_path) ?? null) : null,
    works: service_record_items
      .map((i) => typeById.get(i.maintenance_type_id))
      .filter((t): t is MaintenanceType => Boolean(t))
      .sort((a, b) => (sortOrder.get(a.id) ?? 0) - (sortOrder.get(b.id) ?? 0))
      .map(({ id, code, name }) => ({ id, code, name })),
  }))

  return {
    rows,
    total: totals.data.length,
    totalSpent: totals.data.reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
    hasMore: totals.data.length > rows.length,
  }
}

/** Один запис ТО для редагування (RLS поверне лише власний). */
export async function getServiceRecord(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("service_records")
    .select(`${RECORD_COLUMNS}, car_id`)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(`Failed to load service record: ${error.message}`)
  return data
}

/** Підказки для поля «Service station»: СТО з попередніх записів користувача (усі авто). */
export async function getStationSuggestions(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("service_records")
    .select("service_station")
    .not("service_station", "is", null)
    .order("performed_at", { ascending: false })
    .limit(300)
  const seen = new Map<string, string>()
  for (const r of data ?? []) {
    const name = r.service_station?.trim()
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name)
  }
  return [...seen.values()].slice(0, 50)
}
