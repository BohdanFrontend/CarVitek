import { Car, Droplets, Fuel, Zap, type LucideIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "cn"

import { ENGINE_LABELS, carName, type EngineType } from "@/lib/cars/format"
import { formatKm } from "@/lib/format"
import { dashboardCardClass } from "./card-styles"
import { UpdateMileageDialog } from "./update-mileage-dialog"

type HeroCardProps = {
  car: {
    id: string
    make: string
    model: string
    year: number | null
    engine_type: EngineType
    current_mileage: number
  }
  photoUrl: string | null
  avgConsumption: number | null
}

/**
 * Головна картка авто.
 * Мобільний: фото на всю ширину (16:9), під ним назва, пробіг і чіпи в рядок.
 * Десктоп: фото ліворуч з назвою під ним, праворуч пробіг, чіпи і «Update mileage».
 */
export function HeroCard({ car, photoUrl, avgConsumption }: HeroCardProps) {
  const title = car.year ? `${carName(car)} ${car.year}` : carName(car)
  const electric = car.engine_type === "electric"

  return (
    <section
      aria-label={`${title}, current mileage ${formatKm(car.current_mileage)}`}
      className={cn(dashboardCardClass, "p-3 lg:p-5 2xl:p-7 3xl:p-9 4xl:p-11")}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-7 2xl:gap-9 3xl:gap-12">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-[14px] bg-[#EAF1FE] lg:aspect-[4/3] 3xl:rounded-[18px]">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={title}
                fill
                preload
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-[#8FB2F5]">
                <Car className="size-16 lg:size-20" strokeWidth={1.4} aria-hidden />
              </div>
            )}
          </div>
          <h2 className="mt-3.5 hidden text-[17px] font-bold text-[#0B1220] lg:block 2xl:mt-4 2xl:text-[20px] 3xl:mt-5 3xl:text-[24px] 4xl:text-[28px]">{title}</h2>
        </div>

        <div className="flex flex-col px-2 pb-2 lg:justify-center lg:px-0 lg:pb-0">
          <h2 className="text-[17px] font-bold text-[#0B1220] lg:hidden">{title}</h2>
          <p className="mt-1 text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] whitespace-nowrap text-[#0B1220] lg:mt-0 lg:text-[44px] xl:text-[50px] 2xl:text-[58px] 3xl:text-[72px] 4xl:text-[88px]">
            {formatKm(car.current_mileage)}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2.5 lg:flex-col lg:items-start 2xl:mt-6 2xl:gap-3 3xl:mt-8 3xl:gap-4">
            <Chip icon={electric ? Zap : Fuel} iconClassName={electric ? "text-[#15803D]" : undefined}>
              {ENGINE_LABELS[car.engine_type]}
            </Chip>
            {!electric && (
              <Chip icon={Droplets}>
                Avg {avgConsumption != null ? avgConsumption.toFixed(1) : "—"} L/100 km
              </Chip>
            )}
          </ul>

          <div className="mt-4 lg:mt-6 2xl:mt-8 3xl:mt-10">
            <UpdateMileageDialog carId={car.id} currentMileage={car.current_mileage} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** «Чіп»: світло-блакитний фон, іконка в білому квадраті. */
function Chip({
  icon: Icon,
  iconClassName,
  children,
}: {
  icon: LucideIcon
  iconClassName?: string
  children: React.ReactNode
}) {
  return (
    <li className="inline-flex items-center gap-2.5 rounded-[12px] bg-[#EEF3FE] p-1.5 pr-3.5 text-[15px] font-medium 2xl:rounded-[14px] 2xl:p-2 2xl:pr-5 2xl:text-[17px] 3xl:rounded-[16px] 3xl:pr-6 3xl:text-xl 4xl:p-2.5 4xl:pr-7 4xl:text-[22px] text-[#0B1220]">
      <span className="grid size-9 place-items-center rounded-[10px] bg-white 2xl:size-11 2xl:rounded-[12px] 3xl:size-13 4xl:size-15 4xl:rounded-[14px]">
        <Icon className={cn("size-5 text-[#0B1220] 2xl:size-6 3xl:size-7 4xl:size-8", iconClassName)} strokeWidth={1.9} aria-hidden />
      </span>
      {children}
    </li>
  )
}
