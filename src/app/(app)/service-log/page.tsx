import type { Metadata } from "next"

import { ComingSoon } from "@/components/app-shell/coming-soon"

export const metadata: Metadata = { title: "Service Log" }

export default function Page() {
  return <ComingSoon title="Service Log" />
}
