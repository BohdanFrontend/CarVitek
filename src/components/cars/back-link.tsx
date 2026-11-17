import { useTranslations } from "next-intl"

import { BackLink } from "@/components/common/back-link"

/** «← Back to Garage» над формою авто. */
export function BackToGarage() {
  const t = useTranslations("garage.form")
  return <BackLink href="/garage" label={t("back")} />
}
