/**
 * Спільні класи для екранів автентифікації, щоб усі 4 сторінки виглядали однаково.
 * Базові класи — мобільна версія (< lg), значення під `lg:` — десктоп.
 */

/**
 * «Скляна» картка з формою на мобільному. На десктопі картку малює layout,
 * тож тут усе скидається в нуль.
 */
export const authCardClass =
  "mt-4 max-lg:[@media(max-height:700px)]:mt-3 rounded-3xl border border-white/90 bg-white/72 p-4 shadow-[0_12px_40px_rgba(23,70,160,0.12)] backdrop-blur-xl lg:mt-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"

/** Сітка полів форми: 10px між полями на мобільному, 16px на десктопі. */
export const authFormClass = "grid gap-2.5 lg:gap-4"

/**
 * Основна кнопка форми.
 * Мобільний: 52px, радіус 14px, градієнт #2B74FF → #0B57E6 з тінню, 17px.
 * Десктоп: 60px (64px на xl), радіус 12px, суцільний #1766F2 → hover #0F55D6, 20px.
 */
export const authSubmitClass =
  "mt-1 h-[52px] w-full gap-2.5 rounded-[14px] bg-linear-to-r from-[#2B74FF] to-[#0B57E6] text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(23,102,242,0.35)] hover:brightness-105 lg:mt-2 lg:h-[60px] lg:rounded-[12px] lg:bg-none lg:bg-[#1766F2] lg:text-[20px] lg:shadow-none lg:hover:bg-[#0F55D6] lg:hover:brightness-100 xl:h-16"

/** Синє текстове посилання («Forgot password?», «Back to log in»). */
export const authLinkClass =
  "rounded text-[15px] font-semibold text-[#1766F2] hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:text-lg"

/** Обгортка посилання під кнопкою: 14px на мобільному, 20px на десктопі. */
export const authLinkRowClass = "mt-3.5 text-center lg:mt-5"

/** Розділювач «or» і його лінії. */
export const authDividerClass =
  "my-3 flex items-center gap-4 text-sm text-[#374151] lg:my-6 lg:text-lg lg:text-[#5B6475] xl:my-7"
export const authDividerLineClass = "h-px flex-1 bg-[#D9E2F0] lg:bg-[#D9DEE7]"

/** Нижній рядок «Don't have an account? …». */
export const authFooterClass = "text-center text-[15px] text-[#374151] lg:text-lg"
export const authFooterLinkClass = "font-bold text-[#1766F2] hover:underline"
