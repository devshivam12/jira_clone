import { Controller } from 'react-hook-form'
import { Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// The work item title, edited in place.
//
// Closed, it shows a short preview so a long summary does not push the rest of
// the screen down. Clicking opens an auto growing field where the whole text is
// visible. Enter saves, Shift+Enter adds a line, Escape cancels.
//
// `textClass` lets each screen pick its own size. The drawer is narrow so it
// uses text-2xl, the full page has room for text-3xl.
const TaskSummaryField = ({
    control,
    isEditing,
    setIsEditing,
    tempSummary,
    setTempSummary,
    summaryRef,
    onSave,
    textClass = 'text-2xl md:text-2xl',
    // Whole class name, not a number. Tailwind only keeps classes it can find
    // written out in the source, so a built up `line-clamp-${n}` never ships.
    previewClass = 'line-clamp-2'
}) => {
    return (
        <div className="w-full">
            <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                    !isEditing ? (
                        <div
                            title={field.value || ""}
                            className={`${textClass} ${previewClass} leading-snug font-semibold text-neutral-800 py-2 px-3 hover:bg-neutral-200/50 rounded-md cursor-text transition-all min-h-[48px] break-words border border-transparent`}
                            onClick={() => {
                                setTempSummary(field.value)
                                setIsEditing(true)
                                setTimeout(() => {
                                    const el = summaryRef.current
                                    if (el) {
                                        el.focus()
                                        // Grow to fit the full summary on open.
                                        el.style.height = 'auto'
                                        el.style.height = `${el.scrollHeight}px`
                                    }
                                }, 50)
                            }}
                        >
                            {field.value || "Your summary"}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full">
                            <Textarea
                                ref={(e) => {
                                    field.ref(e)
                                    summaryRef.current = e
                                }}
                                value={tempSummary}
                                rows={1}
                                onChange={(e) => {
                                    setTempSummary(e.target.value)
                                    // Keep the field tall enough to show the whole summary.
                                    e.target.style.height = 'auto'
                                    e.target.style.height = `${e.target.scrollHeight}px`
                                }}
                                placeholder="Your summary"
                                // The size is repeated with md: so the base Textarea's
                                // md:text-sm does not shrink the summary on a wide screen.
                                className={`${textClass} leading-snug font-semibold text-neutral-800 border-2 border-blue-500 py-2 px-3 shadow-none focus-visible:ring-0 transition-all bg-white resize-none min-h-[48px] overflow-hidden break-words`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        field.onChange(tempSummary)
                                        onSave(tempSummary)
                                    } else if (e.key === 'Escape') {
                                        setIsEditing(false)
                                    }
                                }}
                            />
                            <div className="flex items-center justify-end gap-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-md bg-white hover:bg-neutral-100 shadow-sm border border-neutral-200 text-neutral-600 hover:text-neutral-900"
                                    onClick={() => {
                                        field.onChange(tempSummary)
                                        onSave(tempSummary)
                                    }}
                                >
                                    <Check size={16} strokeWidth={2.5} />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-md bg-white hover:bg-neutral-100 shadow-sm border border-neutral-200 text-neutral-600 hover:text-neutral-900"
                                    onClick={() => setIsEditing(false)}
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </Button>
                            </div>
                        </div>
                    )
                )}
            />
        </div>
    )
}

export default TaskSummaryField
