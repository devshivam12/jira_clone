import React, { useEffect, useRef, useState } from "react"
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
  width = "250px"
}) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value)
  const defaultOption = options.find((opt) => opt?.isDefault)
  // alert(defaultOption)
  console.log("defaultOption", defaultOption)
  const [searchValue, setSearchValue] = useState("")

  // reset search when opening
  useEffect(() => {
    if (open) {
      setSearchValue("")
    }
  }, [open])

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
          <div className="flex items-center gap-2">
            {/* Selected option with icon */}
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <ManageAvatar
                    firstName={selectedOption.label}
                    image={defaultOption.icon}
                    size="sm"
                  />
                )}
                <div className="flex items-center gap-x-2">
                  <ManageAvatar
                    firstName={selectedOption.label}
                    image={defaultOption.icon}
                    size="sm"
                  />
                  {selectedOption.label}
                </div>

              </>
            ) : defaultOption ? (
              // Default option as fallback
              <>
                {defaultOption.icon && (
                  <ManageAvatar
                    image={defaultOption.icon}
                  />
                )}
                {defaultOption.label}
              </>
            ) : (
              <ManageAvatar
                firstName={selectedOption.label}
              />
            )}
          </div>
          <ChevronDownIcon className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 ", contentClassName)}
        style={{ width }}
        onOpenAutoFocus={(e) => {
          e.preventDefault() // stop auto-focus on input
        }}
      >
        <Command
          value={searchValue}
          onValueChange={setSearchValue}
          className="bg-neutral-100"
        >
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <DottedSeparator />
          {/* 👇 key makes CommandList reset when dropdown opens */}
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
                    value === opt.value &&
                    "bg-neutral-200/30 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border"
                  )}
                >
                  {opt.icon && (
                    <img
                      src={opt.icon}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                    />
                  )}
                  <ManageAvatar
                    firstName={opt.label}
                    image={opt.icon}
                  />
                  {opt.label}

                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
