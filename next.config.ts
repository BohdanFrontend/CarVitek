import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // cacheComponents і partialPrefetching вимкнено свідомо: з ними кожне читання
  // cookies (сесія Supabase) мусить бути за <Suspense>, інакше збірка падає.
  // Для застосунку, де майже всі сторінки персональні, це лише ускладнення.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
