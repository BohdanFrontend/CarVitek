import { cn } from "cn"

type LogoProps = {
  className?: string
  size?: "sm" | "lg"
}

/** Логотип CarVitex: дуга-силует даху авто над назвою. */
export function Logo({ className, size = "sm" }: LogoProps) {
  const large = size === "lg"
  return (
    <div
      className={cn("inline-flex flex-col items-center leading-none", className)}
      aria-label="CarVitex"
      role="img"
    >
      <svg
        viewBox="0 0 120 30"
        className={cn("text-primary", large ? "-mb-1 w-44" : "-mb-0.5 w-20")}
        fill="none"
        aria-hidden
      >
        <path
          d="M4 27 C18 25 30 21 40 13 C52 3 78 1 93 11 C101 16 109 19 116 25"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M44 25 C60 21 86 21 104 25"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
      <span
        aria-hidden
        className={cn(
          "font-bold tracking-tight text-foreground",
          large ? "text-5xl" : "text-2xl"
        )}
      >
        Car<span className="text-primary">Vitex</span>
      </span>
    </div>
  )
}
