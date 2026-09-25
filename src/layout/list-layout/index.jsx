import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronsDownUp, ClipboardList, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddFlag from "@/components/common/AddFlag";
import DeleteTaskDialog from "@/components/common/DeleteTaskDialog";
import DynamicDropdownSelector from "@/components/common/DynamicDropdownSelector";
import ShowToast from "@/components/common/ShowToast";
import IssueRowSkeleton from "@/components/data-table/IssueRowSkeleton";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import useDateFormatter from "@/hooks/useDateFormatter";
import { useProjectData } from "@/hooks/useProjectData";
import { useDeleteTaskMutation, useUpdateIssueMutation } from "@/redux/graphql_api/task";
import { useLoadMoreOnVisible } from "@/layout/backlog-layout/epic-panel/useLoadMoreOnVisible";
import EditIssue from "@/layout/backlog-layout/[id]/EditIssue";
import ListRow, { ACTIONS_WIDTH } from "./ListRow";
import ListToolbar from "./ListToolbar";
import { EXPANDER_WIDTH, INDENT_PER_LEVEL } from "./listColumns";
import { useListChildren } from "./useListChildren";
import { useListColumns } from "./useListColumns";
import { useListFilters } from "./useListFilters";
import { useListRows } from "./useListRows";

// The List view.
//
// Every work item of the project in one table. The epics are the rows you see
// first, and the tasks inside an epic arrive when that row is opened - the same
// drill down as the Timeline, but read as a list.
//
// The three parts that make it work each live in their own file:
//   listColumns.js  - every column, and how its cell behaves
//   listFilters.js  - every filter, and the field it sends to the server
//   useList*.js     - the rows, the opened rows, the columns and the filters
//
// This file puts them together: it owns the page layout, saving an edit, and
// creating a work item.

// Turns one of the project template lists into the option shape the selects and
// the filter panels use.
const toOptions = (source) => (source || []).map((entry, index) => ({
    id: index + 1,
    name: entry.name,
    value: entry.slug,
    color: entry.color,
    icon: entry.icon
}));

