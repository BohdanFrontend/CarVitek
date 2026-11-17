import type messages from "./messages/en.json"
import type { AppLocale } from "./config"

// Типізовані ключі перекладів: неіснуючий ключ — помилка TypeScript
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale
    Messages: typeof messages
  }
}
