import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

const PAGE = 1000

/** Усі шляхи файлів під префіксом (рекурсивно по «теках», з пагінацією list). */
async function listAll(client: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const files: string[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: PAGE, offset })
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
    for (const item of data) {
      const path = `${prefix}/${item.name}`
      // Тека в Storage — елемент без id
      if (item.id == null) files.push(...(await listAll(client, bucket, path)))
      else files.push(path)
    }
    if (data.length < PAGE) break
  }
  return files
}

/** Видаляє всі файли під префіксом у бакеті: "<user_id>" (акаунт) або "<user_id>/<car_id>" (авто). */
export async function removeFolder(client: SupabaseClient, bucket: string, prefix: string) {
  const paths = await listAll(client, bucket, prefix)
  for (let i = 0; i < paths.length; i += PAGE) {
    const { error } = await client.storage.from(bucket).remove(paths.slice(i, i + PAGE))
    if (error) throw new Error(`${bucket}: ${error.message}`)
  }
  return paths.length
}

/** Видаляє всі файли користувача "<user_id>/…" у бакеті. */
export const removeUserFiles = (client: SupabaseClient, bucket: string, userId: string) =>
  removeFolder(client, bucket, userId)
