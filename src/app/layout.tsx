import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"

import { FormatProvider } from "@/i18n/format-client"
import { getDisplayCurrency } from "@/i18n/format-server"

// Inter підтримує кирилицю; змінна --font-sans підхоплюється темою в globals.css
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// viewportFit "cover" — щоб env(safe-area-inset-*) працювали на iPhone з «чубчиком»
export const viewport: Viewport = {
  themeColor: "#F5F9FF",
  viewportFit: "cover",
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return {
    title: { default: t("title"), template: "%s · CarVitex" },
    description: t("description"),
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, display] = await Promise.all([getLocale(), getDisplayCurrency()])
  return (
    <html lang={locale} className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <FormatProvider currency={display.currency} rate={display.rate}>{children}</FormatProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
