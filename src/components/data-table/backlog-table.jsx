import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ClipboardX, Flag, Pencil, MoreHorizontal } from "lucide-react";
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

const ROW_HEIGHT = 56;

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
    console.log(":matchWorkType", matchWorkType)
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
            {/* Task ID and Type */}
            <div className="w-[160px] min-w-[160px] max-w-[160px] p-2 flex items-center">
                <div className="flex items-center justify-start text-neutral-500 w-full">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${matchWorkType?.color || 'bg-gray-200'}`}>
                        {matchWorkType?.icon && (
                            <img
                                src={matchWorkType.icon}
                                loading="lazy"
                                alt={matchWorkType.name}
                                className="w-4 h-4 filter brightness-0 invert"
                                decoding="async"
                            />
                        )}
                    </div>
                    <div className='underline hover:text-blue-600 text-base font-semibold ml-1 truncate'>
                        <span className="font-medium">{task?.project_key}-{task?.taskNumber}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-2 min-w-0">
                <div className="flex items-center text-sm font-semibold text-neutral-500 w-full" data-no-row-click>
                    {isEditing ? (
                        <Input
                            value={currentSummary || ''}
                            onChange={handleSummaryChangeInternal}
                            onKeyDown={handleSummaryKeyDownInternal}
                            onBlur={handleSummaryBlurInternal}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8 w-full"
                        />
                    ) : (
                        <div className="flex items-center w-full min-w-0">
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

            {/* Task Status */}
            {/* Task Status */}
            <div className="w-[160px] min-w-[160px] max-w-[160px] p-2 flex items-center">
                <div className="flex items-center justify-start w-full" data-no-row-click>
                    <div className="flex items-center justify-start w-full" data-no-row-click>
                        <LazyWorkSelector
                            initialValue={task?.task_status}
                            workTypes={taskTypes}
                            onChange={changeTaskStatusInternal}
                        />
                    </div>
                </div>
            </div>

            {/* Importance */}
            {/* Importance */}
            <div className="w-[160px] min-w-[160px] max-w-[160px] p-2 flex items-center">
                <div className="flex items-center justify-start w-full" data-no-row-click>
                    <div className="flex items-center justify-start w-full" data-no-row-click>
                        <LazyWorkSelector
                            initialValue={task?.importance}
                            workTypes={importanceTypes}
                            onChange={changeImportanceInternal}
                        />
                    </div>
                </div>
            </div>

            {/* Flag */}
            {/* Flag */}
            <div className="w-[60px] min-w-[60px] max-w-[60px] text-center p-2 flex items-center justify-center">
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
            {/* Assignee */}
            <div className="w-[80px] min-w-[80px] max-w-[80px] text-center p-2 flex items-center justify-center">
                <div className="flex items-center justify-center w-full" data-no-row-click>
                    <div className="flex items-center justify-center" data-no-row-click>
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
            </div>

            {/* Actions Menu */}
            <div className="w-[56px] min-w-[56px] max-w-[56px] text-center p-2 flex items-center justify-center">
                <div data-no-row-click onClick={(e) => e.stopPropagation()}>
                    <LazyActionMenu
                        getItems={getWorkItemMenuItems}
                        task={task}
                    />
                </div>
            </div>
        </div>
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

// Lazy wrapper for WorkSelector to improve render performance
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
                    console.log("Lazy selector clicked");
                    setIsInteracted(true);
                }}
                className={`flex items-center gap-2 rounded-md px-2 py-0.5 transition-colors w-30 text-start h-10 cursor-pointer ${selectedWork?.color ? selectedWork.color : 'bg-white'} hover:bg-gray-100 border border-transparent hover:border-gray-200`}
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

// Lazy wrapper for Assignee Dropdown
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
                        showTooltip={false} // Disable tooltip in lazy mode for speed
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
                if (!open) setIsMounted(false); // Unmount when closed
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

// Lazy wrapper for CommonDropdownMenu (Actions)
const LazyActionMenu = memo(({ getItems, task }) => {
    const [isMounted, setIsMounted] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsMounted(true);
    };

    if (!isMounted) {
        return (
            <Button
                size="icon"
                variant="ghost"
                onClick={handleClick}
                className="opacity-100" // Ensure visibility
            >
                <MoreHorizontal className="w-4 h-4 text-neutral-500" />
            </Button>
        );
    }

    return (
        <CommonDropdownMenu
            items={getItems(task)}
            onOpenChange={(open) => {
                if (!open) setIsMounted(false);
            }}
        />
    );
});
LazyActionMenu.displayName = 'LazyActionMenu';

const BacklogTable = ({ issue, expanded, onToggleExpand, onEditSprint, userData, projectData }) => {
    console.log("issue-----------", issue)
    const { currentProject, workType, importance, workFlow } = projectData;

    // Performance measurement
    const renderStartTime = performance.now();

    useEffect(() => {
        const renderDuration = performance.now() - renderStartTime;
        console.log(`BacklogTable render time: ${renderDuration.toFixed(2)}ms`);
    });

    const [updateTask, { isLoading }] = useUpdateIssueMutation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [summaryValues, setSummaryValues] = useState({});
    const [assigneeStates, setAssigneeStates] = useState({});
    const [currentFlagTask, setCurrentFlagTask] = useState(null);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
    const addFlagRef = useRef(null);
    const parentRef = useRef(null);

    // Removed expensive useEffect that synced props to state on every render/change.
    // Derived state is now handled in TaskRow or on-the-fly where needed.

    const rowVirtualizer = useVirtualizer({
        count: issue?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
        enabled: true,
    });

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
            console.log("response", response);
            return response;
        } catch (error) {
            console.log("error", error);
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
                console.log(`${isLink ? 'Link' : 'Key'} copied: ${textToCopy}`);
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
            onSelect: () => console.log('Parent')
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
                    {issue && issue?.length > 0 ? (
                        <div
                            ref={parentRef}
                            className="h-[600px] overflow-auto border-t"
                        >
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const task = issue[virtualRow?.index];

                                    if (!task) {
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
                    ) : (
                        <div className="h-[400px] flex items-center justify-center flex-col gap-2">
                            <ClipboardX size={60} className="text-neutral-400" />
                            <span className="text-center text-sm text-gray-500">
                                No tasks have been added to this backlog.
                            </span>
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
        </div >
    );
};

export default memo(BacklogTable);