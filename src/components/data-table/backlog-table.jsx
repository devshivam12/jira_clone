import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ClipboardX, Flag, Pencil, MoreHorizontal, Pen } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import IssueRowSkeleton from "./IssueRowSkeleton";
import { useSearchParams } from "react-router-dom";
import { useUpdateIssueMutation } from "@/redux/graphql_api/task";
import ManageAvatar from "../common/ManageAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import CommonDropdownMenu from "../common/CommonDropdownMenu";
import AddFlag from "../common/AddFlag";
import WorkSelector from "../common/WorkSelector";
import DynamicDropdownSelector from "../common/DynamicDropdownSelector";
import ShowToast from "../common/ShowToast";
import TooltipWrapper from "../common/TooltipWrapper";

const ROW_HEIGHT = 56;

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
    getWorkItemMenuItems
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
    const currentAssignee = assigneeState?.assignee ?? task?.assigneeDetail ?? {};
    const isAssigneeMenuOpen = assigneeState?.isOpen || false;
    const hasAssignee = Object.keys(currentAssignee).length > 0;


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
                            onClick={(e) => e.stopPropagation()}
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
                                {task?.summary}
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
                <div data-no-row-click onClick={(e) => e.stopPropagation()}>
                    <LazyActionMenu
                        getItems={getWorkItemMenuItems}
                        task={task}
                    />
                </div>
            </div>
        </div >
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.task?._id === nextProps.task?._id &&
        prevProps.task?.summary === nextProps.task?.summary &&
        prevProps.task?.task_status === nextProps.task?.task_status &&
        prevProps.task?.importance === nextProps.task?.importance &&
        prevProps.task?.isFlagged === nextProps.task?.isFlagged &&
        prevProps.task?.work_type === nextProps.task?.work_type &&
        prevProps.task?.assigneeDetail?._id === nextProps.task?.assigneeDetail?._id &&
        prevProps.virtualRow.start === nextProps.virtualRow.start &&
        prevProps.editingTaskId === nextProps.editingTaskId &&
        prevProps.summaryValue === nextProps.summaryValue &&
        prevProps.assigneeState?.isOpen === nextProps.assigneeState?.isOpen &&
        prevProps.assigneeState?.assignee?._id === nextProps.assigneeState?.assignee?._id &&
        prevProps.workTypeMap === nextProps.workTypeMap
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

const LazyParentSelector = memo(({ isOpen, onClose, onChange }) => {
    return (
        <DropdownMenu open={isOpen} onOpenChange={onClose}>
            <DropdownMenuTrigger asChild>
                <div
                    className="cursor-pointer"
                >
                    <p className='flex items-center gap-2'>
                        <Pen className='flex items-center justify-center w-3 h-3 font-normal text-neutral-500 cursor-pointer' />
                        <span
                            className='text-xs text-neutral-500'
                        >
                            Parent
                        </span>
                    </p>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 p-0"
                align="end"
                sideOffset={40}
                alignOffset={10}

                onClick={(e) => e.stopPropagation()}
                forceMount={true}
            >
                <DynamicDropdownSelector
                    slug="parent"
                    onChange={onChange}
                    showDropdown={true}
                    label="Select parent"
                />
            </DropdownMenuContent>

        </DropdownMenu>
    );
});
LazyParentSelector.displayName = 'LazyParentSelector';

