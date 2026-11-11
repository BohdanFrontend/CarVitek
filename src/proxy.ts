import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

// Next.js 16: колишній middleware.ts тепер називається proxy.ts
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Усе, крім статики, оптимізованих зображень і файлів із public/
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
