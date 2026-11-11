import type { AuthError } from "@supabase/supabase-js"

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Невірний email або пароль.",
  email_not_confirmed: "Email ще не підтверджено. Перевірте пошту.",
  user_already_exists: "Користувач із таким email уже зареєстрований.",
  email_exists: "Користувач із таким email уже зареєстрований.",
  weak_password: "Пароль надто простий. Спробуйте довший або складніший.",
  same_password: "Новий пароль має відрізнятися від старого.",
  over_email_send_rate_limit: "Забагато листів за короткий час. Спробуйте за кілька хвилин.",
  over_request_rate_limit: "Забагато спроб. Зачекайте трохи й спробуйте знову.",
  email_address_invalid: "Некоректна email-адреса.",
  signup_disabled: "Реєстрацію тимчасово вимкнено.",
}

/** Перекладає помилку Supabase Auth у зрозуміле українське повідомлення. */
export function authErrorMessage(error: AuthError): string {
  return (error.code && MESSAGES[error.code]) || "Щось пішло не так. Спробуйте ще раз."
}
