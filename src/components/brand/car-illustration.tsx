import { cn } from "cn"

/**
 * Узагальнена ілюстрація хетчбека — запасний варіант, коли немає
 * фото public/auth-car.webp. Тінь під колесами малює батьківський контейнер.
 */
export function CarIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 145" className={cn("block w-full", className)} aria-hidden>
      <defs>
        <linearGradient id="cv-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6b82" />
          <stop offset="1" stopColor="#323d4e" />
        </linearGradient>
        <linearGradient id="cv-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* кузов */}
      <path
        d="M30 110 L30 92 Q32 80 50 76 L110 70 Q140 40 175 34 L250 32 Q285 33 310 60 L345 70 Q370 76 372 92 L372 110 Q372 116 366 116 L330 116 A32 32 0 0 0 266 116 L140 116 A32 32 0 0 0 76 116 L36 116 Q30 116 30 110 Z"
        fill="url(#cv-body)"
      />
      {/* вікна */}
      <path d="M124 70 Q148 47 178 42 L210 41 L211 70 Z" fill="url(#cv-glass)" />
      <path d="M222 41 L250 40 Q278 42 297 66 L222 70 Z" fill="url(#cv-glass)" />
      {/* лінія дверей і молдинг */}
      <path d="M216 72 L216 112" stroke="#1f2937" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M48 92 L354 92" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" />
      {/* фари */}
      <path d="M352 80 L368 84 L368 92 L352 90 Z" fill="#e0f2fe" />
      <path d="M32 84 L44 82 L44 90 L32 92 Z" fill="#fca5a5" />

      {/* колеса */}
      {[108, 298].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="116" r="25" fill="#111827" />
          <circle cx={cx} cy="116" r="13" fill="#cbd5e1" />
          <circle cx={cx} cy="116" r="4" fill="#64748b" />
        </g>
      ))}
    </svg>
  )
}
