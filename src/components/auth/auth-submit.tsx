import { ArrowRight, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { authSubmitClass } from "./auth-styles"

/**
 * Кнопка відправки форми.
 * Мобільний: текст + стрілка праворуч; під час відправки спінер замість стрілки.
 * Десктоп: без стрілки, спінер перед текстом.
 */
export function AuthSubmit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className={authSubmitClass}>
      {pending && <Loader2 className="hidden size-5 animate-spin lg:block" aria-hidden />}
      {children}
      {pending ? (
        <Loader2 className="size-5 animate-spin lg:hidden" aria-hidden />
      ) : (
        <ArrowRight className="size-5 lg:hidden" aria-hidden />
      )}
    </Button>
  )
}
