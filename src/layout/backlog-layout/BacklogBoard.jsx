import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flag, Loader2, ClipboardX } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ManageAvatar from '@/components/common/ManageAvatar';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import { useUpdateIssueMutation } from '@/redux/graphql_api/task';
import CommonDropdownMenu from '@/components/common/CommonDropdownMenu';
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector';
import AddFlag from '@/components/common/AddFlag';
import ShowToast from '@/components/common/ShowToast';

const UNMAPPED_KEY = '__unmapped__';

// Estimated card height (incl. the gap below it) used to seed virtualization.
// The real height is measured per visible card, so this only needs to be close.
const ESTIMATED_CARD_HEIGHT = 116;
const CARD_GAP = 8;

// A colour coming from the workflow config can either be a hex value (starts
// with #) or a tailwind class such as "bg-blue-500". This helper returns the
// right shape for both so a small dot renders correctly either way.
const getDotProps = (color) => {
    if (!color) return { className: 'bg-neutral-300' };
    if (color.startsWith('#')) return { style: { backgroundColor: color } };
    return { className: color };
};

const BoardCard = memo(({ task, workTypeMap, importanceType, onOpen, onDragStart, currentProjectId, onUpdateTask, onCopy, onFlag }) => {
    const matchWorkType = workTypeMap?.get(task?.work_type);
    const assignee = task?.assigneeDetail || null;
    const hasAssignee = Boolean(assignee && assignee._id);
    const impDot = getDotProps(importanceType?.color);

    // Same actions menu the backlog rows use.
    const menuItems = useMemo(() => [
        {
            id: 'move-sprint',
            type: 'submenu',
            label: 'Move to sprint',
            content: (
                <DynamicDropdownSelector
                    slug="sprint"
                    showDropdown={true}
                    label="Select sprint"
                    projectId={currentProjectId}
                    onChange={(sprint) => sprint && onUpdateTask('sprintId', sprint._id, task._id, sprint)}
                />
            )
        },
        { type: 'separator' },
        {
            id: 'copy-link',
            label: 'Copy link',
            onSelect: () => onCopy(true, false, task._id, task.project_key, task.taskNumber, task.work_type)
        },
        {
            id: 'copy-key',
            label: 'Copy key',
            onSelect: () => onCopy(false, true, task._id, task.project_key, task.taskNumber, task.work_type)
        },
        { type: 'separator' },
        {
            id: task.isFlagged ? 'remove-flag' : 'add-flag',
            label: task.isFlagged ? 'Remove flag' : 'Add flag',
            onSelect: () => onFlag(task)
        },
        {
            id: 'parent',
            type: 'submenu',
            label: 'Parent',
            content: (
                <DynamicDropdownSelector
                    slug="parent"
                    showDropdown={true}
                    label="Select parent"
                    projectId={currentProjectId}
                    onChange={(parent) => parent && onUpdateTask('parentId', parent._id, task._id, parent)}
                />
            )
        },
        { type: 'separator' },
        {
            id: 'delete',
            label: 'Delete',
            danger: true,
            onSelect: () => ShowToast.info('Delete is not available yet')
        }
    ], [task, currentProjectId, onUpdateTask, onCopy, onFlag]);

    return (
        <div
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onOpen(task._id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(task._id);
                }
            }}
            className={`group relative flex flex-col gap-2.5 rounded-lg border bg-white p-3 text-left shadow-sm transition-all cursor-pointer
                hover:shadow-md hover:border-neutral-300 active:cursor-grabbing
                ${task?.isFlagged ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`}
        >
            {/* Actions menu (same as backlog rows) */}
            <div
                data-no-row-click
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                draggable={false}
            >
                <CommonDropdownMenu items={menuItems} />
            </div>

            {/* Summary */}
            <p className="text-sm font-medium text-neutral-700 leading-snug line-clamp-3 pr-6" title={task?.summary}>
                {task?.summary}
            </p>

            {/* Footer meta row */}
            <div className="flex items-center gap-2">
                {/* work type + key */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${matchWorkType?.color || 'bg-neutral-200'}`}>
                        {matchWorkType?.icon && (
                            <img
                                src={matchWorkType.icon}
                                loading="lazy"
                                alt={matchWorkType.name}
                                className="w-2.5 h-2.5 filter brightness-0 invert"
                                decoding="async"
                            />
                        )}
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 truncate">
                        {task?.project_key}-{task?.taskNumber}
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {importanceType && (
                        <TooltipWrapper content={importanceType.name} disableFocusListener>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                                <span className="w-2 h-2 rounded-full" {...impDot} />
                            </span>
                        </TooltipWrapper>
                    )}

                    {task?.isFlagged && (
                        <Flag className="text-red-500 shrink-0" size={13} fill="currentColor" />
                    )}

                    {hasAssignee ? (
                        <ManageAvatar
                            firstName={assignee?.first_name}
                            lastName={assignee?.last_name}
                            image={assignee?.image}
                            size="xs"
                            tooltipContent={`${assignee?.first_name} ${assignee?.last_name}`}
                            showTooltip={true}
                        />
                    ) : (
                        <ManageAvatar fallbackIcon size="xs" tooltipContent="Unassigned" showTooltip={true} />
                    )}
                </div>
            </div>
        </div>
    );
});
BoardCard.displayName = 'BoardCard';

// One workflow column. Its card list is virtualized, so only the cards inside
// the visible window are mounted. A column holding tens of thousands of tasks
// still renders just a handful of DOM nodes, which is what keeps a very large
// board responsive.
const BoardColumn = memo(({
    column, workTypeMap, importanceMap, currentProjectId, onOpen, onDragStart, onDrop,
    onUpdateTask, onCopy, onFlag, isDropTarget, setDragOverColumn, hasMore, isLoading, onReachEnd,
}) => {
    const parentRef = useRef(null);
    const dot = getDotProps(column.color);
    const tasks = column.tasks;

    const virtualizer = useVirtualizer({
        count: tasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ESTIMATED_CARD_HEIGHT,
        overscan: 6,
    });
    const virtualItems = virtualizer.getVirtualItems();

    // Ask the parent for the next page as the user nears the end of a column.
    // The scrollTop guard stops a short column from auto pulling every page on
    // mount before the user has scrolled at all.
    useEffect(() => {
        if (!hasMore || isLoading || tasks.length === 0) return;
        const el = parentRef.current;
        if (!el || el.scrollTop <= 0) return;
        const last = virtualItems[virtualItems.length - 1];
        if (last && last.index >= tasks.length - 5) {
            onReachEnd();
        }
    }, [virtualItems, hasMore, isLoading, tasks.length, onReachEnd]);

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                if (column.key !== UNMAPPED_KEY) setDragOverColumn(column.key);
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOverColumn(null);
            }}
            onDrop={(e) => onDrop(e, column.key)}
            className={`w-[300px] shrink-0 flex flex-col max-h-full rounded-xl border bg-neutral-50 transition-colors
                ${isDropTarget ? 'border-blue-400 bg-blue-50/50' : 'border-neutral-200'}`}
        >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-200/70">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" {...dot} />
                <span className="text-[13px] font-semibold text-neutral-700 uppercase tracking-wide truncate">
                    {column.name}
                </span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-200 text-neutral-600 leading-none">
                    {tasks.length}
                </span>
            </div>

            {/* Column body (virtualized) */}
            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-[80px]">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-neutral-200 text-xs text-neutral-400">
                        Drop issues here
                    </div>
                ) : (
                    <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {virtualItems.map((vi) => {
                            const task = tasks[vi.index];
                            if (!task) return null;
                            return (
                                <div
                                    key={task._id}
                                    data-index={vi.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${vi.start}px)`,
                                        paddingBottom: `${CARD_GAP}px`,
                                    }}
                                >
                                    <BoardCard
                                        task={task}
                                        workTypeMap={workTypeMap}
                                        importanceType={importanceMap.get(task.importance)}
                                        onOpen={onOpen}
                                        onDragStart={onDragStart}
                                        currentProjectId={currentProjectId}
                                        onUpdateTask={onUpdateTask}
                                        onCopy={onCopy}
                                        onFlag={onFlag}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {isLoading && hasMore && tasks.length > 0 && (
                    <div className="flex justify-center py-2 text-neutral-400">
                        <Loader2 size={16} className="animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
});
BoardColumn.displayName = 'BoardColumn';

