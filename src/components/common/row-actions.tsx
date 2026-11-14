"use client"

import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ActionResult = { ok: true } | { ok: false; message: string }

type RowActionsProps = {
  /** Підпис для скрінрідера: «Actions for 14 Sep 2026 service» */
  label: string
  /** Посилання на редагування або власний обробник (наприклад, відкрити діалог) */
  editHref?: string
  onEdit?: () => void
  onDelete: () => Promise<ActionResult>
  deleteTitle: string
  deleteDescription: string
  deletedMessage: string
  className?: string
}

/** Меню ⋮ рядка: Edit і Delete з підтвердженням (AlertDialog) і toast. */
export function RowActions({
  label,
  editHref,
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription,
  deletedMessage,
  className,
}: RowActionsProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  const remove = () =>
    startDelete(async () => {
      const res = await onDelete()
      if (res.ok) {
        setConfirmOpen(false)
        toast.success(deletedMessage)
      } else {
        toast.error(res.message)
      }
    })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={label}
          className={cn(
            "grid size-9 place-items-center rounded-full text-[#0B1220] transition-colors outline-none hover:bg-[#F1F4F9] focus-visible:ring-3 focus-visible:ring-[#1766F2]/30",
            className
          )}
        >
          <EllipsisVertical className="size-5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
          <DropdownMenuItem
            onClick={() => (onEdit ? onEdit() : editHref && router.push(editHref))}
            className="h-10 gap-2.5 px-2.5 text-[15px]"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="h-10 gap-2.5 px-2.5 text-[15px]"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !deleting && setConfirmOpen(open)}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#0B1220]">{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] text-[#5B6475]">
              {deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={remove}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
