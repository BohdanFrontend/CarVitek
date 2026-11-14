"use client"

import { LogOut } from "lucide-react"
import { useTransition } from "react"

import { signOut } from "@/app/(auth)/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ShellUser = { name: string; email: string }

/** «Ivan Petrenko» → «IP»; без імені — перша літера email. */
function initials({ name, email }: ShellUser) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length ? parts.slice(0, 2).map((p) => p[0]) : [email[0] ?? "?"]
  return letters.join("").toUpperCase()
}

/** Аватар з ініціалами й меню: ім'я, email, вихід. */
export function UserMenu({ user }: { user: ShellUser }) {
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[#1766F2]/40"
        aria-label="Account menu"
      >
        <Avatar className="size-10 after:border-0">
          <AvatarFallback className="bg-[#E8F0FE] text-[15px] font-bold text-[#1766F2]">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2">
            <span className="block truncate text-[15px] font-semibold text-[#0B1220]">
              {user.name || "My account"}
            </span>
            <span className="block truncate text-[13px] font-normal text-[#5B6475]">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onClick={() => startTransition(() => signOut())}
          className="h-10 gap-2.5 px-2.5 text-[15px]"
        >
          <LogOut className="size-4.5" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
