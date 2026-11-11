import { Logo } from "@/components/brand/logo"

/** Заголовок картки форми; на мобільному над ним показуємо логотип. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <Logo className="mb-8 lg:hidden" />
      <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
    </header>
  )
}
