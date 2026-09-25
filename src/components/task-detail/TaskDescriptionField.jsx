import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import RichTextEditor from '@/components/ui/richTextEditor'

// Description of a work item. Reads as plain formatted text until it is
// clicked, then turns into the rich text editor with its own Save and Cancel.
// Saving is explicit here because a description is usually a long edit and an
// accidental blur should not write it.
const TaskDescriptionField = ({
    control,
    isEditing,
    setIsEditing,
    onSave,
    minHeight = '150px',
    showLabel = true
}) => {
    return (
        <div className="flex flex-col gap-2">
            {showLabel && (
                <Label className="text-neutral-600 font-medium text-sm ml-1">Description</Label>
            )}

            {!isEditing ? (
                <div
                    onClick={() => setIsEditing(true)}
                    className="min-h-[60px] py-3 px-3 border border-neutral-200 hover:border-neutral-400/50 rounded-md transition cursor-pointer hover:bg-neutral-100/50"
                >
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            field.value ? (
                                <div
                                    className="text-neutral-500 px-2 font-normal text-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: field.value }}
                                />
                            ) : (
                                <span className="text-neutral-400">Add a description....</span>
                            )
                        )}
                    />
                </div>
            ) : (
                <div className="mt-2 overflow-hidden animate-in fade-in duration-200">
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <div className="mt-2 border rounded-md overflow-hidden">
                                <RichTextEditor
                                    content={field.value}
                                    onChange={field.onChange}
                                    placeholder="Add description..."
                                    minHeight={minHeight}
                                />
                            </div>
                        )}
                    />
                    <div className="flex justify-end gap-2 p-2 bg-neutral-50 border-t">
                        <Button
                            variant="default"
                            type="button"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="teritary"
                            type="button"
                            size="sm"
                            onClick={onSave}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TaskDescriptionField
