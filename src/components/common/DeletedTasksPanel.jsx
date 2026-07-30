import React, { useState } from 'react'
import { Trash2, X, RotateCcw, Loader2, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useGetArchivedTasksQuery, useRestoreTaskMutation } from '@/redux/graphql_api/task'
import { useProjectData } from '@/hooks/useProjectData'
import ManageAvatar from './ManageAvatar'
import TooltipWrapper from './TooltipWrapper'
import ShowToast from './ShowToast'
import { Button } from '../ui/button'

// Number of days an archived task is kept before it is removed for good. This
// mirrors the 7 day TTL on the archive collection in the backend.
const RETENTION_DAYS = 7

// Floating dustbin button plus a right side panel that lists the tasks the user
// deleted for this project. Each row can be restored while it is still inside
// the 7 day window.
const DeletedTasksPanel = () => {
    const [open, setOpen] = useState(false)
    const [restoringId, setRestoringId] = useState(null)
    const { workType } = useProjectData()

    const { data, isFetching, refetch } = useGetArchivedTasksQuery(
        {
            operationName: "getArchivedTasks",
            variables: { page: 1, limit: 50 }
        },
        { skip: !open }
    )

    const [restoreTask] = useRestoreTaskMutation()

    const archivedTasks = data?.data?.getArchivedTasks?.data || []
    const total = data?.data?.getArchivedTasks?.total || 0

    const renderIcon = (slug) => {
        const work = workType?.find((t) => t.slug === slug)
        if (!work) return null
        return (
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${work.color}`}>
                <img src={work.icon} className="w-4 h-4 filter brightness-0 invert" alt="" />
            </div>
        )
    }

    const handleRestore = async (item) => {
        setRestoringId(item._id)
        try {
            const payload = {
                operationName: "restoreTask",
                variables: { archiveId: item._id }
            }
            const response = await restoreTask(payload).unwrap()
            if (response?.data?.restoreTask?.status === 200) {
                ShowToast.success("Task restored")
                refetch()
            } else {
                ShowToast.error(response?.data?.restoreTask?.message || "Could not restore the task")
            }
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        } finally {
            setRestoringId(null)
        }
    }

    const expiresLabel = (deletedAt) => {
        if (!deletedAt) return null
        const expiry = new Date(deletedAt)
        expiry.setDate(expiry.getDate() + RETENTION_DAYS)
        if (expiry.getTime() <= Date.now()) return "Removing soon"
        return `Auto removes ${formatDistanceToNow(expiry, { addSuffix: true })}`
    }

    return (
        <>
            {/* Floating dustbin button */}
            <TooltipWrapper content="Deleted items">
                <Button
                    size="lg"
                    type="button"
                    variant="teritary"
                    onClick={() => setOpen(true)}
                    aria-label="Deleted items"
                    className="fixed bottom-6 right-6 z-40 rounded-full border-neutral-200 shadow-lg flex items-center justify-center  hover:text-red-600 transition-colors"
                >
                    <Trash2 size={20} />
                </Button>
            </TooltipWrapper>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/30 animate-in fade-in duration-200"
                        onClick={() => setOpen(false)}
                    />

                    {/* Right side panel */}
                    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-8 w-8 rounded-md bg-red-50 text-red-500">
                                    <Trash2 size={18} />
                                </span>
                                <div>
                                    <h2 className="text-[15px] font-semibold text-neutral-800">Deleted items</h2>
                                    <p className="text-xs text-neutral-500">
                                        {total} item{total === 1 ? '' : 's'} in archive
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="default"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="rounded-md"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100 flex items-start gap-2">
                            <Clock size={15} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Deleted tasks stay here for {RETENTION_DAYS} days. Restore a task to
                                bring it back. After {RETENTION_DAYS} days it is removed for good.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isFetching ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 text-neutral-500">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Loading deleted items...</span>
                                </div>
                            ) : archivedTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-400 px-6 text-center">
                                    <Trash2 size={28} className="text-neutral-300" />
                                    <span className="text-sm">No deleted tasks yet</span>
                                    <span className="text-xs">Tasks you delete will show here for {RETENTION_DAYS} days</span>
                                </div>
                            ) : (
                                <ul className="divide-y divide-neutral-100">
                                    {archivedTasks.map((item) => (
                                        <li key={item._id} className="px-5 py-4 hover:bg-neutral-50/70 transition-colors">
                                            <div className="flex items-start gap-3">
                                                {renderIcon(item.work_type)}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-0.5">
                                                        <span className="font-medium">
                                                            {item.project_key} - {item.taskNumber}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-neutral-800 break-words">
                                                        {item.summary || "Untitled task"}
                                                    </p>

                                                    {item.reason && (
                                                        <div className="mt-2 rounded-md bg-neutral-100/70 px-3 py-2">
                                                            <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-medium mb-0.5">
                                                                Reason
                                                            </p>
                                                            <p className="text-xs text-neutral-600 break-words whitespace-pre-wrap">
                                                                {item.reason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500">
                                                        {item.deletedBy?.name && (
                                                            <span className="flex items-center gap-1.5">
                                                                <ManageAvatar
                                                                    firstName={item.deletedBy.name}
                                                                    image={item.deletedBy.image}
                                                                    size="xs"
                                                                    showTooltip={false}
                                                                />
                                                                <span className="font-medium text-neutral-600">
                                                                    {item.deletedBy.name}
                                                                </span>
                                                            </span>
                                                        )}
                                                        {item.deletedAt && (
                                                            <>
                                                                <span>•</span>
                                                                <TooltipWrapper content={format(new Date(item.deletedAt), "MMM d, yyyy p")}>
                                                                    <span>{formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}</span>
                                                                </TooltipWrapper>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="mt-1.5 flex items-center justify-between gap-2">
                                                        <span className="text-[11px] text-amber-600">
                                                            {expiresLabel(item.deletedAt)}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="teritary"
                                                            onClick={() => handleRestore(item)}
                                                            disabled={restoringId === item._id}
                                                        >
                                                            {restoringId === item._id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <RotateCcw size={14} />
                                                            )}
                                                            Restore
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default DeletedTasksPanel
