"use client"

import { Combobox } from "@base-ui/react/combobox"
import { Check, X } from "lucide-react"
import { cn } from "cn"

import { WorkTypeIcon } from "@/components/maintenance/work-type-icon"

export type WorkTypeOption = { id: string; code: string | null; name: string }

const CLEARING_REASONS = new Set<string>(["escape-key", "input-clear", "clear-press", "focus-out"])

/** Мультивибір робіт ТО з чіпами і пошуком. Значення — масив id. */
export function WorkTypesSelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
}: {
  id: string
  options: WorkTypeOption[]
  value: string[]
  onChange: (ids: string[]) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const selected = options.filter((o) => value.includes(o.id))

  return (
    <Combobox.Root
      items={options}
      multiple
      value={selected}
      onValueChange={(next, details) => {
        // Escape і очищення тексту пошуку не мають скидати вже вибрані роботи
        if (CLEARING_REASONS.has(details.reason)) return
        onChange(next.map((o) => o.id))
      }}
      itemToStringLabel={(o) => o.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
    >
      <Combobox.InputGroup
        className={cn(
          "flex min-h-12 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[12px] border border-[#D9DEE7] bg-white px-2.5 py-2 transition-colors focus-within:border-[#1766F2] focus-within:ring-3 focus-within:ring-[#1766F2]/20",
          invalid && "border-destructive focus-within:ring-destructive/20",
          disabled && "opacity-60"
        )}
      >
        <Combobox.Value>
          {(items: WorkTypeOption[]) => (
            <Combobox.Chips
              className="flex w-full flex-wrap items-center gap-1.5"
              aria-label={items.length > 0 ? "Selected work types" : undefined}
            >
              {items.map((item) => (
                <Combobox.Chip
                  key={item.id}
                  aria-label={item.name}
                  className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#EEF3FE] pr-1 pl-1 text-sm font-medium text-[#0B1220] outline-none focus-within:ring-2 focus-within:ring-[#1766F2]/40 data-highlighted:bg-[#DCE7FC]"
                >
                  <WorkTypeIcon code={item.code} size="sm" className="size-6 rounded-[6px]" />
                  {item.name}
                  <Combobox.ChipRemove
                    aria-label={`Remove ${item.name}`}
                    className="grid size-6 place-items-center rounded-[6px] text-[#5B6475] hover:bg-white hover:text-[#0B1220]"
                  >
                    <X className="size-3.5" aria-hidden />
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))}
              <Combobox.Input
                id={id}
                onBlur={onBlur}
                placeholder={items.length > 0 ? "Add more…" : "Search work types, e.g. Oil change"}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className="h-8 min-w-36 flex-1 border-0 bg-transparent px-1.5 text-base text-[#0B1220] outline-none placeholder:text-[#8A93A3]"
              />
            </Combobox.Chips>
          )}
        </Combobox.Value>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="isolate z-50 outline-none">
          <Combobox.Popup className="max-h-[min(var(--available-height),20rem)] w-(--anchor-width) max-w-(--available-width) overflow-y-auto overscroll-contain rounded-xl bg-white p-1.5 text-[#0B1220] shadow-lg ring-1 ring-[#0F172A]/10">
            <Combobox.Empty>
              <p className="px-3 py-2 text-sm text-[#5B6475]">No work types found.</p>
            </Combobox.Empty>
            <Combobox.List>
              {(item: WorkTypeOption) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  className="flex h-11 cursor-default items-center gap-3 rounded-lg px-2.5 text-[15px] outline-none select-none data-highlighted:bg-[#EEF4FF]"
                >
                  <WorkTypeIcon code={item.code} size="sm" />
                  <span className="flex-1 truncate">{item.name}</span>
                  <Combobox.ItemIndicator>
                    <Check className="size-4 text-[#1766F2]" aria-hidden />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
