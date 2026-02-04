import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ClipboardX, Flag, Pencil } from "lucide-react";
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
    workType,
    editingTaskId,
    summaryValues,
    assigneeStates,
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
    const matchWorkType = useMemo(
        () => workType.find(type => type.slug === task?.work_type),
        [workType, task?.work_type]
    );

    const isEditing = editingTaskId === task._id;
    const assigneeState = assigneeStates[task._id] || { isOpen: false, assignee: {} };
    const hasAssignee = Object.keys(assigneeState.assignee).length > 0;

    const taskInfo = useMemo(() => ({
        _id: task._id,
        workType: task.work_type,
        project_key: task.project_key,
        taskNumber: task.taskNumber,
        summary: task.summary
    }), [task._id, task.work_type, task.project_key, task.taskNumber, task.summary]);

    const menuItems = useMemo(
        () => getWorkItemMenuItems(task),
        [getWorkItemMenuItems, task]
    );

    const handleRowClickInternal = useCallback((e) => {
        onRowClick(e, task._id);
    }, [onRowClick, task._id]);

    const handleSummaryClickInternal = useCallback((e) => {
        onSummaryClick(e, task._id);
    }, [onSummaryClick, task._id]);

    const handleSummaryChangeInternal = useCallback((e) => {
        onSummaryChange(e, task._id);
    }, [onSummaryChange, task._id]);

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
        <TableRow
            key={task._id}
            className={`group cursor-pointer transition-colors
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
                display: 'table',
                tableLayout: 'fixed',
            }}
        >
            {/* Task ID and Type */}
            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">
                <div className="flex items-center justify-start text-neutral-500">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${matchWorkType?.color || 'bg-gray-200'}`}>
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
                    <div className='underline hover:text-blue-600 text-base font-semibold ml-1'>
                        <span className="font-medium">{task?.project_key}-{task?.taskNumber}</span>
                    </div>
                </div>
            </TableCell>

            {/* Summary */}
            <TableCell className="w-auto p-2">
                <div className="flex items-center text-sm font-semibold text-neutral-500" data-no-row-click>
                    {isEditing ? (
                        <Input
                            value={summaryValues[task._id] || ''}
                            onChange={handleSummaryChangeInternal}
                            onKeyDown={handleSummaryKeyDownInternal}
                            onBlur={handleSummaryBlurInternal}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8"
                        />
                    ) : (
                        <>
                            <span
                                className="truncate max-w-full"
                                title={task?.summary}
                            >
                                {task?.summary}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-2 w-6 h-6 opacity-0 group-hover:opacity-100"
                                onClick={handleSummaryClickInternal}
                            >
                                <Pencil className="w-3 h-3" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>

            {/* Task Status */}
            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">
                <div className="flex items-center justify-start" data-no-row-click>
                    <WorkSelector
                        initialValue={task?.task_status}
                        workTypes={taskTypes}
                        onChange={changeTaskStatusInternal}
                    />
                </div>
            </TableCell>

            {/* Importance */}
            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">
                <div className="flex items-center justify-start" data-no-row-click>
                    <WorkSelector
                        initialValue={task?.importance}
                        workTypes={importanceTypes}
                        onChange={changeImportanceInternal}
                    />
                </div>
            </TableCell>

            {/* Flag */}
            <TableCell className="w-[60px] min-w-[60px] max-w-[60px] text-center p-2">
                <div
                    data-no-row-click
                    className="flex justify-center items-center"
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
            </TableCell>

            {/* Assignee */}
            <TableCell className="w-[80px] min-w-[80px] max-w-[80px] text-center p-2">
                <div className="flex items-center justify-center" data-no-row-click>
                    <DropdownMenu
                        open={assigneeState.isOpen}
                        onOpenChange={toggleAssigneeOpenInternal}
                    >
                        <DropdownMenuTrigger asChild>
                            <div
                                onClick={handleAvatarClickInternal}
                                className="cursor-pointer"
                            >
                                {hasAssignee ? (
                                    <ManageAvatar
                                        firstName={assigneeState.assignee?.first_name}
                                        lastName={assigneeState.assignee?.last_name}
                                        image={assigneeState.assignee?.image}
                                        size='sm'
                                        tooltipContent={`${assigneeState.assignee?.first_name} ${assigneeState.assignee?.last_name}`}
                                        showTooltip={!assigneeState.isOpen}
                                    />
                                ) : (
                                    <ManageAvatar
                                        fallbackIcon={true}
                                        size='sm'
                                        tooltipContent="Unassigned"
                                        showTooltip={!assigneeState.isOpen}
                                    />
                                )}
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
                                slug={'member'}
                                onChange={handleAssigneeChangeInternal}
                                label={"Select assignee"}
                                projectId={currentProjectId}
                                showDropdown={true}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>

            {/* Actions Menu */}
            <TableCell className="w-[56px] min-w-[56px] max-w-[56px] text-center p-2">
                <div data-no-row-click onClick={(e) => e.stopPropagation()}>
                    <CommonDropdownMenu items={menuItems} />

                </div>
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.task._id === nextProps.task._id &&
        prevProps.task.summary === nextProps.task.summary &&
        prevProps.task.task_status === nextProps.task.task_status &&
        prevProps.task.importance === nextProps.task.importance &&
        prevProps.task.isFlagged === nextProps.task.isFlagged &&
        prevProps.task.assigneeDetail?._id === nextProps.task.assigneeDetail?._id &&
        prevProps.virtualRow.start === nextProps.virtualRow.start &&
        prevProps.editingTaskId === nextProps.editingTaskId &&
        prevProps.summaryValues[prevProps.task._id] === nextProps.summaryValues[nextProps.task._id] &&
        prevProps.assigneeStates[prevProps.task._id]?.isOpen === nextProps.assigneeStates[nextProps.task._id]?.isOpen
    );
});

TaskRow.displayName = 'TaskRow';

const BacklogTable = ({ issue, expanded, onToggleExpand, onEditSprint, userData, projectData }) => {
    console.log("issue------------", issue);

    const { currentProject, workType, importance, workFlow } = projectData;
    const [updateTask, { isLoading }] = useUpdateIssueMutation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [summaryValues, setSummaryValues] = useState({});
    const [assigneeStates, setAssigneeStates] = useState({});
    const [currentFlagTask, setCurrentFlagTask] = useState(null);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
    const addFlagRef = useRef(null);
    const parentRef = useRef(null);

    useEffect(() => {
        if (issue && issue.length > 0) {
            const newSummaries = {};
            const newAssignees = {};
            const newFlags = {};

            issue.forEach(task => {
                newSummaries[task._id] = task.summary || '';
                newAssignees[task._id] = {
                    isOpen: false,
                    assignee: task.assigneeDetail || {}
                };
                newFlags[task._id] = {
                    isOpen: false,
                    isFlagged: task.isFlagged || false
                };
            });

            setSummaryValues(newSummaries);
            setAssigneeStates(newAssignees);
        }
    }, [issue]);

    const rowVirtualizer = useVirtualizer({
        count: issue?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 15,
    });

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
                    handleUpdateTask('isFlagged', false, task._id);
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
    ], [copyLinkKey]);

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
                            className="h-[600px] overflow-auto"
                        >
                            <div className="min-w-[1200px]">
                                <Table className="w-full table-fixed">
                                    <TableBody
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            position: 'relative',
                                            display: 'block',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const task = issue[virtualRow?.index];

                                            if (!task) {
                                                return (
                                                    <TableRow
                                                        key={`skeleton-${virtualRow.index}`}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: `${ROW_HEIGHT}px`,
                                                            transform: `translateY(${virtualRow.start}px)`,
                                                            display: 'table',
                                                            tableLayout: 'fixed',
                                                        }}
                                                    >
                                                        <IssueRowSkeleton />
                                                    </TableRow>
                                                );
                                            }

                                            return (
                                                <TaskRow
                                                    key={task._id}
                                                    task={task}
                                                    virtualRow={virtualRow}
                                                    workType={workType}
                                                    editingTaskId={editingTaskId}
                                                    summaryValues={summaryValues}
                                                    assigneeStates={assigneeStates}
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
                                    </TableBody>
                                </Table>
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
            {currentFlagTask && (
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
            )}
        </div>
    );
};

export default memo(BacklogTable);