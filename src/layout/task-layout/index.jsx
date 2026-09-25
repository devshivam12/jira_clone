import { useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { ArrowLeft, ChevronRight, Link as LinkIcon, Pen, Plus, ThumbsUp, X } from 'lucide-react'

import AddFlag from '@/components/common/AddFlag'
import ChildIssuesSection from '@/components/common/ChildIssuesSection'
import CommentComponent from '@/components/common/CommentComponent'
import CommonDropdownMenu from '@/components/common/CommonDropdownMenu'
import DeleteTaskDialog from '@/components/common/DeleteTaskDialog'
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import WorkSelector from '@/components/common/WorkSelector'
import TaskDescriptionField from '@/components/task-detail/TaskDescriptionField'
import TaskDueDateField from '@/components/task-detail/TaskDueDateField'
import TaskFlagPopover from '@/components/task-detail/TaskFlagPopover'
import TaskPeopleFields from '@/components/task-detail/TaskPeopleFields'
import TaskSummaryField from '@/components/task-detail/TaskSummaryField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTaskDetail } from '@/hooks/useTaskDetail'

// A date the API may or may not send. Returns a dash rather than an empty gap,
// so the Details column keeps its shape.
const showDate = (value) => {
    if (!value) return "—"
    const parsed = new Date(Number.isNaN(Number(value)) ? value : Number(value))
    if (Number.isNaN(parsed.getTime())) return "—"
    return format(parsed, "d MMM yyyy")
}

const DetailRow = ({ label, children }) => (
    <div className="flex flex-col gap-1.5">
        <Label className="text-sm text-neutral-600 font-medium">{label}</Label>
        {children}
    </div>
)

// Full page view of one work item, at
// /dashboard/:project_slug/:template_slug/view/:task_id
//
// It shows and saves exactly what the drawer does, but with room to work: the
// summary, description, children and comments run down a wide main column while
// status, people, labels and dates stay in a column on the right that does not
// scroll away. The drawer is 480px, which is fine for a quick look and cramped
// for real editing, so "Open in new tab" in the drawer header brings you here.
const TaskView = () => {
    const { task_id: taskId, project_slug, template_slug } = useParams()
    const navigate = useNavigate()

    const backToList = useMemo(
        () => `/dashboard/${project_slug}/${template_slug}/backlog`,
        [project_slug, template_slug]
    )

    // Archiving the item leaves nothing to show, so the page steps back to the
    // list it came from.
    const handleAfterDelete = useCallback(() => {
        navigate(backToList)
    }, [navigate, backToList])

    const {
        task,
        taskDetail,
        taskKey,
        taskFetching,
        currentProject,
        userData,
        parentHeaderLabel,

        control,

        taskTypes,
        importanceTypes,
        renderIcon,

        activeDropdown,
        toggleTaskStatusDropdown,
        toggleImportanceDropdown,

        isEditingSummary,
        setIsEditingSummary,
        tempSummary,
        setTempSummary,
        summaryRef,
        handleSaveSummary,

        isEditing,
        setIsEditing,
        handleSaveDescription,

        openParent,
        setOpenParent,
        handleSelectEpic,
        handleRemoveEpic,

        changeTaskStatus,
        changeImportance,
        changeAssignee,
        changeLabels,
        changeTeam,
        changeReporter,
        changeDueDate,

        vote,
        voteDetail,
        voteLoading,
        addVoteLoading,
        handleVoteOpen,

        isFlagDialogOpen,
        setIsFlagDialogOpen,
        currentFlagTask,
        closeFlagDialog,
        confirmFlag,
        removeFlag,

        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        handleDeleteTask,
        deleteLoading,

        workItemMenuItems,
        workRelatItem,
        handleCopyLink
    } = useTaskDetail(taskId, { onAfterDelete: handleAfterDelete })

    // Opening a child or the parent keeps you on the full page instead of
    // dropping back to the list.
    const openRelatedTask = useCallback((relatedId) => {
        if (!relatedId) return
        navigate(`/dashboard/${project_slug}/${template_slug}/view/${relatedId}`)
    }, [navigate, project_slug, template_slug])

    if (taskFetching || (!task && taskId)) {
        return (
            <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-11 w-3/5 mt-6" />
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 mt-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-9 w-10" />
                        </div>
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    // A stale or wrong id in the address bar. Say so instead of showing an
    // empty page that looks broken.
    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
                <p className="text-lg font-semibold text-neutral-700">This work item is not available</p>
                <p className="text-sm text-neutral-500 max-w-md">
                    It may have been archived, or the link points to an item in another project.
                </p>
                <Button variant="teritary" size="sm" onClick={() => navigate(backToList)}>
                    Back to backlog
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full bg-white">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header: where the item sits, and what you can do to it */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <TooltipWrapper content="Back to backlog">
                            <Link
                                to={backToList}
                                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </Link>
                        </TooltipWrapper>

                        {task?.parentDetail ? (
                            <button
                                type="button"
                                onClick={() => openRelatedTask(task.parentDetail._id)}
                                className="flex items-center gap-2 min-w-0 max-w-[280px] px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors"
                                title={parentHeaderLabel}
                            >
                                {renderIcon('epic')}
                                <span className="text-xs font-medium text-neutral-600 truncate hover:underline">
                                    {parentHeaderLabel}
                                </span>
                            </button>
                        ) : (
                            <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-neutral-500 hover:bg-neutral-100 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add epic
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-0" align="start" sideOffset={8} forceMount>
                                    <DynamicDropdownSelector
                                        slug="parent"
                                        onChange={handleSelectEpic}
                                        label="Select epic"
                                        showDropdown
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <ChevronRight size={14} className="text-neutral-300 shrink-0" />

                        <div className="flex items-center gap-2 min-w-0">
                            {renderIcon(taskDetail?.work_type)}
                            <span className="text-sm font-semibold text-neutral-700 whitespace-nowrap">
                                {taskKey}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {vote.count > 0 && (
                            <CommonDropdownMenu
                                trigger={
                                    <Button size="sm" variant="teritary" type="button" disabled={addVoteLoading}>
                                        <ThumbsUp size={18} className={vote.hasVoted ? 'fill-blue-600 text-blue-600' : ''} />
                                        <span className={vote.hasVoted ? 'text-blue-600' : ''}>{vote.count}</span>
                                    </Button>
                                }
                                items={voteDetail}
                                isLoading={voteLoading}
                                onOpenChange={handleVoteOpen}
                            />
                        )}

                        <TaskFlagPopover flagDetail={task?.flagDetail} onRemoveFlag={removeFlag} />

                        <TooltipWrapper content="Copy link">
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={handleCopyLink}
                                className="text-neutral-500 hover:text-neutral-700"
                            >
                                <LinkIcon size={18} />
                            </Button>
                        </TooltipWrapper>

                        <CommonDropdownMenu items={workItemMenuItems} />
                    </div>
                </div>

                {/* Title, full width above both columns so a long one has room */}
                <div className="mt-4">
                    <TaskSummaryField
                        control={control}
                        isEditing={isEditingSummary}
                        setIsEditing={setIsEditingSummary}
                        tempSummary={tempSummary}
                        setTempSummary={setTempSummary}
                        summaryRef={summaryRef}
                        onSave={handleSaveSummary}
                        textClass="text-2xl md:text-3xl"
                        previewClass="line-clamp-3"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 mt-4">

                    {/* Main column */}
                    <div className="min-w-0 flex flex-col gap-6">
                        <div className="flex items-center flex-wrap gap-3">
                            <Controller
                                name="task_status"
                                control={control}
                                render={({ field }) => (
                                    <WorkSelector
                                        initialValue={field.value}
                                        key={field.value}
                                        value={field.value}
                                        workTypes={taskTypes}
                                        open={activeDropdown === 'task_status'}
                                        onOpenChange={toggleTaskStatusDropdown}
                                        onChange={(val) => {
                                            field.onChange(val)
                                            if (val) changeTaskStatus(val)
                                        }}
                                    />
                                )}
                            />
                            <Controller
                                name="importance"
                                control={control}
                                render={({ field }) => (
                                    <WorkSelector
                                        initialValue={field.value}
                                        key={field.value}
                                        value={field.value}
                                        workTypes={importanceTypes}
                                        open={activeDropdown === 'importance'}
                                        onOpenChange={toggleImportanceDropdown}
                                        onChange={(val) => {
                                            field.onChange(val)
                                            if (val) changeImportance(val)
                                        }}
                                    />
                                )}
                            />
                            <div className="border border-input bg-neutral-50 shadow-none rounded-md hover:bg-accent hover:text-accent-foreground text-neutral-500">
                                <CommonDropdownMenu
                                    triggerIcon={<Plus size={18} />}
                                    triggerTooltip="Add or create related work"
                                    items={workRelatItem}
                                />
                            </div>
                        </div>

                        {/* The extra width is the point of this page, so the
                            editor gets a taller box than it has in the drawer. */}
                        <TaskDescriptionField
                            control={control}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onSave={handleSaveDescription}
                            minHeight="260px"
                        />

                        <ChildIssuesSection
                            taskId={taskId}
                            projectId={currentProject?._id}
                            onOpenChild={openRelatedTask}
                        />

                        <div>
                            <Label className="text-neutral-500">Activity</Label>
                            {/* defaultValue matters: without it no tab is picked
                                and the comment box stays hidden until clicked. */}
                            <Tabs defaultValue="comments">
                                <TabsList>
                                    <TabsTrigger value="comments">Comments</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                </TabsList>
                                <TabsContent value="comments">
                                    <CommentComponent userData={userData} />
                                </TabsContent>
                                <TabsContent value="history">
                                    <p className="py-6 text-sm text-neutral-400">
                                        The change history is not available yet.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Details column. Sticky so the fields stay reachable while
                        the description and comments scroll. */}
                    <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
                        <Card className="shadow-sm border-neutral-200 rounded-md">
                            <CardHeader className="py-3 px-4 bg-neutral-100/80 border-b border-neutral-200">
                                <span className="text-neutral-700 font-medium text-base">Details</span>
                            </CardHeader>
                            <CardContent className="bg-neutral-200/10 py-5 px-4 flex flex-col gap-5 rounded-b-md">
                                <TaskPeopleFields
                                    control={control}
                                    changeAssignee={changeAssignee}
                                    changeLabels={changeLabels}
                                    changeTeam={changeTeam}
                                    changeReporter={changeReporter}
                                />

                                <TaskDueDateField control={control} onChange={changeDueDate} />

                                <DetailRow label="Parent">
                                    {task?.parentDetail ? (
                                        <div className="group flex items-center gap-2 border border-neutral-300 rounded-md px-2 py-2 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => openRelatedTask(task.parentDetail._id)}
                                                className="min-w-0 flex-1 text-left text-sm text-neutral-600 truncate hover:underline"
                                                title={parentHeaderLabel}
                                            >
                                                {task.parentDetail.summary}
                                            </button>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                                    <TooltipWrapper content="Change parent">
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" type="button" className="h-7 w-7">
                                                                <Pen size={14} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                    </TooltipWrapper>
                                                    <DropdownMenuContent className="w-64 p-0" align="end" sideOffset={8} forceMount>
                                                        <DynamicDropdownSelector
                                                            slug="parent"
                                                            onChange={handleSelectEpic}
                                                            label="Select epic"
                                                            showDropdown
                                                        />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <TooltipWrapper content="Remove parent">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        type="button"
                                                        className="h-7 w-7"
                                                        onClick={handleRemoveEpic}
                                                    >
                                                        <X size={14} />
                                                    </Button>
                                                </TooltipWrapper>
                                            </div>
                                        </div>
                                    ) : (
                                        <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-2 border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-400 hover:border-neutral-400 transition-colors"
                                                >
                                                    <Plus size={14} /> Select epic
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64 p-0" align="start" sideOffset={8} forceMount>
                                                <DynamicDropdownSelector
                                                    slug="parent"
                                                    onChange={handleSelectEpic}
                                                    label="Select epic"
                                                    showDropdown
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </DetailRow>

                                <div className="border-t border-neutral-200 pt-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-neutral-500">Created</span>
                                        <span className="text-sm text-neutral-700 font-medium">
                                            {showDate(task?.createdAt)}
                                        </span>
                                    </div>
                                    {/* Due date is not repeated here: it sits in
                                        the field above, where it can be changed. */}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-neutral-500">Created by</span>
                                        <span className="text-sm text-neutral-700 font-medium truncate max-w-[180px]">
                                            {task?.creatorDetail?.name || "—"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {currentFlagTask && (
                <AddFlag
                    isOpen={isFlagDialogOpen}
                    setIsOpen={setIsFlagDialogOpen}
                    taskInfo={currentFlagTask}
                    isFlagged={true}
                    onConfirm={confirmFlag}
                    onCancel={closeFlagDialog}
                />
            )}

            <DeleteTaskDialog
                isOpen={isDeleteDialogOpen}
                setIsOpen={setIsDeleteDialogOpen}
                taskInfo={{
                    _id: taskId,
                    project_key: task?.project_key,
                    taskNumber: task?.taskNumber,
                    summary: task?.summary,
                    work_type: task?.work_type
                }}
                onConfirm={handleDeleteTask}
                isLoading={deleteLoading}
            />
        </div>
    )
}

export default TaskView
