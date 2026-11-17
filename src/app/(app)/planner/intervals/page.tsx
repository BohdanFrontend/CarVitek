import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { BackLink } from "@/components/common/back-link"
import { NoCarState } from "@/components/common/no-car-state"
import { PageHeader } from "@/components/common/page-header"
import { IntervalsManager, type IntervalRow } from "@/components/planner/intervals-manager"
import { getActiveCar } from "@/lib/cars/active-car"
import { carLabel } from "@/lib/cars/format"
import { getMaintenanceTypes, typesForEngine } from "@/lib/maintenance/types"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("planner.intervals"))("metaTitle") }
}

export default async function IntervalsPage() {
  const [{ activeCar }, t] = await Promise.all([getActiveCar(), getTranslations("planner")])
  if (!activeCar) return <NoCarState title={t("intervals.metaTitle")} what={t("noCarWhat")} />

  const supabase = await createClient()
  const [types, rules] = await Promise.all([
    getMaintenanceTypes(),
    supabase
      .from("car_maintenance_rules")
      .select("maintenance_type_id, interval_km, interval_months, is_enabled")
      .eq("car_id", activeCar.id),
  ])
  if (rules.error) throw new Error(`Failed to load intervals: ${rules.error.message}`)
  const ruleByType = new Map(rules.data.map((r) => [r.maintenance_type_id, r]))

  const rows: IntervalRow[] = typesForEngine(types, activeCar.engine_type).map((t) => {
    const rule = ruleByType.get(t.id)
    return {
      typeId: t.id,
      code: t.code,
      name: t.name,
      isCustom: t.isCustom,
      defaultKm: t.interval_km,
      defaultMonths: t.interval_months,
      ruleKm: rule?.interval_km ?? null,
      ruleMonths: rule?.interval_months ?? null,
      enabled: rule?.is_enabled ?? true,
      hasRule: Boolean(rule),
    }
  })

  return (
    <div>
      <BackLink href="/planner" label={t("intervals.back")} />
      <PageHeader title={t("intervals.title")} description={t("intervals.subtitle", { car: carLabel(activeCar) })} />
      <IntervalsManager carId={activeCar.id} rows={rows} />
    </div>
  )
}
