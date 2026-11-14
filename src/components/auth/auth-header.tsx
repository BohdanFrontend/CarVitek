import { Logo } from "@/components/brand/logo"

/**
 * Заголовок сторінки.
 * Мобільний: над карткою, по центру, з логотипом зверху.
 * Десктоп: усередині картки, ліворуч, без логотипа (він на лівій панелі).
 */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="text-center lg:mb-9 lg:text-left xl:mb-11">
      <div className="mb-4 flex justify-center lg:hidden [@media(max-height:700px)]:mb-3">
        <Logo size="md" />
      </div>
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-balance text-[#0B1220] lg:text-[40px] 2xl:text-[48px]">
        {title}
      </h1>
      <p className="mt-1 text-[15px] text-balance text-[#374151] lg:mt-2 lg:text-wrap lg:leading-[calc(1.75/1.125)] lg:text-[20px] lg:text-[#5B6475] xl:text-[22px]">
        {subtitle}
      </p>
    </header>
  )
}
