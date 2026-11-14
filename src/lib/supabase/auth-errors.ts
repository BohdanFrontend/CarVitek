import type { AuthError } from "@supabase/supabase-js"

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed: "Your email isn't confirmed yet. Check your inbox.",
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  weak_password: "This password is too weak. Try a longer or more complex one.",
  same_password: "Your new password must be different from the old one.",
  over_email_send_rate_limit: "Too many emails sent. Try again in a few minutes.",
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  email_address_invalid: "Invalid email address.",
  signup_disabled: "Sign-ups are temporarily disabled.",
}

/** Перекладає помилку Supabase Auth у зрозуміле англійське повідомлення. */
export function authErrorMessage(error: AuthError): string {
  return (error.code && MESSAGES[error.code]) || "Something went wrong. Please try again."
}