const BacklogBoard = ({ issue, projectData, isLoading, hasMore, onLoadMore, searchQuery }) => {
    const { workType, workFlow, importance, currentProject } = projectData;
    const currentProjectId = currentProject?._id;
    const [updateTask] = useUpdateIssueMutation();
    const [, setSearchParams] = useSearchParams();

    // A light override map (taskId -> newStatus) lets a dragged card jump columns
    // instantly without cloning the whole (possibly huge) issue array on every
    // drop. It is cleared whenever a fresh list arrives from the server.
    const [statusOverrides, setStatusOverrides] = useState({});
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const [currentFlagTask, setCurrentFlagTask] = useState(null);
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);

    useEffect(() => {
        setStatusOverrides({});
    }, [issue]);

    const taskTypes = useMemo(() =>
        (workFlow || []).map((status, index) => ({
            id: index + 1,
            name: status.name,
            value: status.slug,
            color: status.color
        })),
        [workFlow]
    );

    const importanceMap = useMemo(() => {
        const map = new Map();
        (importance || []).forEach((imp, index) => {
            map.set(imp.slug, { id: index + 1, name: imp.name, value: imp.slug, color: imp.color });
        });
        return map;
    }, [importance]);

    const workTypeMap = useMemo(() =>
        new Map((workType || []).map((status, index) => [
            status.slug,
            { id: index + 1, name: status.name, value: status.slug, color: status.color, icon: status.icon }
        ])),
        [workType]
    );

    const handleUpdateTask = useCallback(async (key, value, id, fullDetail) => {
        try {
            const payload = {
                operationName: 'updateTask',
                variables: {
                    taskId: id,
                    key,
                    value,
                    ...(fullDetail !== undefined && { fullDetail })
                }
            };
            return await updateTask(payload).unwrap();
        } catch (error) {
            ShowToast.error('Could not update the task');
            throw error;
        }
    }, [updateTask]);

    const copyLinkKey = useCallback((isLink, isKey, issueId, projectKey, taskNumber) => {
        const taskIdentifier = `${projectKey}-${taskNumber}`;
        let textToCopy;
        let message = '';

        if (isLink) {
            textToCopy = `${window.location.origin}/${taskIdentifier}/${issueId}`;
            message = `You've copied the link to ${taskIdentifier} to your clipboard`;
        } else if (isKey) {
            textToCopy = taskIdentifier;
            message = 'Key successfully copied to your clipboard';
        } else {
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => ShowToast.info(message))
            .catch((err) => ShowToast.warning(err));
    }, []);

    const handleFlag = useCallback((task) => {
        if (task.isFlagged) {
            handleUpdateTask('isFlagged', 'false', task._id);
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
    }, [handleUpdateTask]);

    // Single pass bucketing of every loaded issue into its workflow column. This
    // is O(n) in the number of loaded issues, so it stays linear even at scale.
    // Anything with a status outside the workflow lands in a trailing column.
    const columns = useMemo(() => {
        const grouped = {};
        taskTypes.forEach((t) => { grouped[t.value] = []; });
        const unmapped = [];
        const hasOverrides = Object.keys(statusOverrides).length > 0;

        const list = issue || [];
        for (let i = 0; i < list.length; i++) {
            const task = list[i];
            const status = hasOverrides && statusOverrides[task._id] !== undefined
                ? statusOverrides[task._id]
                : task.task_status;
            if (status && grouped[status] !== undefined) {
                grouped[status].push(task);
            } else {
                unmapped.push(task);
            }
        }

        const cols = taskTypes.map((t) => ({
            key: t.value,
            name: t.name,
            color: t.color,
            tasks: grouped[t.value] || []
        }));

        if (unmapped.length > 0) {
            cols.push({ key: UNMAPPED_KEY, name: 'No status', color: 'bg-neutral-300', tasks: unmapped });
        }
        return cols;
    }, [issue, taskTypes, statusOverrides]);

    const openIssue = useCallback((id) => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set('issueId', id);
            return newParams;
        });
    }, [setSearchParams]);

    const handleDragStart = useCallback((e, task) => {
        e.dataTransfer.effectAllowed = 'move';
        const currentStatus = statusOverrides[task._id] ?? task.task_status;
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: task._id, from: currentStatus }));
    }, [statusOverrides]);

    const handleDrop = useCallback((e, columnKey) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (columnKey === UNMAPPED_KEY) return; // cannot drop into the synthetic column

        let payload;
        try {
            payload = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch {
            return;
        }
        if (!payload?.id || payload.from === columnKey) return;

        // Optimistic move via the override map (no big array clone).
        setStatusOverrides((prev) => ({ ...prev, [payload.id]: columnKey }));

        updateTask({
            operationName: 'updateTask',
            variables: { taskId: payload.id, key: 'task_status', value: columnKey }
        }).unwrap().catch(() => {
            // Roll the single card back on failure.
            setStatusOverrides((prev) => ({ ...prev, [payload.id]: payload.from }));
            ShowToast.error('Could not move the task');
        });
    }, [updateTask]);

    const total = (issue || []).length;
    const isEmpty = !isLoading && total === 0;

    if (isLoading && total === 0) {
        return (
            <div className="flex gap-4 h-full pb-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[300px] shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse mb-3" />
                        <div className="space-y-2">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="h-24 bg-white border border-neutral-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center gap-2">
                <ClipboardX size={56} className="text-neutral-300" />
                <span className="text-sm text-neutral-500">
                    {searchQuery ? 'No issues match your search.' : 'No tasks have been added to this backlog.'}
                </span>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {columns.map((col) => (
                    <BoardColumn
                        key={col.key}
                        column={col}
                        workTypeMap={workTypeMap}
                        importanceMap={importanceMap}
                        currentProjectId={currentProjectId}
                        onOpen={openIssue}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onUpdateTask={handleUpdateTask}
                        onCopy={copyLinkKey}
                        onFlag={handleFlag}
                        isDropTarget={dragOverColumn === col.key}
                        setDragOverColumn={setDragOverColumn}
                        hasMore={hasMore}
                        isLoading={isLoading}
                        onReachEnd={onLoadMore}
                    />
                ))}
            </div>

            {/* Manual load more at the bottom of the board. The columns also pull
                the next page on scroll, but a board has no single vertical scroll
                to reach the end with, so this button gives the user a clear way
                to fetch more tasks. */}
            {hasMore && (
                <div className="flex justify-center py-3 shrink-0">
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                Loading
                            </>
                        ) : (
                            'Load more tasks'
                        )}
                    </button>
                </div>
            )}

            {currentFlagTask && (
                <AddFlag
                    isOpen={isFlagDialogOpen}
                    setIsOpen={setIsFlagDialogOpen}
                    taskInfo={currentFlagTask}
                    isFlagged={true}
                    onConfirm={() => {
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

export default memo(BacklogBoard);
