import { cn } from "cn"

type LogoProps = {
  className?: string
  /** sm — компактний, md — шапка мобільних екранів входу (~50% ширини, max ~207px), lg — ліва панель */
  size?: "sm" | "md" | "lg"
}

const SIZES = {
  sm: "text-[34px]",
  // ширина слова ≈ 4.14em → 12vw ≈ 50% ширини екрана, 50px ≈ 207px
  md: "text-[min(12vw,50px)]",
  lg: "text-[72px]",
} as const

/**
 * Логотип CarVitex: товста дуга-силует даху авто над назвою і тонша
 * паралельна «лінія вікон» під її правою половиною.
 *
 * Як прибрано проміжок без від'ємних відступів:
 * - leading-[0.73] під метрики Inter (висота великих літер ≈ 0.727em) робить
 *   бокс слова рівно від верху великих літер до базової лінії (у «CarVitex»
 *   немає виносних елементів униз);
 * - у viewBox дуги немає порожнього місця знизу, а між дугою й словом —
 *   лише gap 0.045em (≈3px для lg).
 * Ширина SVG = ширина слова: `w-0 min-w-full` не дає SVG впливати на ширину
 * колонки, а потім розтягує його до неї.
 * У viewBox 1000 од. = ширина слова, висота великих літер ≈ 176 од.:
 * основна лінія 12 од. (≈7%), тонка 5 од. (≈3%).
 */
export function Logo({ className, size = "sm" }: LogoProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col gap-[0.045em] font-extrabold tracking-[-0.02em]",
        SIZES[size],
        className
      )}
      aria-label="CarVitex"
      role="img"
    >
      <svg
        viewBox="0 0 1000 146"
        className="block h-auto w-0 min-w-full text-[#1766F2]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* над «C» низько → вершина над «rV» → опускається над «x» */}
        <path
          d="M8 126 C120 108 250 50 330 22 C380 6 460 4 540 16 C700 40 860 90 992 140"
          strokeWidth="12"
        />
        {/* лінія вікон: від «V» до «e», ~45% ширини слова */}
        <path d="M440 38 C590 46 740 80 880 128" strokeWidth="5" />
      </svg>
      <span aria-hidden className="block leading-[0.73] whitespace-nowrap text-[#0B1220]">
        Car<span className="text-[#1766F2]">Vitex</span>
      </span>
    </div>
  )
}
