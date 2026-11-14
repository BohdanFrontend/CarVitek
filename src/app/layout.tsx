import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"

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

export const metadata: Metadata = {
  title: {
    default: "CarVitex — your car's service book",
    template: "%s · CarVitex",
  },
  description:
    "Track your car's maintenance, fuel-ups and expenses, with service reminders scheduled automatically by mileage and time.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
