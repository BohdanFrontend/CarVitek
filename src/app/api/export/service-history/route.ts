import { renderToBuffer } from "@react-pdf/renderer"
import { getLocale, getTranslations } from "next-intl/server"

import { getDisplayCurrency } from "@/i18n/format-server"
import { getMaintenancePlan } from "@/lib/dashboard/get-dashboard-data"
import { documentTitle } from "@/lib/documents/describe"
import { getCarDocuments } from "@/lib/documents/queries"
import { todayInKyiv } from "@/lib/dates"
import { ServiceHistoryPdf } from "@/lib/export/service-history-pdf"
import { createFormatter } from "@/lib/format"
import { describeDue } from "@/lib/maintenance/describe"
import { getMaintenanceTypes } from "@/lib/maintenance/types"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const notFound = () => new Response("Not found", { status: 404 })

/** «Volkswagen Golf 2016» → «volkswagen-golf-2016» (лише латиниця й цифри). */
const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** GET /api/export/service-history?carId= — PDF з історією обслуговування авто користувача. */
export async function GET(request: Request) {
  const carId = new URL(request.url).searchParams.get("carId")
  if (!carId) return notFound()

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub
  if (!userId) return notFound()

  const { data: car } = await supabase.from("cars").select("*").eq("id", carId).maybeSingle()
  // Чуже або неіснуюче авто — 404 (не розкриваємо, що воно є)
  if (!car || car.owner_id !== userId) return notFound()

  // Мова документа = мова інтерфейсу користувача (з user_settings, інакше cookie)
  const locale = await getLocale()
  const f = createFormatter({ locale, ...(await getDisplayCurrency()) })
  const [t, tg, tp, tm, td, types, plan, docs, records] = await Promise.all([
    getTranslations({ locale, namespace: "pdf" }),
    getTranslations({ locale, namespace: "garage" }),
    getTranslations({ locale, namespace: "planner" }),
    getTranslations({ locale, namespace: "maintenanceTypes" }),
    getTranslations({ locale, namespace: "documents" }),
    getMaintenanceTypes(),
    getMaintenancePlan(car.id),
    getCarDocuments(car.id),
    supabase
      .from("service_records")
      .select("id, performed_at, mileage, title, total_cost, service_station, service_record_items(maintenance_type_id)")
      .eq("car_id", car.id)
      .order("performed_at", { ascending: false })
      .order("mileage", { ascending: false }),
  ])
  if (records.error) {
    console.error("export service history:", records.error.message)
    return new Response("Failed to load records", { status: 500 })
  }

  // Назви робіт мовою користувача (власні типи — як є)
  const typeName = (t: { code: string | null; name: string }) =>
    t.code && tm.has(t.code as never) ? tm(t.code as never) : t.name
  const typeById = new Map(types.map((type) => [type.id, type]))
  const order = new Map(types.map((type, i) => [type.id, i]))

  const rows = records.data.map((r) => {
    const works = r.service_record_items
      .map((i) => typeById.get(i.maintenance_type_id))
      .filter((type) => type != null)
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map(typeName)
    return {
      id: r.id,
      date: f.date(r.performed_at),
      mileage: f.km(r.mileage),
      work: works.length ? works.join(", ") : (r.title ?? "—"),
      station: r.service_station ?? "—",
      total: f.money(Number(r.total_cost ?? 0)),
    }
  })
  const totalSpent = records.data.reduce((sum, r) => sum + Number(r.total_cost ?? 0), 0)

  const today = todayInKyiv()
  const upcoming = plan
    .filter((i) => i.status !== "no_data")
    .slice(0, 5)
    .map((i) => ({
      id: i.typeId,
      name: typeName(i),
      due: describeDue(i, today, tp, f),
      status: i.status as "overdue" | "soon" | "ok",
    }))

  const name = [car.make, car.model, car.year].filter(Boolean).join(" ")
  const buffer = await renderToBuffer(
    // Викликаємо як функцію: renderToBuffer чекає елемент <Document>
    ServiceHistoryPdf({
      labels: {
        title: t("title"),
        generated: t("generated", { date: f.date(today) }),
        car: t("car"),
        make: t("make"),
        model: t("model"),
        year: t("year"),
        engine: t("engine"),
        plate: t("plate"),
        vin: t("vin"),
        mileage: t("mileage"),
        records: t("records"),
        date: t("date"),
        work: t("work"),
        station: t("station"),
        total: t("total"),
        noRecords: t("noRecords"),
        summary: t("summary"),
        recordsCount: t("recordsCount", { count: rows.length }),
        totalSpent: t("totalSpent"),
        upcoming: t("upcoming"),
        noUpcoming: t("noUpcoming"),
        documents: t("documents"),
        docType: t("docType"),
        docNumber: t("docNumber"),
        docValidUntil: t("docValidUntil"),
        page: (page, total) => t("page", { page, total }),
      },
      car: {
        name,
        make: car.make,
        model: car.model,
        year: car.year ? String(car.year) : "—",
        engine: tg(`engine.${car.engine_type}`),
        plate: car.plate_number ?? "—",
        vin: car.vin ?? "—",
        mileage: f.km(car.current_mileage),
      },
      records: rows,
      totalSpent: f.money(totalSpent),
      upcoming,
      documents: docs.map((d) => ({
        id: d.id,
        type: documentTitle(d, td),
        number: d.number ?? "—",
        validUntil: d.expiry_date ? f.date(d.expiry_date) : t("noExpiry"),
        status: d.status,
      })),
    })
  )

  const file = `carvitex-service-history-${slug(name) || "car"}.pdf`
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"; filename*=UTF-8''${encodeURIComponent(file)}`,
      "Cache-Control": "private, no-store",
    },
  })
}
