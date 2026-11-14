/** Колір індикатора: ≥80 зелений, ≥50 бурштиновий, інакше червоний. */
const ringColor = (score: number) => (score >= 80 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444")

/** Круговий індикатор стану ТО (44px) з відсотком у центрі. */
export function HealthRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = ringColor(score)
  return (
    <span
      role="img"
      aria-label={`Maintenance health ${score}%`}
      title={`Maintenance health: ${score}%`}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1F6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span aria-hidden className="absolute text-[12px] font-bold text-[#0B1220]">
        {score}%
      </span>
    </span>
  )
}
