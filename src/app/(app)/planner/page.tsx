import type { Metadata } from "next"

import { ComingSoon } from "@/components/app-shell/coming-soon"

export const metadata: Metadata = { title: "Maintenance Planner" }

export default function Page() {
  return <ComingSoon title="Maintenance Planner" />
}
