import Image from "next/image"
import type { ReactNode } from "react"

import { Logo } from "@/components/brand/logo"
import authCar from "../../../public/auth-car.png"
import authCarMobile from "../../../public/auth-car-mobile.png"

/**
 * Базові класи — мобільна версія (< lg), значення під `lg:` — десктоп.
 * На мобільному заголовок сторінки стоїть над карткою, тому обгортка `children`
 * тут прозора, а «скляну» картку малюють самі форми (authCardClass).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh overflow-x-clip bg-linear-to-b from-[#F5F9FF] to-[#E4EDFC] lg:grid-cols-2 lg:overflow-x-visible lg:bg-none lg:bg-[#F5F7FB] xl:grid-cols-[11fr_9fr]">
      {/* Ліва панель (55% на xl) — лише на широких екранах. Фото заповнює
          всю панель, машина по центру; логотип і слоган лежать на небі. */}
      <aside className="sticky top-0 hidden h-svh flex-col items-center overflow-hidden bg-[#D4E5FE] lg:flex">
        <Image
          src={authCar}
          alt=""
          fill
          sizes="(min-width: 1280px) 55vw, 50vw"
          preload
          className="object-cover object-center"
        />

        <div className="relative z-10 flex flex-col items-center px-10 pt-[10vh]">
          <Logo size="lg" />
          <p className="mt-10 text-center text-[32px] leading-[1.2] font-bold text-[#0B1220]">
            Never miss
            <br />a service again
          </p>
        </div>
      </aside>

      {/* Мобільний: сітка з двох рядків — вміст (auto) і авто (решта висоти екрана),
          тож авто лише заповнює вільне місце й ніколи не додає скролу. */}
      <main className="relative grid grid-rows-[auto_minmax(0,1fr)] justify-items-center px-4 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] pb-[env(safe-area-inset-bottom)] lg:flex lg:flex-row lg:items-center lg:justify-center lg:p-6 2xl:p-8">
        <MobileWaves />

        <div className="relative z-10 w-full md:max-w-[480px] lg:flex lg:min-h-[calc(100svh-48px)] lg:max-w-none lg:items-center lg:self-stretch lg:rounded-[28px] lg:border lg:border-[rgba(15,23,42,0.04)] lg:bg-white lg:px-[clamp(32px,4vw,72px)] lg:py-12 lg:shadow-[0_10px_40px_rgba(15,23,42,0.08)] 2xl:min-h-[calc(100svh-64px)]">
          <div className="mx-auto w-full max-w-[560px]">{children}</div>
        </div>

        {/* Авто під карткою — лише на мобільному. Притиснуте до картки (items-start).
            Обгортка — size-контейнер на всю висоту рядка, що лишився під карткою;
            ширина фото = менше з 112cqw і 100cqh × пропорції (краї фото виходять
            за екран, машина лишається цілою), тож воно зменшується, а не розтягує
            сторінку. Якщо місця менше 150px або екран нижчий за 620px — не показуємо. */}
        <div
          aria-hidden
          className="flex min-h-0 w-[calc(100%+32px)] max-w-[560px] items-start justify-center pt-3 [container-type:size] lg:hidden [@media(max-height:620px)]:hidden"
        >
          <Image
            src={authCarMobile}
            alt=""
            sizes="(min-width: 600px) 630px, 112vw"
            className="block h-auto w-[min(112cqw,calc(100cqh*1226/687))] max-w-none shrink-0 [@container(max-height:150px)]:hidden"
            style={{
              // краї фото (верх, низ, боки) м'яко переходять у фон сторінки
              maskImage:
                "linear-gradient(to bottom, transparent, #000 6%, #000 86%, transparent), linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </div>
      </main>
    </div>
  )
}

/** Декоративні м'які хвилі мобільного фону: велика зліва зверху і дві на правому краї. */
function MobileWaves() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full lg:hidden"
      viewBox="0 0 390 844"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* ліва верхня діагональна */}
      <path d="M0 0 H250 C175 70 105 190 0 470 Z" fill="#DCE7FC" fillOpacity="0.7" />
      <path d="M0 0 H165 C120 60 70 160 38 270 C24 320 10 355 0 375 Z" fill="#C9DBFA" fillOpacity="0.6" />
      {/* права — на висоті заголовка */}
      <path d="M390 140 C332 200 300 272 326 336 C344 380 368 404 390 414 Z" fill="#DCE7FC" fillOpacity="0.8" />
      {/* права — на висоті кнопки */}
      <path d="M390 462 C342 512 318 574 348 636 C362 664 378 684 390 694 Z" fill="#C9DBFA" fillOpacity="0.6" />
    </svg>
  )
}
