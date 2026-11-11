import type { ReactNode } from "react"

import { CarIllustration } from "@/components/brand/car-illustration"
import { Logo } from "@/components/brand/logo"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh bg-muted/40 lg:grid-cols-2">
      {/* Ліва панель з брендом — лише на широких екранах */}
      <aside className="relative hidden flex-col items-center justify-center gap-10 overflow-hidden bg-linear-to-b from-blue-50 via-blue-50 to-blue-100 px-12 py-16 lg:flex dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
        <Logo size="lg" />
        <p className="max-w-xs text-center text-3xl leading-tight font-semibold text-balance text-slate-800 dark:text-slate-100">
          Жодного пропущеного ТО
        </p>
        <CarIllustration className="max-w-md" />
        {/* декоративні хвилі */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-blue-200/60 dark:text-blue-900/40"
          viewBox="0 0 600 160"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 110 C150 60 300 150 600 70 L600 160 L0 160 Z" fill="currentColor" />
        </svg>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
