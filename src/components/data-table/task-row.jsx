import React, { useCallback, useMemo, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Flag, Pencil, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import ManageAvatar from "../common/ManageAvatar";
import CommonDropdownMenu from "../common/CommonDropdownMenu";
import WorkSelector from "../common/WorkSelector";
import DynamicDropdownSelector from "../common/DynamicDropdownSelector";
import TooltipWrapper from "../common/TooltipWrapper";

const ROW_HEIGHT = 56;

const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim() || !text) {
        return text;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 text-black rounded px-[2px]">{part}</span>
        ) : (
            part
        )
    );
};

const ParentWorkTypeIcon = memo(({ workTypeMap }) => {
    // console.log("workTypeMap", workTypeMap)
    const matchEpic = useMemo(() => {
        const item = workTypeMap?.get('epic');
        // console.log("item", item)
        return workTypeMap?.get('epic');
    }, [workTypeMap]);
    // console.log("matchEpic", matchEpic)
    if (!matchEpic?.icon) return null;

    return (
        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${matchEpic?.color || 'bg-gray-200'}`}>
            <img
                src={matchEpic?.icon}
                loading="lazy"
                alt={matchEpic?.name}
                className="w-3 h-3 filter brightness-0 invert"
                decoding="async"
            />
        </div>
    );
});
ParentWorkTypeIcon.displayName = 'ParentWorkTypeIcon';

// Memoized row component to prevent unnecessary re-renders
const TaskRow = memo(({
    task,
    virtualRow,
    workTypeMap,
    editingTaskId,
    summaryValue,
    assigneeState,
    taskTypes,
    importanceTypes,
    currentProjectId,
    addFlagRefs,
    onRowClick,
    onSummaryClick,
    onSummaryChange,
    onSummaryKeyDown,
    onSummaryBlur,
    onAvatarClick,
    onAssigneeChange,
    toggleAssigneeOpen,
    changeTaskStatus,
    changeImportance,
    getWorkItemMenuItems,
    searchQuery
}) => {
    const matchWorkType = useMemo(() => {
        const result = workTypeMap?.get(task?.work_type)
        return result
    },
        [workTypeMap, task?.work_type]
    );

    const isEditing = editingTaskId === task._id;
    // const assigneeState = assigneeStates[task._id] || { isOpen: false, assignee: {} };

    const handleRowClickInternal = useCallback((e) => {
        onRowClick(e, task._id);
    }, [onRowClick, task._id]);

    const handleSummaryClickInternal = useCallback((e) => {
        onSummaryClick(e, task._id);
    }, [onSummaryClick, task._id]);

    const handleSummaryChangeInternal = useCallback((e) => {
        onSummaryChange(e, task._id);
    }, [onSummaryChange, task._id]);

    // Derived state with fallback to props
    const currentSummary = summaryValue !== undefined ? summaryValue : task?.summary;
    const currentAssignee = assigneeState?.assignee ?? task?.assigneeDetail ?? null;
    const isAssigneeMenuOpen = assigneeState?.isOpen || false;
    const hasAssignee = Boolean(currentAssignee && currentAssignee._id);

    const handleStopPropagation = useCallback((e) => {
        e.stopPropagation();
    }, []);


    const handleSummaryKeyDownInternal = useCallback((e) => {
        onSummaryKeyDown(e, task);
    }, [onSummaryKeyDown, task]);

    const handleSummaryBlurInternal = useCallback((e) => {
        onSummaryBlur(e, task);
    }, [onSummaryBlur, task]);

    const handleAvatarClickInternal = useCallback((e) => {
        onAvatarClick(e, task._id);
    }, [onAvatarClick, task._id]);

    const handleAssigneeChangeInternal = useCallback((selectedMember) => {
        onAssigneeChange(selectedMember, task);
    }, [onAssigneeChange, task]);

    const toggleAssigneeOpenInternal = useCallback((isOpen) => {
        toggleAssigneeOpen(task._id, isOpen);
    }, [toggleAssigneeOpen, task._id]);

    const changeTaskStatusInternal = useCallback((status) => {
        changeTaskStatus(status, task._id);
    }, [changeTaskStatus, task._id]);

    const changeImportanceInternal = useCallback((imp) => {
        changeImportance(imp, task._id);
    }, [changeImportance, task._id]);

    return (
        <div
            key={task._id}
            className={`group flex items-center cursor-pointer transition-colors border-b
                ${task?.isFlagged
                    ? 'bg-red-50/60 shadow-[inset_0_0_0_1px_theme(colors.red.500)]'
                    : 'hover:bg-gray-50'}
            `}
            onClick={handleRowClickInternal}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
            }}
        >
            {/* Task ID and Type */}
            <div className="w-[120px] min-w-[120px] max-w-[120px] p-2 flex items-center">
                <div className="flex items-center justify-start text-neutral-500 w-full">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${matchWorkType?.color || 'bg-gray-200'}`}>
                        {matchWorkType?.icon && (
                            <img
                                src={matchWorkType.icon}
                                loading="lazy"
                                alt={matchWorkType.name}
                                className="w-3 h-3 filter brightness-0 invert"
                                decoding="async"
                            />
                        )}
                    </div>
                    <div className='underline hover:text-blue-600 text-sm font-semibold ml-1 truncate'>
                        <span className="font-medium">{task?.project_key}-{task?.taskNumber}</span>
                    </div>
                </div>
            </div>

            <div className="p-2 flex-1 min-w-[250px]">
                <div className="flex items-center text-sm font-semibold text-neutral-500">
                    {isEditing ? (
                        <Input
                            value={currentSummary || ''}
                            onChange={handleSummaryChangeInternal}
                            onKeyDown={handleSummaryKeyDownInternal}
                            onBlur={handleSummaryBlurInternal}
                            onClick={handleStopPropagation}
                            autoFocus
                            data-no-row-click
                            className="h-8 text-sm w-full"
                        />
                    ) : (
                        <div className="flex items-center min-w-0">
                            <span
                                className="truncate block flex-1"
                                title={task?.summary}
                            >
                                {searchQuery ? highlightText(task?.summary, searchQuery) : task?.summary}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-2 w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100"
                                onClick={handleSummaryClickInternal}
                            >
                                <Pencil className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex w-[50px] min-w-[50px] max-w-[50px] text-center p-2 items-center justify-center">
                <div
                    data-no-row-click
                    className="flex justify-center items-center w-full"
                >
                    {task?.parentDetail && (() => {
                        const truncSummary = task.parentDetail.summary.length > 30 ? task.parentDetail.summary.slice(0, 10) + '...' : task.parentDetail.summary;

                        return (
                            <TooltipWrapper content={truncSummary}>
                                <div>
                                    <ParentWorkTypeIcon workTypeMap={workTypeMap} />
                                </div>
                            </TooltipWrapper>
                        );
                    })()}
                </div>
            </div>


            {/* Task Status */}
            <div className="flex w-[140px] min-w-[140px] max-w-[140px] p-2 items-center">
                <div className="flex items-center justify-start w-full" data-no-row-click>
                    <LazyWorkSelector
                        initialValue={task?.task_status}
                        workTypes={taskTypes}
                        onChange={changeTaskStatusInternal}
                    />
                </div>
            </div>

            {/* Importance */}
            <div className="flex w-[140px] min-w-[140px] max-w-[140px] p-2 items-center">
                <div className="flex items-center justify-start w-full" data-no-row-click>
                    <LazyWorkSelector
                        initialValue={task?.importance}
                        workTypes={importanceTypes}
                        onChange={changeImportanceInternal}
                    />
                </div>
            </div>

            {/* Flag */}
            <div className="flex w-[50px] min-w-[50px] max-w-[50px] text-center p-2 items-center justify-center">
                <div
                    data-no-row-click
                    className="flex justify-center items-center w-full"
                >
                    {task?.isFlagged && (
                        <div>
                            <Flag
                                className="text-red-500"
                                size={14}
                                fill="currentColor"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Assignee */}
            <div className="flex w-[60px] min-w-[60px] max-w-[60px] text-center p-2 items-center justify-center">
                <div className="flex items-center justify-center w-full" data-no-row-click>
                    <LazyAssignee
                        assigneeState={assigneeState}
                        toggleAssigneeOpen={toggleAssigneeOpenInternal}
                        handleAvatarClick={handleAvatarClickInternal}
                        handleAssigneeChange={handleAssigneeChangeInternal}
                        currentProjectId={currentProjectId}
                        currentAssignee={currentAssignee}
                        hasAssignee={hasAssignee}
                        isAssigneeMenuOpen={isAssigneeMenuOpen}
                    />
                </div>
            </div>

            {/* Actions Menu */}
            <div className="w-[50px] min-w-[50px] max-w-[50px] text-center p-1 sm:p-2 flex items-center justify-center">
                <div data-no-row-click onClick={handleStopPropagation}>
                    <LazyActionMenu
                        getItems={getWorkItemMenuItems}
                        task={task}
                    />
                </div>
            </div>
        </div >
    );
}, (prevProps, nextProps) => {
    const wasEditing = prevProps.editingTaskId === prevProps.task?._id;
    const isEditing = nextProps.editingTaskId === nextProps.task?._id;

    return (
        wasEditing === isEditing &&
        prevProps.task?._id === nextProps.task?._id &&
        prevProps.task?.summary === nextProps.task?.summary &&
        prevProps.task?.task_status === nextProps.task?.task_status &&
        prevProps.task?.importance === nextProps.task?.importance &&
        prevProps.task?.isFlagged === nextProps.task?.isFlagged &&
        prevProps.task?.work_type === nextProps.task?.work_type &&
        prevProps.task?.assigneeDetail?._id === nextProps.task?.assigneeDetail?._id &&
        prevProps.task?.parentDetail?._id === nextProps.task?.parentDetail?._id &&
        prevProps.task?.parentId === nextProps.task?.parentId &&
        prevProps.virtualRow.start === nextProps.virtualRow.start &&
        prevProps.summaryValue === nextProps.summaryValue &&
        prevProps.assigneeState?.isOpen === nextProps.assigneeState?.isOpen &&
        prevProps.assigneeState?.assignee?._id === nextProps.assigneeState?.assignee?._id &&
        prevProps.workTypeMap === nextProps.workTypeMap &&
        prevProps.taskTypes === nextProps.taskTypes &&
        prevProps.importanceTypes === nextProps.importanceTypes &&
        prevProps.currentProjectId === nextProps.currentProjectId &&
        prevProps.searchQuery === nextProps.searchQuery
    );
});

TaskRow.displayName = 'TaskRow';

const LazyWorkSelector = memo(({ initialValue, workTypes, onChange }) => {
    const [isInteracted, setIsInteracted] = useState(false);
    const selectedWork = useMemo(() =>
        workTypes?.find(t => t.value === initialValue) || null,
        [workTypes, initialValue]);

    if (!isInteracted) {
        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsInteracted(true);
                }}
                className={`flex items-center gap-2 rounded-md px-2 w-30 text-start ${selectedWork?.color ? selectedWork.color : 'bg-white'}`}
            >
                <div className="py-1">
                    {selectedWork ? (
                        <span className={`text-sm font-medium truncate ${selectedWork.color && 'text-white'}`}>
                            {selectedWork.name}
                        </span>
                    ) : (
                        <span className="text-sm text-neutral-400">Select work type</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 ml-auto ${selectedWork?.color ? 'text-white' : 'text-neutral-400'}`} />
            </div>
        );
    }

    return (
        <WorkSelector
            initialValue={initialValue}
            workTypes={workTypes}
            defaultOpen={true}
            onOpenChange={(open) => {
                if (!open) {
                    setIsInteracted(false);
                }
            }}
            onChange={(val) => {
                onChange(val);
                setIsInteracted(false);
            }}
        />
    );
});
LazyWorkSelector.displayName = 'LazyWorkSelector';

const LazyAssignee = memo(({ assigneeState, toggleAssigneeOpen, handleAvatarClick, handleAssigneeChange, currentProjectId, currentAssignee, hasAssignee, isAssigneeMenuOpen }) => {
    const [isMounted, setIsMounted] = useState(false);

    const handleClick = (e) => {
        setIsMounted(true);
        handleAvatarClick(e);
    };

    if (!isMounted && !isAssigneeMenuOpen) {
        return (
            <div onClick={handleClick} className="cursor-pointer">
                {hasAssignee ? (
                    <ManageAvatar
                        firstName={currentAssignee?.first_name}
                        lastName={currentAssignee?.last_name}
                        image={currentAssignee?.image}
                        size='sm'
                        tooltipContent={`${currentAssignee?.first_name} ${currentAssignee?.last_name}`}
                        showTooltip={false}
                    />
                ) : (
                    <ManageAvatar
                        fallbackIcon={true}
                        size='sm'
                        tooltipContent="Unassigned"
                        showTooltip={false}
                    />
                )}
            </div>
        );
    }

    return (
        <DropdownMenu
            open={isAssigneeMenuOpen}
            onOpenChange={(open) => {
                toggleAssigneeOpen(open);
                if (!open) setIsMounted(false);
            }}
        >
            <DropdownMenuTrigger asChild>
                <div
                    onClick={handleAvatarClick}
                    className="cursor-pointer"
                >
                    {hasAssignee ? (
                        <ManageAvatar
                            firstName={currentAssignee?.first_name}
                            lastName={currentAssignee?.last_name}
                            image={currentAssignee?.image}
                            size='sm'
                            tooltipContent={`${currentAssignee?.first_name} ${currentAssignee?.last_name}`}
                            showTooltip={!isAssigneeMenuOpen}
                        />
                    ) : (
                        <ManageAvatar
                            fallbackIcon={true}
                            size='sm'
                            tooltipContent="Unassigned"
                            showTooltip={!isAssigneeMenuOpen}
                        />
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 p-0"
                align="end"
                sideOffset={8}
                onClick={(e) => e.stopPropagation()}
            >
                <DynamicDropdownSelector
                    slug={'member'}
                    onChange={handleAssigneeChange}
                    label={"Select assignee"}
                    projectId={currentProjectId}
                    showDropdown={true}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
LazyAssignee.displayName = 'LazyAssignee';

const LazyActionMenu = memo(({ getItems, task }) => {
    const [isMounted, setIsMounted] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsMounted(true);
    };

    if (!isMounted) {
        return (
            <TooltipWrapper content="More actions">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClick}
                    className="opacity-100"
                >
                    <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                </Button>
            </TooltipWrapper>
        );
    }

    return (
        <CommonDropdownMenu
            items={getItems(task)}
            defaultOpen={true}
            onOpenChange={(open) => {
                if (!open) setIsMounted(false);
            }}
        />
    );
});
LazyActionMenu.displayName = 'LazyActionMenu';

export default TaskRow;
