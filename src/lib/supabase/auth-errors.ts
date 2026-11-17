import type { AuthError } from "@supabase/supabase-js"

const KNOWN = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "user_already_exists",
  "email_exists",
  "weak_password",
  "same_password",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "email_address_invalid",
  "signup_disabled",
])

/** Ключ словника для помилки Supabase Auth (auth.errors.*); текст перекладає викликач. */
export function authErrorKey(error: AuthError): string {
  return `auth.errors.${error.code && KNOWN.has(error.code) ? error.code : "generic"}`
}
