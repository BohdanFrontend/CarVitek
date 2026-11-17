import { Car, Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { PageTitle } from "@/components/app-shell/page-title"
import { primaryButtonClass } from "./buttons"
import { EmptyState } from "./empty-state"

/** Сторінка модуля, коли в користувача ще немає авто. */
/** what — уже перекладений опис, що саме відстежувати («service history» / «історію ТО») */
export async function NoCarState({ title, what }: { title: string; what: string }) {
  const t = await getTranslations("common")
  return (
    <div>
      <PageTitle className="mb-6">{title}</PageTitle>
      <EmptyState
        icon={Car}
        title={t("addYourFirstCar")}
        description={t("addCarToTrack", { what })}
        action={
          <Link href="/garage/new" className={primaryButtonClass}>
            <Plus className="size-5" aria-hidden />
            {t("addCar")}
          </Link>
        }
      />
    </div>
  )
}
