import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { format, isValid } from 'date-fns'
import { CalendarDays, X } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// The API sends an ISO string, but a date can also come back as epoch
// milliseconds (sometimes as a string), so both shapes are accepted. Anything
// that is not a real date reads as "no due date" instead of "Invalid Date".
const toDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return isValid(value) ? value : null
    const raw = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
    const parsed = new Date(raw)
    return isValid(parsed) ? parsed : null
}

// The due date on a work item, shown in the Details card of the drawer and of
// the full page. It saves the moment a day is picked, like every other field in
// that card, so there is no separate save step.
//
// `onChange` gets an ISO string (or null when the date is cleared) and the
// value the field held before the pick, which is what the caller puts back if
// the server refuses the new date.
const TaskDueDateField = ({ control, onChange, label = "Due date", disabled = false }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-neutral-600 font-medium">{label}</Label>
            <Controller
                name="dueDate"
                control={control}
                render={({ field }) => {
                    const selected = toDate(field.value)

                    const previous = field.value ?? null

                    const handleSelect = (date) => {
                        if (!date) return
                        const value = date.toISOString()
                        field.onChange(value)
                        onChange?.(value, previous)
                        setOpen(false)
                    }

                    const handleClear = (e) => {
                        // The clear button sits inside the field, and the field
                        // itself opens the calendar.
                        e.stopPropagation()
                        field.onChange(null)
                        onChange?.(null, previous)
                        setOpen(false)
                    }

                    return (
                        <Popover open={open} onOpenChange={setOpen}>
                            <div className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white px-2 py-0.5 transition-colors focus-within:border-neutral-400">
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
                                    >
                                        <CalendarDays size={15} className="shrink-0 text-neutral-400" />
                                        <span
                                            className={cn(
                                                "truncate text-sm",
                                                selected ? "text-neutral-700 font-medium" : "text-neutral-400"
                                            )}
                                        >
                                            {selected ? format(selected, 'd MMM yyyy') : 'Set a due date'}
                                        </span>
                                    </button>
                                </PopoverTrigger>

                                {selected && !disabled && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        title="Clear due date"
                                        aria-label="Clear due date"
                                        className="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selected || undefined}
                                    defaultMonth={selected || undefined}
                                    onSelect={handleSelect}
                                />
                            </PopoverContent>
                        </Popover>
                    )
                }}
            />
        </div>
    )
}

export default TaskDueDateField
