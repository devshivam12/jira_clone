import { useCallback, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, ExternalLink, Link, Pen, Plus, ThumbsUp, X } from 'lucide-react'

import AddFlag from '@/components/common/AddFlag'
import ChildIssuesSection from '@/components/common/ChildIssuesSection'
import CommentComponent from '@/components/common/CommentComponent'
import CommonDropdownMenu from '@/components/common/CommonDropdownMenu'
import DeleteTaskDialog from '@/components/common/DeleteTaskDialog'
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import WorkSelector from '@/components/common/WorkSelector'
import { DottedSeparator } from '@/components/dotted-separator'
import TaskDescriptionField from '@/components/task-detail/TaskDescriptionField'
import TaskDueDateField from '@/components/task-detail/TaskDueDateField'
import TaskFlagPopover from '@/components/task-detail/TaskFlagPopover'
import TaskPeopleFields from '@/components/task-detail/TaskPeopleFields'
import TaskSummaryField from '@/components/task-detail/TaskSummaryField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTaskDetail } from '@/hooks/useTaskDetail'

// The task panel beside the backlog and the timeline. It reads the `issueId`
// search param, so any row click anywhere can open it by setting that one value.
//
// All of the behaviour lives in useTaskDetail, which the full page at
// /dashboard/:project_slug/:template_slug/view/:task_id shares. This file only
// decides how the panel looks in a 480px column.
const EditIssue = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const taskId = searchParams.get('issueId')
    const [isScrolled, setIsScrolled] = useState(false)

    const handleClose = useCallback(() => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev)
            params.delete("issueId")
            return params
        })
    }, [setSearchParams])

    // Clicking a child or the parent swaps the panel over to that item, the
    // same way a row click anywhere else opens one.
    const handleOpenChild = useCallback((childId) => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev)
            params.set("issueId", childId)
            return params
        })
    }, [setSearchParams])

    const {
        task,
        taskDetail,
        taskKey,
        taskUrl,
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

        expandDetails,
        setExpandDetails,

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
    } = useTaskDetail(taskId, { onAfterDelete: handleClose })

    const handleScrollEffect = (e) => {
        const scrolled = e.target.scrollTop > 0
        if (scrolled !== isScrolled) {
            setIsScrolled(scrolled)
        }
    }

    if (taskFetching || (!task && taskId)) {
        return (
            <Card className="flex flex-col h-full rounded-none bg-white shadow-none border-none">
                <div className={`sticky top-0 bg-white z-10`}>
                    <CardHeader className="m-0 pb-0 px-0 pt-2 bg-white">
                        <CardTitle>
                            <div className='flex items-center justify-between px-2 pb-1'>
                                <div className='hover:bg-neutral-200/40 cursor-pointer px-2 py-2 rounded-md'>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className='flex items-center gap-2 pr-1'>
                                    <Skeleton className="h-8 w-14" />
                                    <Skeleton className="h-8 w-10" />
                                    <Skeleton className="h-8 w-10" />
                                    <Skeleton className="h-8 w-10" />
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </div>
                <DottedSeparator className="h-px my-1 bg-neutral-200" />
                <CardContent className="mt-0 w-full overflow-y-auto px-4 lg:px-6 py-6 flex-grow flex flex-col gap-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-sm" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-10 w-4/5" />
                    </div>

                    <div className='flex items-center gap-3'>
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-10" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-28 w-full" />
                    </div>

                    <Skeleton className="h-14 w-full mt-4" />

                    <div className='mt-2 flex flex-col gap-4'>
                        <Skeleton className="h-4 w-16" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <form action="" className="h-full flex flex-col min-h-0">
            <Card className="flex flex-col h-full min-h-0 rounded-none bg-white shadow-none relative border-none">
                <div className={`sticky top-0 bg-white z-10 ${isScrolled ? 'shadow-sm' : ''}`}>
                    <CardHeader className="m-0 pb-0 px-0 pt-2 bg-white">
                        <CardTitle >
                            <div className='flex items-center justify-between px-2 h-12'>
                                <div className='hover:bg-neutral-200/40 cursor-pointer px-2 py-2 rounded-md group flex items-center h-full min-w-0'>
                                    {task?.parentDetail ? (
                                        // A task that belongs to an epic shows the epic name here, so
                                        // the parent is visible without scrolling to the parent row.
                                        <TooltipWrapper content={parentHeaderLabel}>
                                            <div
                                                className="flex items-center gap-2 min-w-0 max-w-[260px]"
                                                onClick={() => handleOpenChild(task.parentDetail._id)}
                                            >
                                                {renderIcon('epic')}
                                                <span className="text-xs font-medium text-neutral-600 truncate group-hover:underline">
                                                    {parentHeaderLabel}
                                                </span>
                                            </div>
                                        </TooltipWrapper>
                                    ) : (
                                        <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <div className="cursor-pointer flex items-center">
                                                    <p className='flex items-center gap-2'>
                                                        <Plus className='flex items-center justify-center w-3 h-3 font-normal text-neutral-500 cursor-pointer' />
                                                        <span className='text-xs text-neutral-500'>
                                                            Add epic
                                                        </span>
                                                    </p>
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-64 p-0"
                                                align="end"
                                                sideOffset={8}
                                                onClick={(e) => e.stopPropagation()}
                                                forceMount={true}
                                            >
                                                <DynamicDropdownSelector
                                                    slug={'parent'}
                                                    onChange={handleSelectEpic}
                                                    label={"Select epic"}
                                                    showDropdown={true}
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <div className='flex items-center h-full gap-1'>
                                    {vote.count > 0 && (
                                        <div className="flex justify-center items-center">
                                            <CommonDropdownMenu
                                                trigger={
                                                    <Button
                                                        size="sm"
                                                        variant="teritary"
                                                        type="button"
                                                        disabled={addVoteLoading}
                                                    >
                                                        <ThumbsUp size={18} className={vote.hasVoted ? 'fill-blue-600 text-blue-600' : ''} />
                                                        <span className={vote.hasVoted ? 'text-blue-600' : ''}>
                                                            {vote.count}
                                                        </span>
                                                    </Button>
                                                }
                                                items={voteDetail}
                                                isLoading={voteLoading}
                                                onOpenChange={handleVoteOpen}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-center items-center">
                                        <TaskFlagPopover flagDetail={task?.flagDetail} onRemoveFlag={removeFlag} />
                                    </div>

                                    {/* The panel is 480px wide, which is tight for a
                                        long description or a busy comment thread.
                                        This opens the same work item on its own page
                                        in a new tab, where there is room for both. */}
                                    {taskUrl && (
                                        <div className="flex justify-center items-center">
                                            <TooltipWrapper content="Open in new tab">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-neutral-500 hover:text-neutral-700"
                                                >
                                                    <a
                                                        href={taskUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        aria-label="Open in new tab"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </a>
                                                </Button>
                                            </TooltipWrapper>
                                        </div>
                                    )}

                                    <div className="flex justify-center items-center">
                                        <CommonDropdownMenu items={workItemMenuItems} />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <Button variant="ghost" size="icon" type="button" onClick={handleClose} className="text-neutral-500 hover:text-neutral-700">
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </div>
                <DottedSeparator className="h-px my-1 bg-neutral-200" />
                <CardContent
                    className="mt-0 w-full overflow-y-auto overscroll-contain px-4 lg:px-6 py-4 flex-grow min-h-0"
                    onScroll={handleScrollEffect}
                >
                    <div className='flex flex-col gap-5 [&::-webkit-scrollbar]:hidden"'>
                        <div className='flex flex-col gap-2'>
                            <div className="flex items-center group">
                                <span className="text-neutral-500 font-normal text-base flex items-center gap-x-2">
                                    {renderIcon(taskDetail?.work_type)}
                                    {taskKey}

                                    <TooltipWrapper content={"Copy link"}>
                                        <Button
                                            variant='default'
                                            size="icon"
                                            type="button"
                                            onClick={handleCopyLink}
                                        >
                                            <Link
                                                size={16}
                                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </Button>
                                    </TooltipWrapper>
                                </span>
                            </div>
                        </div>

                        {task?.parentDetail && (
                            <div className="flex items-center cursor-pointer hover:underline group">
                                <span className="text-neutral-500 font-normal text-base flex items-center gap-x-2">
                                    {renderIcon('epic')}
                                    {task.parentDetail.summary}

                                    <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                            <TooltipWrapper content={"Change parent"}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant='default' size="icon" type="button"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Pen size={16}
                                                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipWrapper>

                                            <DropdownMenuContent
                                                className="w-64 p-0"
                                                align="end"
                                                sideOffset={8}
                                                onClick={(e) => e.stopPropagation()}
                                                forceMount
                                            >
                                                <DynamicDropdownSelector
                                                    slug={"parent"}
                                                    onChange={handleSelectEpic}
                                                    label={"Select epic"}
                                                    showDropdown
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <TooltipWrapper content={"Remove parent"}>
                                            <Button
                                                variant='default' size="icon" type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveEpic();
                                                }}
                                            >
                                                <X size={16}
                                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                            </Button>
                                        </TooltipWrapper>
                                    </div>
                                </span>
                            </div>
                        )}

                        <TaskSummaryField
                            control={control}
                            isEditing={isEditingSummary}
                            setIsEditing={setIsEditingSummary}
                            tempSummary={tempSummary}
                            setTempSummary={setTempSummary}
                            summaryRef={summaryRef}
                            onSave={handleSaveSummary}
                        />

                        <div className='flex items-center flex-wrap gap-3'>
                            <div className="flex items-center justify-center">
                                <Controller
                                    name='task_status'
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
                                                field.onChange(val);
                                                if (val) changeTaskStatus(val);
                                            }}
                                        />
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-center">
                                <Controller
                                    name='importance'
                                    control={control}
                                    render={({ field }) => (
                                        <WorkSelector
                                            initialValue={field.value}
                                            value={field.value}
                                            key={field.value}
                                            workTypes={importanceTypes}
                                            open={activeDropdown === 'importance'}
                                            onOpenChange={toggleImportanceDropdown}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                if (val) changeImportance(val);
                                            }}
                                        />
                                    )}
                                />
                            </div>
                            <div className='border border-input bg-neutral-50 shadow-none rounded-md hover:bg-accent hover:text-accent-foreground text-neutral-500'>
                                <CommonDropdownMenu triggerIcon={<Plus size={18} />} triggerTooltip='Add or create related work' items={workRelatItem} />
                            </div>
                        </div>

                        <TaskDescriptionField
                            control={control}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onSave={handleSaveDescription}
                        />
                    </div>

                    <ChildIssuesSection
                        taskId={taskId}
                        projectId={currentProject?._id}
                        onOpenChild={handleOpenChild}
                    />

                    <Card className='mt-6 shadow-sm border-neutral-200 rounded-md'>
                        <CardHeader
                            className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer bg-neutral-100/80 border-b border-neutral-200 hover:bg-neutral-200/50 transition-colors"
                            onClick={() => setExpandDetails((prev) => !prev)}
                        >
                            <span className='text-neutral-700 font-medium text-base'>
                                Details
                            </span>
                            {expandDetails === true ? <ChevronDown className='text-neutral-500 h-5 w-5' /> : <ChevronUp className='text-neutral-500 h-5 w-5' />}
                        </CardHeader>
                        {expandDetails && (
                            <CardContent className="bg-neutral-200/10 py-5 px-4 flex flex-col gap-6 relative rounded-b-md">
                                <TaskPeopleFields
                                    control={control}
                                    changeAssignee={changeAssignee}
                                    changeLabels={changeLabels}
                                    changeTeam={changeTeam}
                                    changeReporter={changeReporter}
                                />

                                <TaskDueDateField control={control} onChange={changeDueDate} />
                            </CardContent>
                        )}
                    </Card>

                    <div className='mt-8'>
                        <Label className="text-neutral-500">Activity</Label>
                        {/* Without defaultValue no tab is selected on first
                            render and the comment box never shows. */}
                        <Tabs defaultValue='comments'>
                            <TabsList>
                                <TabsTrigger value='comments'>
                                    Comments
                                </TabsTrigger>

                                <TabsTrigger value='history'>
                                    History
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value='comments'>
                                <CommentComponent userData={userData} />
                            </TabsContent>
                            <TabsContent value='history'>
                                <p className="py-6 text-sm text-neutral-400">
                                    The change history is not available yet.
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
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
        </form >
    )
}

export default EditIssue
