import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import ButtonLoader from '../ui/buttonLoader'
import { AlertTriangle } from 'lucide-react'
import { useProjectData } from '@/hooks/useProjectData'

// Preset reasons the user picks from before deleting a task. The chosen reason
// is stored together with the required note so there is always a clear record
// of why the task was deleted.
const DELETE_REASONS = [
    { value: 'duplicate', label: 'Duplicate task' },
    { value: 'no-longer-needed', label: 'No longer needed' },
    { value: 'created-by-mistake', label: 'Created by mistake' },
    { value: 'out-of-scope', label: 'Out of scope' },
    { value: 'moved-elsewhere', label: 'Moved somewhere else' },
    { value: 'other', label: 'Other' }
]

// Dialog shown before a task is deleted. Deleting is a soft delete: the task is
// moved to the archive and can be restored for 7 days. The user first picks a
// reason from the dropdown, then fills a mandatory note.
const DeleteTaskDialog = ({ isOpen, setIsOpen, taskInfo, onConfirm, isLoading }) => {
    const { workType } = useProjectData()
    const [reasonType, setReasonType] = useState("")
    const [notes, setNotes] = useState("")
    const [error, setError] = useState("")

    const matchWorkType = workType?.find(
        (type) => type.slug === taskInfo?.work_type
    )

    // Clear the fields every time the dialog opens so old input is never reused.
    useEffect(() => {
        if (isOpen) {
            setReasonType("")
            setNotes("")
            setError("")
        }
    }, [isOpen])

    const handleConfirm = () => {
        if (!reasonType) {
            setError("Please select a reason for deleting this task")
            return
        }
        const trimmed = notes.trim()
        if (!trimmed) {
            setError("Please add a note that explains this delete")
            return
        }
        if (trimmed.length < 5) {
            setError("Please add at least 5 characters in the note")
            return
        }
        setError("")

        const reasonLabel = DELETE_REASONS.find((r) => r.value === reasonType)?.label || reasonType
        // Store the picked reason and the note together as one string.
        onConfirm?.(`${reasonLabel}: ${trimmed}`)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-x-2 flex-wrap">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500">
                            <AlertTriangle size={16} />
                        </span>
                        <span className="text-neutral-700 font-semibold">Delete work item</span>
                        {matchWorkType && (
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${matchWorkType?.color}`}>
                                <img
                                    src={matchWorkType?.icon}
                                    className="w-3 h-3 filter brightness-0 invert"
                                    alt=""
                                />
                            </span>
                        )}
                        <span className="text-neutral-500 text-base font-medium">
                            {taskInfo?.project_key} - {taskInfo?.taskNumber}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-1">
                    <p className="text-sm text-neutral-500 mb-4">
                        This task will move to the archive. You can restore it within 7 days from
                        the deleted items panel. After 7 days it is removed for good.
                    </p>

                    <Label className="text-sm text-neutral-600 font-medium">
                        Reason for delete <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={reasonType}
                        onValueChange={(val) => {
                            setReasonType(val)
                            if (error) setError("")
                        }}
                    >
                        <SelectTrigger className="mt-2 h-10 text-neutral-700 [&>svg]:text-neutral-500">
                            <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                            {DELETE_REASONS.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {reasonType && (
                        <div className="mt-4 animate-in fade-in duration-200">
                            <Label className="text-sm text-neutral-600 font-medium">
                                Notes <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => {
                                    setNotes(e.target.value)
                                    if (error) setError("")
                                }}
                                placeholder="Add more detail about why this task is being deleted..."
                                className="mt-2 min-h-[100px] resize-none"
                                autoFocus
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <ButtonLoader
                        type="button"
                        size="sm"
                        isLoading={isLoading}
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete task
                    </ButtonLoader>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteTaskDialog
