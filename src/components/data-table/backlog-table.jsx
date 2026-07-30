import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ClipboardX, Flag, Pencil, MoreHorizontal, Pen, Settings2, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import IssueRowSkeleton from "./IssueRowSkeleton";
import { useSearchParams } from "react-router-dom";
import { useUpdateIssueMutation, useDeleteTaskMutation } from "@/redux/graphql_api/task";
import ManageAvatar from "../common/ManageAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CommonDropdownMenu from "../common/CommonDropdownMenu";
import AddFlag from "../common/AddFlag";
import DeleteTaskDialog from "../common/DeleteTaskDialog";
import WorkSelector from "../common/WorkSelector";
import DynamicDropdownSelector from "../common/DynamicDropdownSelector";
import ShowToast from "../common/ShowToast";
import TooltipWrapper from "../common/TooltipWrapper";
import TaskRow from './task-row';
import StatusBar from "../common/StatusBar";
import InlineCreateTaskRow from "./inline-create-task-row";

const ROW_HEIGHT = 56;


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

const LazySprintSelector = memo(({ isOpen, onClose, onChange, projectId }) => {
    return (
        <DropdownMenu open={isOpen} onOpenChange={onClose}>
            <DropdownMenuTrigger asChild>
                <div className="hidden" />
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
                    slug="sprint"
                    onChange={onChange}
                    showDropdown={true}
                    label="Select sprint"
                    projectId={projectId}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
LazySprintSelector.displayName = 'LazySprintSelector';

const BacklogTable = ({ issue, statusCount, onLoadMore, hasMore, isLoading, expanded, onToggleExpand, onEditSprint, userData, projectData, searchQuery, paginationToken, onCreateSprintClick }) => {
    // console.log("issue-----------", issue)
    const { currentProject, workType, importance, workFlow } = projectData;

    const [updateTask, { isLoading: isUpdating }] = useUpdateIssueMutation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [showCreateRow, setShowCreateRow] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [summaryValues, setSummaryValues] = useState({});
    const [assigneeStates, setAssigneeStates] = useState({});
    const [currentFlagTask, setCurrentFlagTask] = useState(null);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
    const [parentDialogState, setParentDialogState] = useState({ isOpen: false, task: null });
    const [sprintDialogState, setSprintDialogState] = useState({ isOpen: false, task: null });
    const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, task: null });
    const [deleteTask, { isLoading: deleteLoading }] = useDeleteTaskMutation();
    const addFlagRef = useRef(null);
    const parentRef = useRef(null);

    // Initialize state from localStorage
    const storageKey = `project_groupby_status_${currentProject?._id}`;
    const [groupByStatus, setGroupByStatus] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : false;
    });

    // Update localStorage when state changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(groupByStatus));
    }, [groupByStatus, storageKey]);

    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroupExpand = useCallback((statusValue) => {
        setExpandedGroups(prev => ({
            ...prev,
            [statusValue]: prev[statusValue] === false ? true : false
        }));
    }, []);

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

    const flattenedItems = useMemo(() => {
        if (!groupByStatus || !issue || issue.length === 0) return issue;

        const grouped = {};
        for (let i = 0; i < taskTypes.length; i++) {
            grouped[taskTypes[i].value] = [];
        }
        
        const unmapped = [];

        for (let i = 0; i < issue.length; i++) {
            const task = issue[i];
            if (task.task_status && grouped[task.task_status] !== undefined) {
                grouped[task.task_status].push(task);
            } else {
                unmapped.push(task);
            }
        }

        const flatList = [];
        for (let i = 0; i < taskTypes.length; i++) {
            const type = taskTypes[i];
            const tasksOfThisType = grouped[type.value] || [];
            const isExpanded = expandedGroups[type.value] !== false;
            // Always show a header for every workflow status so the full set of
            // statuses is present, even when a status currently has no issues.
            flatList.push({ isHeader: true, statusValue: type.value, statusName: type.name, statusColor: type.color, count: tasksOfThisType.length, isExpanded });
            if (isExpanded) {
                if (tasksOfThisType.length > 0) {
                    // Using a loop to strictly avoid any large stack trace issues from spread operator on huge arrays
                    for (let j = 0; j < tasksOfThisType.length; j++) {
                        flatList.push(tasksOfThisType[j]);
                    }
                } else {
                    // Placeholder row so an empty (but expanded) group still
                    // occupies a virtualized row and shows a hint.
                    flatList.push({ isEmptyPlaceholder: true, statusValue: type.value });
                }
            }
        }

        if (unmapped.length > 0) {
            const isExpanded = expandedGroups['Unmapped'] !== false;
            flatList.push({ isHeader: true, statusValue: 'Unmapped', statusName: 'Unmapped', statusColor: 'bg-gray-200', count: unmapped.length, isExpanded });
            if (isExpanded) {
                for (let j = 0; j < unmapped.length; j++) {
                    flatList.push(unmapped[j]);
                }
            }
        }

        return flatList;
    }, [issue, groupByStatus, taskTypes, expandedGroups]);


    const itemsToRender = groupByStatus ? flattenedItems : issue;
    // Removed expensive useEffect that synced props to state on every render/change.
    // Derived state is now handled in TaskRow or on-the-fly where needed.

    const rowVirtualizer = useVirtualizer({
        count: (itemsToRender?.length ?? 0) + (isLoading && itemsToRender?.length > 0 ? 1 : 0),
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
        enabled: true,
    });
    const virtualItems = rowVirtualizer.getVirtualItems()
    const lastLoadIndexRef = useRef(null);

    useEffect(() => {
        if (!virtualItems.length || isLoading) return;

        const leastVisible = virtualItems[virtualItems.length - 1];
        const prefetchThreshhold = 2;
        const triggerPoint = (itemsToRender?.length ?? 0) - prefetchThreshhold;
        
        const currentTokenId = `token_${paginationToken}_len_${itemsToRender?.length ?? 0}`;

        if (groupByStatus) {
            const currentItem = itemsToRender[leastVisible.index];
            
            const isScrolled = parentRef.current && parentRef.current.scrollTop > 0;
            if (!isScrolled && leastVisible.index < 10) return; // Prevent initial auto-fetch if no scroll and few items

            if (!currentItem && leastVisible.index >= (itemsToRender?.length ?? 0) && hasMore) {
                if (lastLoadIndexRef.current !== currentTokenId) {
                    lastLoadIndexRef.current = currentTokenId;
                    onLoadMore();
                }
            } else if (currentItem && !currentItem.isHeader) {
                let nextHeaderIndex = -1;
                for (let i = leastVisible.index + 1; i < itemsToRender.length; i++) {
                    if (itemsToRender[i].isHeader) {
                        nextHeaderIndex = i;
                        break;
                    }
                }
                
                const groupEndIndex = nextHeaderIndex !== -1 ? nextHeaderIndex - 1 : itemsToRender.length - 1;
                const triggerPointGroup = groupEndIndex - prefetchThreshhold;
                // Unique key for preventing multiple calls for the same group's specific boundary
                const triggerKey = `group-${currentItem.task_status}-${groupEndIndex}-${currentTokenId}`;

                if (leastVisible.index >= triggerPointGroup &&
                    hasMore &&
                    lastLoadIndexRef.current !== triggerKey) {
                    lastLoadIndexRef.current = triggerKey;
                    onLoadMore(currentItem.task_status || 'Unmapped');
                }
            }
        } else {
            // Normal (ungrouped) trigger
            
            const isScrolled = parentRef.current && parentRef.current.scrollTop > 0;
            const reachedBottom = leastVisible.index >= triggerPoint;
            
            if (reachedBottom && hasMore && (isScrolled || leastVisible.index >= 10)) {
                if (lastLoadIndexRef.current !== currentTokenId) {
                    lastLoadIndexRef.current = currentTokenId;
                    onLoadMore();
                }
            }
        }
    }, [virtualItems, itemsToRender, hasMore, onLoadMore, isLoading, groupByStatus, paginationToken]);

    const workTypeMap = useMemo(() => {
        return new Map(workType.map((status, index) => [
            status.slug,
            { id: index + 1, name: status.name, value: status.slug, color: status.color, icon: status.icon }
        ]));
    }, [workType]);



    const currentProjectId = useMemo(() => currentProject?._id, [currentProject]);
    const handleUpdateTask = useCallback(async (key, value, id, fullDetail) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: id,
                    key: key,
                    value: value,
                    ...(fullDetail !== undefined && { fullDetail })
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

    const handleDeleteTask = useCallback(async (reason) => {
        const task = deleteDialogState.task;
        if (!task) return;
        try {
            const payload = {
                operationName: "deleteTask",
                variables: {
                    taskId: task._id,
                    reason: reason
                }
            };
            const response = await deleteTask(payload).unwrap();
            if (response?.data?.deleteTask?.status === 200) {
                ShowToast.success("Task moved to archive");
                setDeleteDialogState({ isOpen: false, task: null });
            } else {
                ShowToast.error(response?.data?.deleteTask?.message || "Could not delete the task");
            }
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`);
        }
    }, [deleteDialogState.task, deleteTask]);

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
                    label: 'Move to sprint',
                    onSelect: (e) => {
                        e?.stopPropagation?.();
                        setSprintDialogState({ isOpen: true, task: task });
                    }
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
            onSelect: (e) => {
                e?.stopPropagation?.();
                setDeleteDialogState({ isOpen: true, task: task });
            }
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

    const showEmptyState = !isLoading && (!itemsToRender || itemsToRender.length === 0) && !hasMore;
    const showInitialSkeleton = isLoading && (!itemsToRender || itemsToRender.length === 0);

    return (
        <div className="rounded-xl border bg-white overflow-hidden cursor-default">
            <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-3 bg-gray-50 border-b gap-y-3 gap-x-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={onToggleExpand} className="shrink-0 h-8 w-8">
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </Button>
                    <span className="font-semibold text-neutral-600 text-sm whitespace-nowrap truncate">
                        Backlog <span className="text-gray-400 font-normal ml-1">({issue?.length || 0} issues)</span>
                    </span>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 overflow-x-auto">
                     <div className="shrink-0 flex items-center pr-1 lg:pr-2">
                         <StatusBar statusCount={statusCount} taskTypes={taskTypes} isLoading={showInitialSkeleton} />
                     </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="advanceMuted"
                            className="shrink-0 h-8 px-3 text-xs sm:text-sm"
                            onClick={() => {
                                if (!expanded) onToggleExpand();
                                setShowCreateRow(true);
                            }}
                        >
                            Create task
                        </Button>
                        <Button size="sm" variant="advanceMuted" className="shrink-0 h-8 px-3 text-xs sm:text-sm" onClick={onCreateSprintClick}>
                            Create sprint
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <TooltipWrapper content={"More actions"} disableFocusListener>
                                        <MoreHorizontal className="w-5 h-5 text-neutral-500" />
                                    </TooltipWrapper>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48" align="end">
                                <div className="p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="group-by-status" className="text-sm font-medium text-neutral-700 cursor-pointer">
                                            Group by Status
                                        </Label>
                                        <Switch
                                            id="group-by-status"
                                            checked={groupByStatus}
                                            onCheckedChange={setGroupByStatus}
                                        />
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                                {virtualItems.map((virtualRow) => {
                                    // Check if this index is beyond actual data (skeleton row)
                                    const isSkeletonRow = virtualRow.index >= (itemsToRender?.length ?? 0);

                                    if (isSkeletonRow) {
                                        return (
                                            <div
                                                key={`loading-more-${virtualRow.index}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${ROW_HEIGHT}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="flex justify-center items-center"
                                            >
                                                <div className="flex items-center gap-[5px] bg-white px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-50">
                                                    <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const task = itemsToRender[virtualRow.index];
                                    if (!task) return null;

                                    if (task.isHeader) {
                                        return (
                                            <div
                                                key={`header-${task.statusName}-${virtualRow.index}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${ROW_HEIGHT}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="flex items-center px-4 py-2 bg-transparent cursor-pointer hover:bg-neutral-50 transition-colors"
                                                onClick={() => toggleGroupExpand(task.statusValue)}
                                            >
                                                <div className="flex items-center gap-2 pt-4">
                                                    {task.isExpanded ? (
                                                        <ChevronDown size={18} className="text-neutral-500 hover:text-neutral-700" />
                                                    ) : (
                                                        <ChevronRight size={18} className="text-neutral-500 hover:text-neutral-700" />
                                                    )}
                                                    <span className="text-[13px] font-semibold text-neutral-700 uppercase">
                                                        {task.statusName}
                                                    </span>
                                                    <span className="px-[6px] py-[2px] rounded-full text-[11px] font-semibold bg-neutral-200 text-neutral-600 leading-none flex items-center justify-center">
                                                        {task.count}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (task.isEmptyPlaceholder) {
                                        return (
                                            <div
                                                key={`empty-${task.statusValue}-${virtualRow.index}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${ROW_HEIGHT}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="flex items-center pl-12 pr-4 text-sm italic text-neutral-400"
                                            >
                                                No issues in this status
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
                                            searchQuery={searchQuery}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {showCreateRow && (
                        <InlineCreateTaskRow
                            projectId={currentProjectId}
                            workType="task"
                            statusOptions={taskTypes}
                            importanceOptions={importanceTypes}
                            onClose={() => setShowCreateRow(false)}
                        />
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
                            handleUpdateTask('parentId', selectedParent._id, parentDialogState.task._id, selectedParent);
                            setParentDialogState({ isOpen: false, task: null });
                        }
                    }}
                />
            )}
            {sprintDialogState.isOpen && (
                <LazySprintSelector
                    isOpen={sprintDialogState.isOpen}
                    onClose={(open) => {
                        if (!open) setSprintDialogState(prev => ({ ...prev, isOpen: false }));
                    }}
                    onChange={(selectedSprint) => {
                        if (selectedSprint && sprintDialogState.task) {
                            handleUpdateTask('sprintId', selectedSprint._id, sprintDialogState.task._id, selectedSprint);
                            setSprintDialogState({ isOpen: false, task: null });
                        }
                    }}
                    projectId={currentProjectId}
                />
            )}
            <DeleteTaskDialog
                isOpen={deleteDialogState.isOpen}
                setIsOpen={(open) => {
                    if (!open) setDeleteDialogState({ isOpen: false, task: null });
                }}
                taskInfo={{
                    _id: deleteDialogState.task?._id,
                    project_key: deleteDialogState.task?.project_key,
                    taskNumber: deleteDialogState.task?.taskNumber,
                    summary: deleteDialogState.task?.summary,
                    work_type: deleteDialogState.task?.work_type
                }}
                onConfirm={handleDeleteTask}
                isLoading={deleteLoading}
            />
        </div >
    );
};

export default memo(BacklogTable);