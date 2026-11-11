import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: {
    default: "CarVitex — сервісна книжка автомобіля",
    template: "%s · CarVitex",
  },
  description:
    "Облік обслуговування, заправок і витрат на авто з автоматичним плануванням ТО за пробігом і часом.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
