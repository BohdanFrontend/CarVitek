"use client"

import { Info } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { saveSettings } from "@/app/(app)/settings/actions"
import { inputClass } from "@/components/forms/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CURRENCIES, CURRENCY_SYMBOLS, type AppCurrency, type AppLocale } from "@/i18n/config"
import { useFormat } from "@/i18n/format-client"
import { useMessageText } from "@/i18n/use-message"
import type { ExchangeRates } from "@/lib/exchange-rates"
import type { RemindWhen, UserSettings } from "@/lib/settings"
import { Segmented } from "./segmented"
import { settingsCardClass, settingsLabelClass, settingsTitleClass } from "./styles"

/**
 * Зберігає налаштування одразу після зміни: оптимістично оновлює стан,
 * при помилці повертає попереднє значення.
 */
function useSetting<K extends keyof UserSettings>(key: K, initial: UserSettings[K]) {
  const t = useTranslations("settings")
  const text = useMessageText()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  const locale = useLocale()
  // Збережене значення, для якого ще не показали toast. Для мови чекаємо, поки інтерфейс
  // перемкнеться (новий словник приходить окремим рендером) — щоб «Saved» був новою мовою.
  const [toastFor, setToastFor] = useState<{ value: UserSettings[K] } | null>(null)

  const shown = useRef<typeof toastFor>(null)

  useEffect(() => {
    if (!toastFor || shown.current === toastFor || (key === "language" && locale !== toastFor.value)) return
    shown.current = toastFor
    toast.success(t("saved"))
  }, [toastFor, locale, key, t])

  const save = (next: UserSettings[K], { onError }: { onError?: () => void } = {}) => {
    const prev = value
    setValue(next)
    startTransition(async () => {
      const res = await saveSettings({ [key]: next })
      if (!res.ok) {
        setValue(prev)
        onError?.()
        toast.error(text(res.message))
        return
      }
      setToastFor({ value: next })
    })
  }
  return [value, save, pending] as const
}

export function PreferencesCard({ settings, rates }: { settings: UserSettings; rates: ExchangeRates }) {
  const t = useTranslations("settings.preferences")
  const f = useFormat()
  const ids = useId()
  const [language, saveLanguage, langPending] = useSetting("language", settings.language)
  const [currency, saveCurrency, curPending] = useSetting("currency", settings.currency)

  const languages = [
    { value: "en", label: "English" },
    { value: "uk", label: "Українська" },
  ] as const satisfies readonly { value: AppLocale; label: string }[]
  const currencies = CURRENCIES.map((c) => ({ value: c, label: `${CURRENCY_SYMBOLS[c]} ${c}` }))

  return (
    <section aria-labelledby="preferences-title" className={settingsCardClass}>
      <h2 id="preferences-title" className={settingsTitleClass}>
        {t("title")}
      </h2>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-2.5">
          <span id={`${ids}-lang`} className={settingsLabelClass}>
            {t("language")}
          </span>
          <Segmented labelledBy={`${ids}-lang`} value={language} options={languages} onChange={saveLanguage} disabled={langPending} />
        </div>

        <div className="grid gap-2.5">
          <span id={`${ids}-cur`} className={settingsLabelClass}>
            {t("currency")}
          </span>
          <Segmented<AppCurrency>
            labelledBy={`${ids}-cur`}
            value={currency}
            options={currencies}
            onChange={saveCurrency}
            disabled={curPending}
          />
          <p className="flex items-start gap-2 text-[13px] text-[#5B6475]">
            <Info className="mt-px size-4 shrink-0" aria-hidden />
            {currencyNote(currency, rates, t, f)}
          </p>
        </div>
      </div>
    </section>
  )
}

/** Підказка під валютою: курс НБУ для USD/EUR або пояснення для гривні. */
function currencyNote(
  currency: AppCurrency,
  rates: ExchangeRates,
  t: ReturnType<typeof useTranslations<"settings.preferences">>,
  f: ReturnType<typeof useFormat>
) {
  if (currency === "UAH") return t("currencyNoteUah")
  const r = rates[currency]
  if (!r) return t("rateUnavailable")
  return t("currencyRate", {
    date: f.date(r.date),
    symbol: CURRENCY_SYMBOLS[currency],
    rate: `${f.number(r.rate, 2)} ${CURRENCY_SYMBOLS.UAH}`,
  })
}

export function NotificationsCard({ settings }: { settings: UserSettings }) {
  const t = useTranslations("settings.notifications")
  const ids = useId()
  const [email, saveEmail, emailPending] = useSetting("email_reminders", settings.email_reminders)
  const [browser, saveBrowser, browserPending] = useSetting("browser_notifications", settings.browser_notifications)
  const [remindWhen, saveRemindWhen, remindPending] = useSetting("remind_when", settings.remind_when)
  const [browserHint, setBrowserHint] = useState<string | null>(null)

  const toggleBrowser = async (on: boolean) => {
    setBrowserHint(null)
    if (!on) return saveBrowser(false)
    if (typeof window === "undefined" || !("Notification" in window)) return setBrowserHint(t("unsupported"))
    const permission =
      Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission
    // Відмова — перемикач лишається вимкненим, показуємо підказку
    if (permission !== "granted") return setBrowserHint(t("denied"))
    saveBrowser(true, { onError: () => setBrowserHint(null) })
  }

  const items = [
    { value: "due_soon", label: t("dueSoon") },
    { value: "overdue", label: t("overdue") },
  ] as const satisfies readonly { value: RemindWhen; label: string }[]

  return (
    <section aria-labelledby="notifications-title" className={settingsCardClass}>
      <h2 id="notifications-title" className={settingsTitleClass}>
        {t("title")}
      </h2>

      <div className="mt-3 divide-y divide-[#EEF1F6]">
        <SwitchRow
          id={`${ids}-email`}
          label={t("email")}
          hint={t("emailHint")}
          checked={email}
          onChange={(v) => saveEmail(v)}
          disabled={emailPending}
        />
        <SwitchRow
          id={`${ids}-browser`}
          label={t("browser")}
          hint={t("browserHint")}
          checked={browser}
          onChange={toggleBrowser}
          disabled={browserPending}
          alert={browserHint}
        />
      </div>

      <div className="mt-4 grid gap-2">
        <label htmlFor={`${ids}-when`} className={settingsLabelClass}>
          {t("remindWhen")}
        </label>
        <Select
          items={items}
          value={remindWhen}
          onValueChange={(v) => v && v !== remindWhen && saveRemindWhen(v as RemindWhen)}
          disabled={remindPending}
        >
          <SelectTrigger id={`${ids}-when`} className={cn(inputClass, "w-full pr-3 pl-4 data-[size=default]:h-12")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {items.map((i) => (
              <SelectItem key={i.value} value={i.value} className="h-10 text-[15px]">
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="flex items-start gap-2 text-[13px] text-[#5B6475]">
          <Info className="mt-px size-4 shrink-0" aria-hidden />
          {t("note")}
        </p>
      </div>
    </section>
  )
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
  alert,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  alert?: string | null
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={id} id={`${id}-label`} className="block text-[15px] font-semibold text-[#0B1220]">
            {label}
          </label>
          <p id={`${id}-hint`} className="text-[13px] text-[#5B6475]">
            {hint}
          </p>
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={alert ? `${id}-alert` : `${id}-hint`}
        />
      </div>
      {alert && (
        <p id={`${id}-alert`} role="alert" className="mt-2 rounded-[10px] bg-[#FFF7E6] px-3 py-2 text-[13px] text-[#92400E]">
          {alert}
        </p>
      )}
    </div>
  )
}
