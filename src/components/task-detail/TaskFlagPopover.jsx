import { format } from 'date-fns'
import { Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// The red flag in the header of a work item. Clicking it opens who raised the
// flag, when, and why, with a button to clear it. Renders nothing when the item
// is not flagged, so the caller can drop it in without a condition.
const TaskFlagPopover = ({ flagDetail, onRemoveFlag }) => {
    if (!flagDetail?.isFlagged) return null

    // The API returns the person as a single `name`. The split fields are kept
    // as a fallback for callers that still pass the older shape.
    const flaggedByName = flagDetail?.flaggedBy?.name
        || [flagDetail?.flaggedBy?.first_name, flagDetail?.flaggedBy?.last_name].filter(Boolean).join(" ")

    return (
        <Popover modal={false}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    <Flag size={20} fill="currentColor" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                side="bottom"
                sideOffset={12}
                className="w-80 p-0 border border-red-100/80 shadow-xl rounded-xl overflow-hidden bg-white z-[60]"
            >
                <div className="bg-red-50/80 px-4 py-3 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flag size={16} className="text-red-500" fill="currentColor" />
                        <h4 className="text-sm font-semibold text-red-900">Flagged</h4>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-red-700 hover:text-red-800 hover:bg-white border border-transparent hover:border-red-200 shadow-sm"
                        onClick={(e) => {
                            e.preventDefault()
                            onRemoveFlag?.()
                        }}
                    >
                        Remove flag
                    </Button>
                </div>
                <div className="p-4 text-sm bg-white">
                    {(flaggedByName || flagDetail?.flaggedAt) && (
                        <div className="mb-3 flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-neutral-500">
                            {flaggedByName && (
                                <span className="font-medium text-neutral-700">By {flaggedByName}</span>
                            )}
                            {flagDetail?.flaggedAt && flaggedByName && <span>•</span>}
                            {flagDetail?.flaggedAt && (
                                <span>{format(new Date(flagDetail.flaggedAt), "MMM d, yyyy")}</span>
                            )}
                        </div>
                    )}
                    {flagDetail?.reason ? (
                        <div
                            className="text-neutral-600 leading-relaxed break-words"
                            dangerouslySetInnerHTML={{ __html: flagDetail.reason }}
                        />
                    ) : (
                        <span className="text-neutral-500 italic">No reason provided</span>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default TaskFlagPopover
