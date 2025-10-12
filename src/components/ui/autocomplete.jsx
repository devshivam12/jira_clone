import React, { useEffect, useState } from "react"
import { Check, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DottedSeparator } from "../dotted-separator"
import ManageAvatar from "../common/ManageAvatar"

export default function AutoComplete({
  options = [],
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  value,
  onChange,
  buttonClassName,
  contentClassName,
  width = "250px",
}) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value)
  const defaultOption = options.find((opt) => opt?.isDefault)
  // console.log("defaultOPp", defaultOption)
  // console.log("defaultOption.value", defaultOption.value)
  const [searchValue, setSearchValue] = useState("")

  // reset search when opening
  useEffect(() => {
    if (open) setSearchValue("")
  }, [open])
  const effectiveValue = value || (defaultOption ? defaultOption.value : null)
  // console.log("effectiveValue", effectiveValue)
  // 🔹 Utility to render any option consistently
  const renderOption = (opt) => (
    opt.hasOwnProperty('icon') ? (
      <div className="flex items-center gap-x-2">
        <ManageAvatar firstName={opt.label} image={opt.icon} size="sm" />
        {opt.label}
      </div>
    ) : (
      opt.label
    )
  );
  // 🔹 Decide what to show in button
  let displayValue
  if (selectedOption) {
    displayValue = renderOption(selectedOption)
  } else if (defaultOption) {
    displayValue = renderOption(defaultOption)
  } else {
    displayValue = placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-neutral-100 border-neutral-300",
            buttonClassName
          )}
          style={{ width }}
        >
          {displayValue}
          <ChevronDownIcon className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("p-0", contentClassName)}
        style={{ width }}
        onOpenAutoFocus={(e) => e.preventDefault()} // stop auto-focus on input
      >
        <Command
          value={searchValue}
          onValueChange={setSearchValue}
          className="bg-neutral-100"
        >
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <DottedSeparator />

          {/* 👇 key ensures fresh list when dropdown opens */}
          <CommandList key={open ? "open" : "closed"}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  keywords={[opt.label]}
                  onSelect={() => {
                    onChange?.(opt.value)
                    setOpen(false)
                    setSearchValue("")
                  }}
                  className={cn(
                    "gap-2 py-2 px-2 cursor-pointer my-2 relative",
                    effectiveValue === opt.value &&
                    "bg-neutral-200/30 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border"
                  )}
                >
                  {renderOption(opt)}
                  {/* {opt.value === value && (
                    <Check className="ml-auto h-4 w-4 opacity-60" />
                  )} */}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
