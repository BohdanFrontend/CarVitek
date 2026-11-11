import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./database.types"

/** Сторінки, доступні без входу. */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/auth"]

/** Сторінки лише для гостей: увійшовшого користувача з них перенаправляємо. */
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"]

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/**
 * Оновлює сесію Supabase (refresh token) і захищає маршрути.
 * Викликається з src/proxy.ts на кожен запит.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          // Заборона кешування відповідей з auth-cookies на CDN
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )

  // Не вставляй код між створенням клієнта і getClaims():
  // саме цей виклик перевіряє JWT і за потреби оновлює сесію.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)

  const { pathname, search } = request.nextUrl

  if (!isAuthenticated && !matches(pathname, PUBLIC_PATHS)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    if (pathname !== "/") url.searchParams.set("next", pathname + search)
    return redirectWithCookies(url, response)
  }

  if (isAuthenticated && matches(pathname, GUEST_ONLY_PATHS)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  return response
}

/** Редірект, який не губить щойно оновлені cookies сесії. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  from.headers.forEach((value, key) => {
    if (key !== "set-cookie" && key !== "location") redirect.headers.set(key, value)
  })
  return redirect
}
