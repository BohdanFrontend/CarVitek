import type { NextConfig } from "next"

// Фото авто лежать у приватному бакеті й показуються через signed URL Supabase Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null

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
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
}

export default nextConfig