const ListView = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const issueId = searchParams.get('issueId');

    const { currentProject, workType, importance, workFlow } = useProjectData();
    const projectId = currentProject?._id;

    const formatDate = useDateFormatter("dd MMM yyyy");
    const [updateTask] = useUpdateIssueMutation();
    const [deleteTask, { isLoading: deleteLoading }] = useDeleteTaskMutation();

    const filters = useListFilters();
    const columnsState = useListColumns(projectId);

    // Which column the server is ordering by. Nothing is sorted to begin with,
    // which reads in the project's own order, the same as the backlog.
    const [sort, setSort] = useState({ by: null, dir: 'asc' });

    const {
        rows,
        totalCount,
        hasMore,
        isLoading,
        isFetching,
        loadMore,
        reload,
        patchRow,
        removeRow
    } = useListRows({ projectId, filter: filters.filter, sortBy: sort.by, sortDir: sort.dir });

    // Read one by one rather than as a single object: each of these keeps the
    // same identity between renders, which is what lets a row skip redrawing
    // when something elsewhere on the page changes.
    const {
        expanded: openRows,
        toggleRow,
        refreshRow,
        loadMoreChildren,
        collapseAll,
        patchChild,
        removeChild,
        pruneTo
    } = useListChildren({ projectId, filter: filters.filter, sortBy: sort.by, sortDir: sort.dir });

    // A row that is no longer in the list cannot be on screen, so its child
    // list is dropped.
    useEffect(() => {
        pruneTo(new Set(rows.map((row) => row._id)));
    }, [rows, pruneTo]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createUnder, setCreateUnder] = useState(null); // id of the row being added to
    const [flagTarget, setFlagTarget] = useState(null);
    const [isFlagOpen, setIsFlagOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const optionLists = useMemo(() => ({
        status: toOptions(workFlow),
        importance: toOptions(importance),
        workType: toOptions(workType)
    }), [workFlow, importance, workType]);

    const workTypeMap = useMemo(
        () => new Map(toOptions(workType).map((option) => [option.value, option])),
        [workType]
    );

    // What the create bar offers in its work type dropdown. Whatever the
    // project template defines shows up, so a project with a story or a bug
    // type needs no change here.
    //
    // A child row leaves the epic out: an epic holds work items, it is not one
    // of them.
    const childWorkTypeOptions = useMemo(
        () => optionLists.workType.filter((option) => option.value !== 'epic'),
        [optionLists.workType]
    );

    const defaultWorkType = useMemo(() => {
        const preferred = childWorkTypeOptions.find((option) => option.value === 'task');
        return (preferred || childWorkTypeOptions[0] || optionLists.workType[0])?.value || 'task';
    }, [childWorkTypeOptions, optionLists.workType]);

    const sentinelRef = useLoadMoreOnVisible({ hasMore, isFetching, onLoadMore: loadMore });

    const handleOpenRow = useCallback((rowId) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set('issueId', rowId);
            return next;
        });
    }, [setSearchParams]);

    // Saves one cell.
    //
    // The new value is shown straight away at whichever level the row sits on,
    // and the old one is put back if the server refuses the change - a rejected
    // date, for example, comes back as a message rather than an error.
    const handleUpdate = useCallback(async (row, column, value, fullDetail) => {
        const key = column.updateKey;
        if (!key) return;

        // The people, parent, team and sprint cells send an id but show a whole
        // object, so what goes on the row is the object, not the id.
        const isDetailColumn = column.type === 'member' || column.type === 'entity';
        const shown = isDetailColumn ? (fullDetail || null) : value;

        const previous = { [column.field]: row[column.field] };
        const optimistic = { [column.field]: shown };

        patchRow(row._id, optimistic);
        patchChild(row._id, optimistic);

        try {
            const response = await updateTask({
                operationName: "updateTask",
                variables: {
                    taskId: row._id,
                    key,
                    value,
                    ...(fullDetail !== undefined ? { fullDetail } : {})
                }
            }).unwrap();

            const result = response?.data?.updateTask;
            if (result?.status && result.status >= 400) {
                throw new Error(result.message || 'The change was not saved');
            }
        } catch (error) {
            patchRow(row._id, previous);
            patchChild(row._id, previous);
            ShowToast.error(error?.message || `Could not update ${column.label.toLowerCase()}`);
        }
    }, [patchChild, patchRow, updateTask]);

    // Flagging asks for a reason, so it goes through the dialog. Removing a flag
    // does not, so it is saved on the spot.
    const handleToggleFlag = useCallback((row) => {
        if (!row.isFlagged) {
            setFlagTarget(row);
            setIsFlagOpen(true);
            return;
        }

        const revert = { isFlagged: true, flagReason: row.flagReason };
        patchRow(row._id, { isFlagged: false, flagReason: null });
        patchChild(row._id, { isFlagged: false, flagReason: null });

        updateTask({
            operationName: "updateTask",
            variables: { taskId: row._id, key: 'isFlagged', value: 'false' }
        }).unwrap().catch(() => {
            patchRow(row._id, revert);
            patchChild(row._id, revert);
            ShowToast.error('Could not remove the flag');
        });
    }, [patchChild, patchRow, updateTask]);

    const copyKeyOrLink = useCallback((row, asLink) => {
        const identifier = `${row.project_key}-${row.taskNumber}`;
        const text = asLink ? `${window.location.origin}/${identifier}/${row._id}` : identifier;

        navigator.clipboard.writeText(text)
            .then(() => ShowToast.info(asLink ? `Link to ${identifier} copied` : 'Key copied'))
            .catch((error) => ShowToast.warning(String(error)));
    }, []);

    const rowMenuItems = useCallback((row) => [
        { id: 'open', label: 'Open item', onSelect: () => handleOpenRow(row._id) },
        { id: 'copy-link', label: 'Copy link', onSelect: () => copyKeyOrLink(row, true) },
        { id: 'copy-key', label: 'Copy key', onSelect: () => copyKeyOrLink(row, false) },
        { type: 'separator' },
        {
            id: 'move-sprint',
            type: 'submenu',
            label: 'Move to sprint',
            content: (
                <DynamicDropdownSelector
                    slug="sprint"
                    showDropdown={true}
                    label="Select sprint"
                    projectId={projectId}
                    onChange={(sprint) => {
                        if (!sprint) return;
                        handleUpdate(
                            row,
                            { updateKey: 'sprintId', field: 'sprintDetail', type: 'entity', label: 'Sprint' },
                            sprint._id,
                            { _id: sprint._id, name: sprint.name }
                        );
                    }}
                />
            )
        },
        {
            id: 'flag',
            label: row.isFlagged ? 'Remove flag' : 'Add flag',
            onSelect: () => handleToggleFlag(row)
        },
        { type: 'separator' },
        {
            id: 'delete',
            label: 'Delete',
            danger: true,
            onSelect: () => setDeleteTarget(row)
        }
    ], [copyKeyOrLink, handleOpenRow, handleToggleFlag, handleUpdate, projectId]);

    const handleDelete = useCallback(async (reason) => {
        if (!deleteTarget) return;

        try {
            const response = await deleteTask({
                operationName: "deleteTask",
                variables: { taskId: deleteTarget._id, reason }
            }).unwrap();

            if (response?.data?.deleteTask?.status === 200) {
                removeRow(deleteTarget._id);
                removeChild(deleteTarget._id);
                setDeleteTarget(null);
                ShowToast.success('Work item moved to the archive');
            } else {
                ShowToast.error(response?.data?.deleteTask?.message || 'Could not delete the work item');
            }
        } catch (error) {
            ShowToast.error(error?.message || 'Could not delete the work item');
        }
    }, [deleteTarget, deleteTask, removeChild, removeRow]);

    // A new child changes both the parent's task list and its child count, so
    // the open row is read again and the list is refreshed.
    const handleChildCreated = useCallback((parentId) => {
        refreshRow(parentId);
        reload();
    }, [refreshRow, reload]);

    const handleSort = useCallback((column) => {
        if (!column.sortKey) return;
        setSort((current) => (
            current.by === column.sortKey
                ? { by: column.sortKey, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                : { by: column.sortKey, dir: 'asc' }
        ));
    }, []);

    // Handed to every cell. One object, so a row is only redrawn when its own
    // values change and not every time this page renders.
    const cellContext = useMemo(() => ({
        optionLists,
        workTypeMap,
        projectId,
        formatDate,
        onUpdate: handleUpdate,
        onToggleFlag: handleToggleFlag,
        onOpenRow: handleOpenRow
    }), [formatDate, handleOpenRow, handleToggleFlag, handleUpdate, optionLists, projectId, workTypeMap]);

    const toolbarFilters = useMemo(() => ({ ...filters, optionLists }), [filters, optionLists]);

    const columns = columnsState.columns;
    const showInitialSkeleton = isLoading && rows.length === 0;
    const isEmpty = !isLoading && rows.length === 0;

    // A row, then its children under it if it is open, then their children -
    // the same shape at every level, so the depth is not limited to two.
    const renderRow = (row, depth) => {
        const state = openRows.get(row._id);
        const indent = { paddingLeft: EXPANDER_WIDTH + (depth + 1) * INDENT_PER_LEVEL };

        return (
            <Fragment key={row._id}>
                <ListRow
                    row={row}
                    columns={columns}
                    ctx={cellContext}
                    depth={depth}
                    canExpand={(row.childCount || 0) > 0}
                    isExpanded={Boolean(state)}
                    onToggle={toggleRow}
                    menuItems={rowMenuItems}
                />

                {state && (
                    <>
                        {state.children.map((child) => renderRow(child, depth + 1))}

                        {state.loading && (
                            <div className="flex items-center gap-2 border-b bg-neutral-50/60 py-2 text-xs text-neutral-500" style={indent}>
                                <Loader2 size={13} className="animate-spin" />
                                Loading child items
                            </div>
                        )}

                        {!state.loading && state.children.length === 0 && (
                            <div className="border-b bg-neutral-50/60 py-2 text-xs text-neutral-500" style={indent}>
                                {filters.activeCount > 0
                                    ? 'No child item matches the filters in use.'
                                    : 'No child item yet.'}
                            </div>
                        )}

                        {!state.loading && state.hasMore && (
                            <div className="border-b bg-neutral-50/60 py-1.5" style={indent}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => loadMoreChildren(row._id)}
                                >
                                    Show more of {state.totalCount ? `${state.children.length} of ${state.totalCount}` : 'these items'}
                                </Button>
                            </div>
                        )}

                        {createUnder === row._id ? (
                            <div className="border-b bg-neutral-50/60 py-2 pr-3" style={indent}>
                                <InlineCreateTaskRow
                                    projectId={projectId}
                                    workType={defaultWorkType}
                                    workTypeOptions={childWorkTypeOptions}
                                    fields={["workType", "summary", "dueDate", "assignee"]}
                                    statusOptions={optionLists.status}
                                    importanceOptions={optionLists.importance}
                                    extraVariables={{ parentId: row._id }}
                                    fitContent
                                    onClose={() => setCreateUnder(null)}
                                    onCreated={() => handleChildCreated(row._id)}
                                />
                            </div>
                        ) : (
                            <div className="border-b bg-neutral-50/60 py-1.5" style={indent}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-neutral-500"
                                    onClick={() => setCreateUnder(row._id)}
                                >
                                    <Plus size={13} className="mr-1" />
                                    Add child item
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Fragment>
        );
    };

    return (
        <div className="flex h-full min-h-0">
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex-none border-b border-neutral-200 px-6 py-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-neutral-800">
                                List
                            </h1>
                            {totalCount > 0 && (
                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                                    {rows.length} of {totalCount}
                                </span>
                            )}
                            {isFetching && <Loader2 size={14} className="animate-spin text-neutral-400" />}
                        </div>

                        <div className="flex items-center gap-2">
                            {openRows.size > 0 && (
                                <Button size="sm" variant="advanceMuted" className="h-9 px-3 text-xs" onClick={collapseAll}>
                                    <ChevronsDownUp size={14} className="mr-1" />
                                    Collapse all
                                </Button>
                            )}
                            <Button size="sm" variant="teritary" className="h-9 px-3 text-sm" onClick={() => setIsCreateOpen(true)}>
                                <Plus size={15} className="mr-1" />
                                Create
                            </Button>
                        </div>
                    </div>

                    <ListToolbar filters={toolbarFilters} columns={columnsState} />

                    {isCreateOpen && (
                        // One bar for everything a new item needs: the type on
                        // the left, the name in the middle, the due date and the
                        // person on the right. Status and priority take the
                        // project's first option and can be changed in the row
                        // once it exists.
                        //
                        // It sits here, above the table, rather than inside it:
                        // the table scrolls sideways, and a bar placed in there
                        // would slide out of view as soon as the user looked at
                        // a column on the right.
                        <div className="mt-3">
                            <InlineCreateTaskRow
                                projectId={projectId}
                                workType={defaultWorkType}
                                workTypeOptions={optionLists.workType}
                                fields={["workType", "summary", "dueDate", "assignee"]}
                                statusOptions={optionLists.status}
                                importanceOptions={optionLists.importance}
                                fitContent
                                onClose={() => setIsCreateOpen(false)}
                                onCreated={reload}
                            />
                        </div>
                    )}
                </div>

                {/* The table scrolls in both directions inside this box, so the
                    page header and the toolbar stay put while a wide set of
                    columns is read sideways. */}
                <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
                    <div className="w-max min-w-full">
                        <div className="sticky top-0 z-10 flex h-10 w-max min-w-full items-center border-b bg-neutral-50">
                            <div style={{ width: EXPANDER_WIDTH, minWidth: EXPANDER_WIDTH }} className="shrink-0" />
                            {columns.map((column) => (
                                <button
                                    key={column.id}
                                    type="button"
                                    onClick={() => handleSort(column)}
                                    disabled={!column.sortKey}
                                    style={{ width: column.width, minWidth: column.width }}
                                    className={`flex shrink-0 items-center gap-1 px-2 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500 ${
                                        column.sortKey ? 'hover:text-neutral-700' : 'cursor-default'
                                    }`}
                                >
                                    <span className="truncate">{column.label}</span>
                                    {sort.by === column.sortKey && (
                                        <span className="text-neutral-400">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </button>
                            ))}
                            <div style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH }} className="shrink-0" />
                        </div>

                        {showInitialSkeleton && (
                            <div>
                                {[...Array(6)].map((_, index) => (
                                    <IssueRowSkeleton key={`list-skeleton-${index}`} />
                                ))}
                            </div>
                        )}

                        {isEmpty && (
                            <div className="flex flex-col items-center justify-center gap-3 py-20">
                                <ClipboardList size={40} className="text-neutral-300" />
                                <p className="max-w-sm text-center text-sm text-neutral-600">
                                    {filters.activeCount > 0
                                        ? 'No work item matches the filters in use. Try removing one of them.'
                                        : 'Nothing here yet. Create an epic to group work, or a work item to get started.'}
                                </p>
                            </div>
                        )}

                        {rows.map((row) => renderRow(row, 0))}

                        <div ref={sentinelRef} className="h-1" />

                        {isFetching && rows.length > 0 && (
                            <div className="flex items-center justify-center gap-2 py-3 text-xs text-neutral-500">
                                <Loader2 size={14} className="animate-spin" />
                                Loading more work items
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {issueId && (
                <div className="fixed inset-0 z-[60] h-full w-full bg-white shadow-xl lg:static lg:z-auto lg:h-auto lg:w-[460px] lg:shrink-0 lg:border-l lg:shadow-none">
                    <EditIssue issue={true} />
                </div>
            )}

            {flagTarget && (
                <AddFlag
                    isOpen={isFlagOpen}
                    setIsOpen={(open) => {
                        setIsFlagOpen(open);
                        if (!open) setFlagTarget(null);
                    }}
                    taskInfo={{
                        _id: flagTarget._id,
                        workType: flagTarget.work_type,
                        project_key: flagTarget.project_key,
                        taskNumber: flagTarget.taskNumber,
                        summary: flagTarget.summary
                    }}
                    isFlagged={true}
                    onFlagged={() => {
                        patchRow(flagTarget._id, { isFlagged: true });
                        patchChild(flagTarget._id, { isFlagged: true });
                        setIsFlagOpen(false);
                        setFlagTarget(null);
                    }}
                />
            )}

            <DeleteTaskDialog
                isOpen={Boolean(deleteTarget)}
                setIsOpen={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                taskInfo={{
                    _id: deleteTarget?._id,
                    project_key: deleteTarget?.project_key,
                    taskNumber: deleteTarget?.taskNumber,
                    summary: deleteTarget?.summary,
                    work_type: deleteTarget?.work_type
                }}
                onConfirm={handleDelete}
                isLoading={deleteLoading}
            />
        </div>
    );
};

export default ListView;
