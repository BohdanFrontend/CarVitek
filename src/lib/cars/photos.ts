import { createClient } from "@/lib/supabase/server"

const BUCKET = "car-photos"
const SIGNED_URL_TTL = 60 * 60 // 1 година

/**
 * Signed URL для фото з приватного бакета — одним запитом для всіх шляхів.
 * Повертає мапу шлях → URL (відсутні/помилкові шляхи просто пропускаються).
 */
export async function getCarPhotoUrls(paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))]
  const urls = new Map<string, string>()
  if (!unique.length) return urls

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL)
  if (error) {
    console.error("getCarPhotoUrls:", error)
    return urls
  }
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  }
  return urls
}
