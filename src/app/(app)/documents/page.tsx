import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { NoCarState } from "@/components/common/no-car-state"
import { DocumentsView } from "@/components/documents/documents-view"
import { getActiveCar } from "@/lib/cars/active-car"
import { getCarDocuments, getDocumentFileUrls } from "@/lib/documents/queries"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("documents"))("title") }
}

/** Документи активного авто: страховки, техогляд, техпаспорт… з нагадуваннями про закінчення. */
export default async function DocumentsPage() {
  const [{ activeCar }, t] = await Promise.all([getActiveCar(), getTranslations("documents")])
  if (!activeCar) return <NoCarState title={t("title")} what={t("noCarWhat")} />

  const supabase = await createClient()
  const [{ data: auth }, docs] = await Promise.all([supabase.auth.getClaims(), getCarDocuments(activeCar.id)])
  const urls = await getDocumentFileUrls(docs)

  return (
    <DocumentsView
      carId={activeCar.id}
      userId={auth?.claims?.sub ?? ""}
      docs={docs}
      fileUrls={Object.fromEntries(urls)}
    />
  )
}
