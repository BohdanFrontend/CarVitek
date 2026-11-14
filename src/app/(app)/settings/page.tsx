import type { Metadata } from "next"

import { ComingSoon } from "@/components/app-shell/coming-soon"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return <ComingSoon title="Settings" />
}