const BacklogTable = ({ issue, onLoadMore, hasMore, isLoading, expanded, onToggleExpand, onEditSprint, userData, projectData }) => {
    // console.log("issue-----------", issue)
    const { currentProject, workType, importance, workFlow } = projectData;

    // Performance measurement
    const renderStartTime = performance.now();

    useEffect(() => {
        const renderDuration = performance.now() - renderStartTime;
        // console.log(`BacklogTable render time: ${renderDuration.toFixed(2)}ms`);
    });

    const [updateTask, { isLoading: isUpdating }] = useUpdateIssueMutation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [summaryValues, setSummaryValues] = useState({});
    const [assigneeStates, setAssigneeStates] = useState({});
    const [currentFlagTask, setCurrentFlagTask] = useState(null);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
    const [parentDialogState, setParentDialogState] = useState({ isOpen: false, task: null });
    const addFlagRef = useRef(null);
    const parentRef = useRef(null);

    // Removed expensive useEffect that synced props to state on every render/change.
    // Derived state is now handled in TaskRow or on-the-fly where needed.

    const rowVirtualizer = useVirtualizer({
        count: (issue?.length ?? 0) + (isLoading ? 5 : 0),
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
        enabled: true,
    });
    const virtualItems = rowVirtualizer.getVirtualItems()
    const lastLoadIndexRef = useRef(-1);

    useEffect(() => {
        if (!virtualItems.length || isLoading) return

        const leastVisible = virtualItems[virtualItems.length - 1]
        const prefetchThreshhold = 20
        const triggerPoint = issue.length - prefetchThreshhold;

        // Only trigger if we haven't already triggered for this threshold
        if (leastVisible.index >= triggerPoint &&
            hasMore &&
            lastLoadIndexRef.current < triggerPoint) {
            lastLoadIndexRef.current = triggerPoint;
            onLoadMore()
        }
    }, [virtualItems, issue.length, hasMore, onLoadMore, isLoading])

    const workTypeMap = useMemo(() => {
        return new Map(workType.map((status, index) => [
            status.slug,
            { id: index + 1, name: status.name, value: status.slug, color: status.color, icon: status.icon }
        ]));
    }, [workType]);

    const taskTypes = useMemo(() =>
        workFlow.map((status, index) => ({
            id: index + 1,
            name: status.name,
            value: status.slug,
            color: status.color
        })),
        [workFlow]
    );

    const importanceTypes = useMemo(() =>
        importance.map((imp, index) => ({
            id: index + 1,
            name: imp.name,
            value: imp.slug,
            color: imp.color
        })),
        [importance]
    );

    const currentProjectId = useMemo(() => currentProject?._id, [currentProject]);

    const handleUpdateTask = useCallback(async (key, value, id) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: id,
                    key: key,
                    value: value
                }
            };
            const response = await updateTask(payload).unwrap();
            // console.log("response", response);
            return response;
        } catch (error) {
            // console.log("error", error);
            throw error;
        }
    }, [updateTask]);

    const handleRowClick = useCallback((e, id) => {
        if (e.target.closest('[data-no-row-click]')) return;
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("issueId", id);
            return newParams;
        });
    }, [setSearchParams]);

    const copyLinkKey = useCallback((isLink, isKey, issueId, projectKey, taskNumber, type) => {
        let textToCopy;
        const taskIdentifier = `${projectKey}-${taskNumber}`;
        let message = '';

        if (isLink) {
            const baseUrl = window.location.origin;
            textToCopy = `${baseUrl}/${taskIdentifier}/${issueId}`;
            message = `You've copied the link to the ${type.charAt(0).toUpperCase() + type.slice(1)} ${projectKey}-${taskNumber} to your clipboard`;
        } else if (isKey) {
            textToCopy = taskIdentifier;
            message = 'Key successfully copied to your clipboard';
        } else {
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                ShowToast.info(message);
                // console.log(`${isLink ? 'Link' : 'Key'} copied: ${textToCopy}`);
            })
            .catch(err => {
                ShowToast.warning(err);
                console.error('Failed to copy text: ', err);
            });
    }, []);

    const getWorkItemMenuItems = useCallback((task) => [
        {
            id: 'move-work-item',
            type: 'submenu',
            label: 'Move work item',
            items: [
                {
                    id: 'backlog',
                    label: 'Move to Backlog',
                    onSelect: (e) => {
                        e?.stopPropagation?.();
                        console.log('Move to backlog');
                    }
                },
                {
                    id: 'sprint',
                    label: 'Move to Sprint X',
                    onSelect: () => console.log('Move to sprint')
                },
                { type: 'separator' },
                {
                    id: 'project',
                    label: 'Move to Project Y',
                    onSelect: () => console.log('Move to project')
                }
            ]
        },
        { type: 'separator' },
        {
            id: 'copy-link',
            label: 'Copy link',
            onSelect: () => copyLinkKey(true, false, task._id, task.project_key, task.taskNumber, task.work_type)
        },
        {
            id: 'copy-key',
            label: 'Copy key',
            onSelect: () => copyLinkKey(false, true, task._id, task.project_key, task.taskNumber, task.work_type)
        },
        { type: 'separator' },
        {
            id: task.isFlagged ? 'remove-flag' : 'add-flag',
            label: task.isFlagged ? 'Remove flag' : 'Add flag',
            onSelect: (e) => {
                e?.stopPropagation?.();

                if (task.isFlagged) {
                    handleUpdateTask('isFlagged', "false", task._id);
                } else {
                    setCurrentFlagTask({
                        _id: task._id,
                        workType: task.work_type,
                        project_key: task.project_key,
                        taskNumber: task.taskNumber,
                        summary: task.summary
                    });
                    setIsFlagDialogOpen(true);
                }
            }
        },
        {
            id: 'parent',
            label: 'Parent',
            onSelect: (e) => {
                e?.stopPropagation?.();
                setParentDialogState({ isOpen: true, task: task });
            }
        },
        {
            id: 'delete',
            label: 'Delete',
            danger: true,
            onSelect: () => console.log('Delete')
        }
    ], [copyLinkKey, handleUpdateTask]);

    const handleSummaryClick = useCallback((e, taskId) => {
        e.stopPropagation();
        setEditingTaskId(taskId);
    }, []);

    const handleSummaryChange = useCallback((e, taskId) => {
        setSummaryValues(prev => ({
            ...prev,
            [taskId]: e.target.value
        }));
    }, []);

    const saveSummaryAndClose = useCallback(async (task) => {
        const trimmedSummary = summaryValues[task._id]?.trim();

        if (!trimmedSummary || trimmedSummary === task.summary) {
            setSummaryValues(prev => ({
                ...prev,
                [task._id]: task.summary
            }));
            setEditingTaskId(null);
            return;
        }

        try {
            await handleUpdateTask('summary', trimmedSummary, task._id);
        } catch (error) {
            setSummaryValues(prev => ({
                ...prev,
                [task._id]: task.summary
            }));
            ShowToast.error("Failed to update summary.");
        } finally {
            setEditingTaskId(null);
        }
    }, [summaryValues, handleUpdateTask]);

    const handleSummaryKeyDown = useCallback((e, task) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSummaryAndClose(task);
        }
    }, [saveSummaryAndClose]);

    const handleSummaryBlur = useCallback((e, task) => {
        e.stopPropagation();
        saveSummaryAndClose(task);
    }, [saveSummaryAndClose]);

    const handleAvatarClick = useCallback((e, taskId) => {
        e.stopPropagation();
        setAssigneeStates(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                isOpen: !prev[taskId]?.isOpen
            }
        }));
    }, []);

    const handleAssigneeChange = useCallback((selectedMember, task) => {
        setAssigneeStates(prev => ({
            ...prev,
            [task._id]: {
                isOpen: false,
                assignee: selectedMember
            }
        }));

        const assignee = selectedMember?._id;
        if (assignee !== task?.assigneeDetail?._id) {
            handleUpdateTask('assigneeId', assignee, task._id);
        }
    }, [handleUpdateTask]);

    const toggleAssigneeOpen = useCallback((taskId, isOpen) => {
        setAssigneeStates(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                isOpen
            }
        }));
    }, []);

    const changeTaskStatus = useCallback((status, taskId) => {
        handleUpdateTask("task_status", status, taskId);
    }, [handleUpdateTask]);

    const changeImportance = useCallback((imp, taskId) => {
        handleUpdateTask("importance", imp, taskId);
    }, [handleUpdateTask]);

    const handleFlagClick = useCallback((task, shouldOpenDialog) => {
        if (shouldOpenDialog) {
            // Store which task we're flagging
            setCurrentFlagTask({
                _id: task._id,
                workType: task.work_type,
                project_key: task.project_key,
                taskNumber: task.taskNumber,
                summary: task.summary
            });
            // Open the dialog
            setIsFlagDialogOpen(true);
        } else {
            // Remove flag directly without dialog
            addFlagRef.current?.handleAddFlag(false);
        }
    }, []);

    const showEmptyState = !isLoading && (!issue || issue.length === 0);
    const showInitialSkeleton = isLoading && (!issue || issue.length === 0);

    return (
        <div className="rounded-xl border bg-white overflow-hidden cursor-default">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onToggleExpand}>
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <Button size="sm" variant="advanceMuted">
                        Create task
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="w-full">
                    {showEmptyState ? (
                        <div className="h-[200px] flex items-center justify-center flex-col gap-2">
                            <ClipboardX size={60} className="text-neutral-400" />
                            <span className="text-center text-sm text-gray-500">
                                No tasks have been added to this backlog.
                            </span>
                        </div>
                    ) : showInitialSkeleton ? (
                        // Show skeleton loaders on initial load
                        <div className="border-t">
                            {[...Array(5)].map((_, index) => (
                                <IssueRowSkeleton key={`initial-skeleton-${index}`} />
                            ))}
                        </div>
                    ) : (
                        <div
                            ref={parentRef}
                            className="max-h-[300px] overflow-auto border-t"
                        >
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    minWidth: '950px',
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    // Check if this index is beyond actual data (skeleton row)
                                    const isSkeletonRow = virtualRow.index >= (issue?.length ?? 0);

                                    if (isSkeletonRow) {
                                        return (
                                            <div
                                                key={`skeleton-${virtualRow.index}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${ROW_HEIGHT}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                            >
                                                <IssueRowSkeleton />
                                            </div>
                                        );
                                    }

                                    const task = issue[virtualRow.index];
                                    if (!task) return null;

                                    return (
                                        <TaskRow
                                            key={task._id}
                                            task={task}
                                            virtualRow={virtualRow}
                                            workTypeMap={workTypeMap}
                                            editingTaskId={editingTaskId}
                                            summaryValue={summaryValues[task._id]}
                                            assigneeState={assigneeStates[task._id]}
                                            taskTypes={taskTypes}
                                            importanceTypes={importanceTypes}
                                            currentProjectId={currentProjectId}
                                            addFlagRefs={addFlagRef}
                                            onRowClick={handleRowClick}
                                            onSummaryClick={handleSummaryClick}
                                            onSummaryChange={handleSummaryChange}
                                            onSummaryKeyDown={handleSummaryKeyDown}
                                            onSummaryBlur={handleSummaryBlur}
                                            onAvatarClick={handleAvatarClick}
                                            onAssigneeChange={handleAssigneeChange}
                                            toggleAssigneeOpen={toggleAssigneeOpen}
                                            changeTaskStatus={changeTaskStatus}
                                            changeImportance={changeImportance}
                                            getWorkItemMenuItems={getWorkItemMenuItems}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {
                currentFlagTask && (
                    <AddFlag
                        isOpen={isFlagDialogOpen}
                        setIsOpen={setIsFlagDialogOpen}
                        taskInfo={currentFlagTask}
                        isFlagged={true}
                        onConfirm={(reason) => {
                            handleUpdateTask('isFlagged', true, currentFlagTask._id);
                            setIsFlagDialogOpen(false);
                            setCurrentFlagTask(null);
                        }}
                        onCancel={() => {
                            setIsFlagDialogOpen(false);
                            setCurrentFlagTask(null);
                        }}
                    />
                )
            }
            {parentDialogState.isOpen && (
                <LazyParentSelector
                    isOpen={parentDialogState.isOpen}
                    onClose={(open) => {
                        if (!open) setParentDialogState(prev => ({ ...prev, isOpen: false }));
                    }}
                    onChange={(selectedParent) => {
                        if (selectedParent && parentDialogState.task) {
                            handleUpdateTask('parentId', selectedParent._id, parentDialogState.task._id);
                            setParentDialogState({ isOpen: false, task: null });
                        }
                    }}
                />
            )}
        </div >
    );
};

export default memo(BacklogTable);