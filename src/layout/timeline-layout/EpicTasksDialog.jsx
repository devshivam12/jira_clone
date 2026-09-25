import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertCircle, Flag, Loader2, MoreHorizontal, Pencil, Plus, Search, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import AddFlag from "@/components/common/AddFlag";
import CommonDropdownMenu from "@/components/common/CommonDropdownMenu";
import DeleteTaskDialog from "@/components/common/DeleteTaskDialog";
import DynamicDropdownSelector from "@/components/common/DynamicDropdownSelector";
import ManageAvatar from "@/components/common/ManageAvatar";
import ShowToast from "@/components/common/ShowToast";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import WorkSelector from "@/components/common/WorkSelector";
import { cn } from "@/lib/utils";
import { useDeleteTaskMutation, useUpdateIssueMutation } from "@/redux/graphql_api/task";
import { timelineApi } from "@/redux/graphql_api/timeline";
import { getEpicTheme, getStatusColorProps } from "./epicColors";
import { formatTaskDateRange, getEpicProgress } from "./timelineDate";

// Matches MAX_CHILD_LIMIT on the server, so the dialog fills itself in as few
// round trips as the API allows. The chart's inline expansion asks for 25 at a
// time because it only has to fill a few rows under a bar; this list is the
// whole epic, so it asks for the largest page the server will give.
const PAGE_SIZE = 100;

// The dialog exists to show the whole epic, so pages keep arriving on their
// own rather than waiting for the reader to scroll. Without a cap an epic with
// thousands of tasks would fire a long chain of requests the moment it opened,
// so past this many rows the rest is pulled by hand instead. Real epics sit
// far below it, which is what makes the search box trustworthy: it is filtering
// the epic, not just the part that happens to be loaded.
const AUTO_LOAD_LIMIT = 500;

// A little taller than the read-only list was: the row now carries editable
// controls rather than plain text, and they need the room.
const ROW_HEIGHT = 56;

const ALL_STATUSES = "__all__";

// The member dropdown gives first_name / last_name, while a task that already
// has an owner comes back from the timeline API as one `name`. The rows read
// the second shape, so a freshly picked member is rewritten into it before it
// goes into the list.
const memberToDetail = (member) => {
  if (!member?._id) return null;
  const joined = [member.first_name, member.last_name].filter(Boolean).join(" ");
  return {
    _id: member._id,
    name: joined || member.name || "",
    image: member.image || null,
  };
};

// The server answers with an ordinary reply carrying a status, rather than a
// thrown error, for the edits it refuses on its own terms. So a request that
// came back fine still has to be read before the row is left changed.
const isRejected = (response) => {
  if (!response) return false;
  if (response.status === false) return true;
  return typeof response.status === "number" && response.status >= 400;
};

// Every task under one epic, pulled a page at a time.
//
// The request goes out with `subscribe: false` and the endpoint keeps nothing
// (keepUnusedDataFor: 0), so the only copy of the list is the one held here and
// closing the dialog drops it. Opening twenty epics in a row does not leave
// twenty task lists sitting in the store.
function useEpicTaskList(epicId) {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    tasks: [],
    hasMore: false,
    totalCount: 0,
    loading: true,
    failed: false,
  });

  // A request can still be in flight when the dialog is closed or reopened on
  // another epic. Every load takes a ticket, and a response whose ticket is no
  // longer the current one is thrown away instead of writing another epic's
  // tasks into this list.
  const runRef = useRef(0);

  // Read inside callbacks that would otherwise close over a stale copy.
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async (offset) => {
    const run = ++runRef.current;
    setState((prev) => ({ ...prev, loading: true, failed: false }));

    try {
      const result = await dispatch(
        timelineApi.endpoints.getEpicChildren.initiate(
          {
            operationName: "getEpicChildren",
            variables: { epicId, limit: PAGE_SIZE, offset },
          },
          { subscribe: false, forceRefetch: true }
        )
      ).unwrap();

      if (run !== runRef.current) return;

      const payload = result?.data?.getEpicChildren;
      const incoming = payload?.children || [];

      setState((prev) => {
        // Guards against a page arriving twice (a retry, a double click on
        // "load more") putting the same task in the list twice.
        const seen = new Set(prev.tasks.map((t) => t._id));
        const tasks =
          offset === 0
            ? incoming
            : [...prev.tasks, ...incoming.filter((t) => !seen.has(t._id))];

        return {
          tasks,
          // A later page that adds nothing new ends the list whatever the
          // server said. Pages keep pulling themselves in below, so a hasMore
          // that never turns false would be a request loop rather than one
          // wasted round trip.
          hasMore: !!payload?.hasMore && (offset === 0 || tasks.length > prev.tasks.length),
          // Counted on the first page only; later pages come back with null,
          // so the header must not blank out mid-load.
          totalCount: payload?.totalCount ?? prev.totalCount,
          loading: false,
          failed: false,
        };
      });
    } catch {
      if (run !== runRef.current) return;
      setState((prev) => ({ ...prev, loading: false, failed: true }));
    }
  }, [dispatch, epicId]);

  useEffect(() => {
    setState({ tasks: [], hasMore: false, totalCount: 0, loading: true, failed: false });
    load(0);
  }, [load]);

  // Anything still in flight when the dialog closes belongs to nobody.
  useEffect(() => () => { runRef.current++; }, []);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    if (current.loading || !current.hasMore) return;
    load(current.tasks.length);
  }, [load]);

  const retry = useCallback(() => {
    load(stateRef.current.tasks.length);
  }, [load]);

  // Back to the first page. Used after a task is added here, so the new item
  // shows up in the list without closing and reopening the dialog. The pages
  // that follow are pulled again by the auto-load below.
  const reload = useCallback(() => {
    load(0);
  }, [load]);

  // An edit made on a row is written straight into this list. There is no RTK
  // cache entry behind it for a mutation to patch - the endpoint drops its
  // response as soon as it has been copied here - so the row has to be changed
  // on the spot and put back by hand when the server refuses.
  const patchTask = useCallback((taskId, changes) => {
    if (!changes) return;
    setState((prev) => {
      const index = prev.tasks.findIndex((t) => t._id === taskId);
      if (index === -1) return prev;
      const tasks = prev.tasks.slice();
      tasks[index] = { ...tasks[index], ...changes };
      return { ...prev, tasks };
    });
  }, []);

  // Used when a task stops belonging to this epic: it was deleted, or it was
  // given a different parent.
  const dropTask = useCallback((taskId) => {
    setState((prev) => {
      if (!prev.tasks.some((t) => t._id === taskId)) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t._id !== taskId),
        totalCount: prev.totalCount ? prev.totalCount - 1 : prev.totalCount,
      };
    });
  }, []);

  return { ...state, loadMore, retry, reload, patchTask, dropTask };
}

// A cell that reads as plain text until it is clicked, and only then mounts a
// real Radix select. Every visible row carries two of these, so mounting the
// selects up front would put roughly thirty select roots on the page for the
// sake of the one dropdown a reader actually opens.
const InlineSelectCell = React.memo(function InlineSelectCell({
  value,
  options,
  title,
  onChange,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((e) => {
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((next) => {
    if (!next) setIsOpen(false);
  }, []);

  const handleChange = useCallback((next) => {
    setIsOpen(false);
    onChange(next);
  }, [onChange]);

  if (!isOpen) {
    return (
      <span
        role="button"
        tabIndex={0}
        title={title}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open(e);
          }
        }}
        className="block w-full cursor-pointer rounded-md py-1 text-left outline-none ring-blue-300 transition-shadow hover:ring-1 focus-visible:ring-2"
      >
        {children}
      </span>
    );
  }

  return (
    <WorkSelector
      value={value}
      workTypes={options}
      defaultOpen
      onOpenChange={handleOpenChange}
      onChange={handleChange}
    />
  );
});

// The owner of a task, changed from the same member list the backlog rows use.
// Kept closed until it is clicked for the same reason as the cell above.
const AssigneeCell = React.memo(function AssigneeCell({ assignee, projectId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const [firstName, lastName] = useMemo(
    () => (assignee?.name || "").split(" "),
    [assignee?.name]
  );

  const label = assignee?.name || "Unassigned";

  const avatar = assignee?._id ? (
    <ManageAvatar
      firstName={firstName}
      lastName={lastName}
      image={assignee.image}
      size="xs"
      showTooltip={false}
    />
  ) : (
    <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-neutral-300" />
  );

  if (!isOpen) {
    return (
      <TooltipWrapper content={`${label} — click to change`}>
        <button
          type="button"
          aria-label={`Assignee: ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="grid place-items-center rounded-full"
        >
          {avatar}
        </button>
      </TooltipWrapper>
    );
  }

  return (
    <DropdownMenu open onOpenChange={(next) => { if (!next) setIsOpen(false); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Assignee: ${label}`}
          className="grid place-items-center rounded-full"
        >
          {avatar}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 p-0"
        align="end"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
      >
        <DynamicDropdownSelector
          slug="member"
          projectId={projectId}
          label="Select assignee"
          showDropdown
          onChange={(member) => {
            setIsOpen(false);
            onChange(member || null);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// The summary while it is being typed. Its own component so the draft lives
// here rather than in the dialog, where every keystroke would re-render each
// row on screen. Enter and clicking away keep it, Escape throws it away.
const SummaryEditor = React.memo(function SummaryEditor({ task, onCommit, onCancel }) {
  const [draft, setDraft] = useState(task.summary || "");
  // Escape cancels and then takes the field away, which in some browsers also
  // fires a blur on the way out. Whichever of the two arrives first is the one
  // that counts.
  const settledRef = useRef(false);

  const commit = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    onCommit(task, draft.trim());
  }, [draft, onCommit, task]);

  const cancel = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    onCancel();
  }, [onCancel]);

  return (
    <Input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          // The dialog is told to stay open for this one (see the
          // onEscapeKeyDown handler below), so Escape only leaves the field.
          e.preventDefault();
          cancel();
        }
      }}
      className="h-8 w-full text-[13px]"
    />
  );
});

// The row's "more actions" menu. Nothing but the button exists until it is
// clicked, so a screenful of rows does not carry a screenful of menus.
const RowActions = React.memo(function RowActions({ task, buildItems }) {
  const [isMounted, setIsMounted] = useState(false);

  if (!isMounted) {
    return (
      <TooltipWrapper content="More actions">
        <button
          type="button"
          aria-label="More actions"
          onClick={(e) => {
            e.stopPropagation();
            setIsMounted(true);
          }}
          className="grid h-8 w-8 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <MoreHorizontal size={15} />
        </button>
      </TooltipWrapper>
    );
  }

  return (
    <CommonDropdownMenu
      items={buildItems(task)}
      defaultOpen
      sideOffset={6}
      onOpenChange={(open) => {
        if (!open) setIsMounted(false);
      }}
    />
  );
});

// One task line. Memoized because the virtualizer hands back a fresh list of
// items on every scroll frame while each row that stays on screen keeps its
// own props, so only rows that really mount or change re-render.
//
// Everything the backlog list lets you change on a row can be changed here
// too: the name, the status, the priority, the owner, the flag and the rest of
// the row menu. Clicking anywhere else on the row still opens the full editor,
// so the controls that must not do both carry `data-no-row-click`.
const TaskRow = React.memo(function TaskRow({
  task,
  top,
  status,
  workTypeMeta,
  importanceMeta,
  statusOptions,
  importanceOptions,
  projectId,
  isEditingSummary,
  onOpenTask,
  onStartSummaryEdit,
  onCommitSummary,
  onCancelSummary,
  onStatusChange,
  onImportanceChange,
  onAssigneeChange,
  buildMenuItems,
}) {
  const taskKey =
    task.project_key && task.taskNumber ? `${task.project_key}-${task.taskNumber}` : null;
  const dateLabel = useMemo(
    () => formatTaskDateRange(task.startDate, task.dueDate),
    [task.startDate, task.dueDate]
  );
  const statusDot = getStatusColorProps(status?.color);
  const importanceDot = getStatusColorProps(importanceMeta?.color);
  const isDone = !!status?.isDone;

  const handleRowClick = useCallback((e) => {
    // A click that landed on one of the row's own controls has already been
    // dealt with by that control.
    if (e.target.closest("[data-no-row-click]")) return;
    onOpenTask(task._id);
  }, [onOpenTask, task._id]);

  const handleRowKeyDown = useCallback((e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenTask(task._id);
    }
  }, [onOpenTask, task._id]);

  const handleStatusChange = useCallback(
    (next) => onStatusChange(task, next),
    [onStatusChange, task]
  );
  const handleImportanceChange = useCallback(
    (next) => onImportanceChange(task, next),
    [onImportanceChange, task]
  );
  const handleAssigneeChange = useCallback(
    (member) => onAssigneeChange(task, member),
    [onAssigneeChange, task]
  );
  const handleStartSummaryEdit = useCallback((e) => {
    e.stopPropagation();
    onStartSummaryEdit(task._id);
  }, [onStartSummaryEdit, task._id]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={cn(
        "group absolute left-0 flex w-full cursor-pointer items-center gap-2.5 border-b border-neutral-100 px-5 text-left transition-colors",
        task.isFlagged ? "bg-rose-50/50 hover:bg-rose-50" : "hover:bg-blue-50/60"
      )}
      style={{ height: ROW_HEIGHT, top }}
    >
      {workTypeMeta?.icon ? (
        <TooltipWrapper content={workTypeMeta.name}>
          <span
            className={cn(
              "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md",
              workTypeMeta.color || "bg-neutral-300"
            )}
          >
            <img
              src={workTypeMeta.icon}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-2.5 w-2.5 brightness-0 invert filter"
            />
          </span>
        </TooltipWrapper>
      ) : (
        <span className="h-[18px] w-[18px] shrink-0 rounded-md bg-neutral-200" />
      )}

      <span className="w-[72px] shrink-0 truncate text-[11px] font-bold tracking-wide text-neutral-400">
        {taskKey || "—"}
      </span>

      {isEditingSummary ? (
        <span className="flex min-w-0 flex-1 items-center" data-no-row-click>
          <SummaryEditor task={task} onCommit={onCommitSummary} onCancel={onCancelSummary} />
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <TooltipWrapper content={task.summary}>
            <span
              className={cn(
                "min-w-0 truncate text-[13px] font-medium",
                isDone ? "text-neutral-400 line-through" : "text-neutral-800"
              )}
            >
              {task.summary}
            </span>
          </TooltipWrapper>
          {task.isFlagged && (
            <Flag size={11} className="shrink-0 text-rose-500" fill="currentColor" />
          )}
          <span data-no-row-click className="shrink-0">
            <TooltipWrapper content="Rename this task">
              <button
                type="button"
                aria-label="Rename this task"
                onClick={handleStartSummaryEdit}
                className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 focus:opacity-100 group-hover:opacity-100"
              >
                <Pencil size={12} />
              </button>
            </TooltipWrapper>
          </span>
        </span>
      )}

      <span className="hidden w-[132px] shrink-0 sm:block" data-no-row-click>
        <InlineSelectCell
          value={task.task_status}
          options={statusOptions}
          title="Click to change the status"
          onChange={handleStatusChange}
        >
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-neutral-50 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-wide text-neutral-600 ring-1 ring-neutral-200">
            <span
              style={statusDot.style}
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot.className)}
            />
            <span className="truncate">{status?.name || "No status"}</span>
          </span>
        </InlineSelectCell>
      </span>

      <span className="hidden w-[124px] shrink-0 md:block" data-no-row-click>
        <InlineSelectCell
          value={task.importance}
          options={importanceOptions}
          title="Click to change the priority"
          onChange={handleImportanceChange}
        >
          {importanceMeta ? (
            <span className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-medium text-neutral-500">
              <span
                style={importanceDot.style}
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", importanceDot.className)}
              />
              <span className="truncate">{importanceMeta.name}</span>
            </span>
          ) : (
            <span className="text-[11px] text-neutral-300">No priority</span>
          )}
        </InlineSelectCell>
      </span>

      <span
        className={cn(
          "hidden w-[104px] shrink-0 truncate text-right text-[11px] lg:block",
          dateLabel ? "text-neutral-500" : "italic text-neutral-300"
        )}
      >
        {dateLabel || "No dates"}
      </span>

      <span className="grid w-8 shrink-0 place-items-center" data-no-row-click>
        <AssigneeCell
          assignee={task.assigneeDetail}
          projectId={projectId}
          onChange={handleAssigneeChange}
        />
      </span>

      <span className="grid w-8 shrink-0 place-items-center" data-no-row-click>
        <RowActions task={task} buildItems={buildMenuItems} />
      </span>
    </div>
  );
});

// The full task list of one epic, in a modal.
//
// The chart's inline expansion is deliberately small: a handful of rows in a
// 288px label column, paged 25 at a time, so opening a roadmap stays cheap.
// This is the other half of that trade. It is opened on purpose, it pulls the
// whole epic, and it has room for the fields the row could not fit - status,
// priority, dates and owner side by side - plus a search box and a status
// filter over them. Those fields are edited in place, the way the backlog list
// edits them, so reading through an epic and fixing it are the same visit.
const EpicTasksDialog = ({
  epic,
  workFlow,
  statusBySlug,
  workTypeBySlug,
  importanceBySlug,
  projectId,
  statusOptions,
  importanceOptions,
  onOpenTask,
  onCreated,
  onTaskChanged,
  onClose,
}) => {
  const {
    tasks,
    hasMore,
    totalCount,
    loading,
    failed,
    loadMore,
    retry,
    reload,
    patchTask,
    dropTask,
  } = useEpicTaskList(epic._id);

  const [updateIssue] = useUpdateIssueMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSummaryId, setEditingSummaryId] = useState(null);
  const [flagTarget, setFlagTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // The epic's own rollup is counted by the server over the whole epic, so it
  // cannot see a status changed on a row here until the chart refetches. This
  // is how many finished tasks the edits made in this dialog have added or
  // taken away, so the bar in the header moves with the list under it.
  const [doneDelta, setDoneDelta] = useState(0);

  const scrollRef = useRef(null);

  // Read from the Escape handler, which is registered once and would otherwise
  // close over the state as it was on the first render.
  const editingSummaryRef = useRef(null);
  editingSummaryRef.current = editingSummaryId;

  // The chart keeps its own copy of these tasks under the expanded bar, and
  // the epic's done/total comes from the server, so both go stale as soon as
  // something is edited here. Telling the chart on every change would mean a
  // round trip per dropdown, so it is told once, as the dialog closes.
  const dirtyRef = useRef(false);

  const theme = getEpicTheme(epic.color);
  const epicKey =
    epic.project_key && epic.taskNumber ? `${epic.project_key}-${epic.taskNumber}` : null;
  const { total, done } = getEpicProgress(epic);
  const shownDone = Math.min(Math.max(done + doneDelta, 0), total);
  const workPct = total > 0 ? Math.round((shownDone / total) * 100) : 0;

  // The rest of the epic is pulled without being asked for, so the list the
  // search box filters is the whole epic rather than the first page of it.
  // Stops at the cap, where the footer takes over.
  useEffect(() => {
    if (loading || failed || !hasMore) return;
    if (tasks.length >= AUTO_LOAD_LIMIT) return;
    loadMore();
  }, [loading, failed, hasMore, tasks.length, loadMore]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term && statusFilter === ALL_STATUSES) return tasks;

    return tasks.filter((task) => {
      if (statusFilter !== ALL_STATUSES && task.task_status !== statusFilter) return false;
      if (!term) return true;
      const taskKey =
        task.project_key && task.taskNumber
          ? `${task.project_key}-${task.taskNumber}`.toLowerCase()
          : "";
      return (
        (task.summary || "").toLowerCase().includes(term) || taskKey.includes(term)
      );
    });
  }, [tasks, search, statusFilter]);

  // How many of the loaded tasks are finished. The epic's own doneChildren
  // counts the whole epic, which is the right number for the progress bar in
  // the header, but not for a filtered list.
  const doneInView = useMemo(
    () => filtered.filter((task) => statusBySlug.get(task.task_status)?.isDone).length,
    [filtered, statusBySlug]
  );

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => filtered[index]?._id ?? index,
    overscan: 8,
  });

  const closeDialog = useCallback(() => {
    if (dirtyRef.current) {
      dirtyRef.current = false;
      onTaskChanged?.();
    }
    onClose();
  }, [onTaskChanged, onClose]);

  const handleOpenChange = useCallback((open) => {
    if (!open) closeDialog();
  }, [closeDialog]);

  // Escape belongs to whatever is being typed before it belongs to the dialog,
  // so a rename someone changed their mind about does not take the whole list
  // off the screen with it.
  const handleEscapeKeyDown = useCallback((event) => {
    if (editingSummaryRef.current) event.preventDefault();
  }, []);

  // The task editor opens in the panel beside the chart, which this dialog
  // would be sitting on top of, so picking a task closes the list.
  const handleOpenTask = useCallback((taskId) => {
    onOpenTask?.(taskId);
    closeDialog();
  }, [onOpenTask, closeDialog]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter(ALL_STATUSES);
  }, []);

  // One field at a time, which is what the updateTask mutation takes. The row
  // is changed before the request goes out and put back if it fails, because
  // this list is its own copy and nothing else will correct it.
  const applyEdit = useCallback(async (task, key, value, options = {}) => {
    const { fullDetail, optimistic, rollback } = options;
    patchTask(task._id, optimistic);
    dirtyRef.current = true;

    try {
      const result = await updateIssue({
        operationName: "updateTask",
        variables: {
          taskId: task._id,
          key,
          value,
          ...(fullDetail !== undefined && { fullDetail }),
        },
      }).unwrap();

      if (isRejected(result?.data?.updateTask)) {
        patchTask(task._id, rollback);
        ShowToast.error(result?.data?.updateTask?.message || "Could not save that change");
        return false;
      }
      return true;
    } catch (error) {
      patchTask(task._id, rollback);
      ShowToast.error(error?.message || "Could not save that change");
      return false;
    }
  }, [patchTask, updateIssue]);

  const handleStatusChange = useCallback((task, next) => {
    if (!next || next === task.task_status) return;

    const wasDone = !!statusBySlug.get(task.task_status)?.isDone;
    const isDone = !!statusBySlug.get(next)?.isDone;
    const delta = Number(isDone) - Number(wasDone);
    if (delta) setDoneDelta((prev) => prev + delta);

    applyEdit(task, "task_status", next, {
      optimistic: { task_status: next },
      rollback: { task_status: task.task_status },
    }).then((ok) => {
      if (!ok && delta) setDoneDelta((prev) => prev - delta);
    });
  }, [applyEdit, statusBySlug]);

  const handleImportanceChange = useCallback((task, next) => {
    if (!next || next === task.importance) return;
    applyEdit(task, "importance", next, {
      optimistic: { importance: next },
      rollback: { importance: task.importance },
    });
  }, [applyEdit]);

  const handleAssigneeChange = useCallback((task, member) => {
    const nextId = member?._id || null;
    if (nextId === (task.assigneeDetail?._id || null)) return;

    applyEdit(task, "assigneeId", nextId, {
      fullDetail: member || null,
      optimistic: { assigneeId: nextId, assigneeDetail: memberToDetail(member) },
      rollback: {
        assigneeId: task.assigneeId ?? task.assigneeDetail?._id ?? null,
        assigneeDetail: task.assigneeDetail ?? null,
      },
    });
  }, [applyEdit]);

  const startSummaryEdit = useCallback((taskId) => setEditingSummaryId(taskId), []);
  const cancelSummaryEdit = useCallback(() => setEditingSummaryId(null), []);

  const commitSummary = useCallback((task, value) => {
    setEditingSummaryId(null);
    // An empty name is not a rename, it is a mistake, so the old one stands.
    if (!value || value === task.summary) return;
    applyEdit(task, "summary", value, {
      optimistic: { summary: value },
      rollback: { summary: task.summary },
    });
  }, [applyEdit]);

  // Giving a task a different parent takes it out of this epic, so the row
  // goes with it rather than sitting in a list it no longer belongs to.
  const handleParentChange = useCallback(async (task, parent) => {
    if (!parent?._id || parent._id === task.parentId) return;
    const ok = await applyEdit(task, "parentId", parent._id, {
      fullDetail: parent,
      optimistic: { parentId: parent._id, parentDetail: parent },
      rollback: { parentId: task.parentId ?? null, parentDetail: task.parentDetail ?? null },
    });
    if (ok && parent._id !== epic._id) {
      dropTask(task._id);
      ShowToast.success(`Moved to ${parent.summary || "another parent"}`);
    }
  }, [applyEdit, dropTask, epic._id]);

  const removeFlag = useCallback((task) => {
    applyEdit(task, "isFlagged", "false", {
      optimistic: { isFlagged: false },
      rollback: { isFlagged: true },
    });
  }, [applyEdit]);

  // AddFlag asks for a reason and runs the flag mutation itself, so the row is
  // only changed once it reports back.
  const handleFlagged = useCallback((taskId) => {
    dirtyRef.current = true;
    patchTask(taskId, { isFlagged: true });
    setFlagTarget(null);
  }, [patchTask]);

  const handleDelete = useCallback(async (reason) => {
    const task = deleteTarget;
    if (!task) return;
    try {
      const result = await deleteTask({
        operationName: "deleteTask",
        variables: { taskId: task._id, reason },
      }).unwrap();

      if (result?.data?.deleteTask?.status === 200) {
        dirtyRef.current = true;
        dropTask(task._id);
        setDeleteTarget(null);
        ShowToast.success("Task moved to archive");
      } else {
        ShowToast.error(result?.data?.deleteTask?.message || "Could not delete the task");
      }
    } catch (error) {
      ShowToast.error(error?.message || "Could not delete the task");
    }
  }, [deleteTarget, deleteTask, dropTask]);

  const copyToClipboard = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      ShowToast.info(message);
    } catch {
      ShowToast.warning("Could not copy that to the clipboard");
    }
  }, []);

  // The same actions the backlog row offers, minus the ones that only mean
  // something in a sprint list.
  const buildMenuItems = useCallback((task) => {
    const taskIdentifier = `${task.project_key}-${task.taskNumber}`;
    return [
      {
        id: "open",
        label: "Open in the task editor",
        onSelect: () => handleOpenTask(task._id),
      },
      {
        id: "rename",
        label: "Rename",
        onSelect: () => startSummaryEdit(task._id),
      },
      { type: "separator" },
      {
        id: "copy-link",
        label: "Copy link",
        onSelect: () =>
          copyToClipboard(
            `${window.location.origin}/${taskIdentifier}/${task._id}`,
            `Link to ${taskIdentifier} copied to your clipboard`
          ),
      },
      {
        id: "copy-key",
        label: "Copy key",
        onSelect: () => copyToClipboard(taskIdentifier, "Key copied to your clipboard"),
      },
      { type: "separator" },
      {
        id: task.isFlagged ? "remove-flag" : "add-flag",
        label: task.isFlagged ? "Remove flag" : "Add flag",
        onSelect: () => {
          if (task.isFlagged) {
            removeFlag(task);
            return;
          }
          setFlagTarget({
            _id: task._id,
            workType: task.work_type,
            project_key: task.project_key,
            taskNumber: task.taskNumber,
            summary: task.summary,
          });
        },
      },
      {
        id: "parent",
        type: "submenu",
        label: "Change parent",
        content: (
          <DynamicDropdownSelector
            slug="parent"
            label="Select parent"
            showDropdown
            onChange={(parent, { onClose: closeMenu } = {}) => {
              handleParentChange(task, parent);
              closeMenu?.();
            }}
          />
        ),
      },
      { type: "separator" },
      {
        id: "delete",
        label: "Delete",
        danger: true,
        onSelect: () => setDeleteTarget(task),
      },
    ];
  }, [copyToClipboard, handleOpenTask, handleParentChange, removeFlag, startSummaryEdit]);

  // Adding a task needs a project to put it in, so the button is only offered
  // when the chart passed one down.
  const canCreate = !!projectId;

  // A new task starts on the epic's own dates, exactly like the "+" on the
  // chart row, so it lands on the timeline instead of sitting date-less at the
  // far left. The server can echo these back as timestamps, so they are
  // normalised before being sent again.
  const createDefaults = useMemo(() => {
    const defaults = { parentId: epic._id };
    if (epic.startDate) defaults.startDate = new Date(epic.startDate).toISOString();
    if (epic.dueDate) defaults.dueDate = new Date(epic.dueDate).toISOString();
    return defaults;
  }, [epic._id, epic.startDate, epic.dueDate]);

  const openCreate = useCallback(() => setShowCreate(true), []);
  const closeCreate = useCallback(() => setShowCreate(false), []);

  // The list here is this dialog's own copy, and the epic's rollup in the
  // header comes from the chart, so both are told about the new task.
  const handleCreated = useCallback(() => {
    setShowCreate(false);
    reload();
    onCreated?.();
  }, [reload, onCreated]);

  const isFirstLoad = loading && tasks.length === 0;
  const isFiltering = search.trim() !== "" || statusFilter !== ALL_STATUSES;
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={handleEscapeKeyDown}
        className="flex max-h-[85vh] w-[min(94vw,980px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <div className="shrink-0 border-b border-neutral-200 px-5 pb-4 pt-5 pr-14">
          <div className="flex items-center gap-2">
            <span className={cn("h-4 w-1 shrink-0 rounded-full", theme.bar)} />
            {epicKey && (
              <span className="text-[11px] font-bold tracking-wide text-neutral-400">
                {epicKey}
              </span>
            )}
            <span className="rounded-full bg-neutral-100 px-2 py-px text-[9px] font-bold uppercase tracking-wide text-neutral-500">
              Epic
            </span>
          </div>

          <DialogTitle className="mt-1.5 truncate text-[17px] font-bold text-neutral-900">
            {epic.summary}
          </DialogTitle>

          <DialogDescription className="sr-only">
            Every task that belongs to this epic, with its status, priority, dates and owner.
            The name, status, priority and owner can be changed on the row itself.
          </DialogDescription>

          {/* The epic's own rollup, counted by the server over all of its
              tasks, so it stays right whether or not every page is loaded and
              whatever the filters below are set to. Edits made on a row move
              it too, until the chart refetches and the server counts again. */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn("h-full rounded-full transition-[width]", theme.bar)}
                style={{ width: `${workPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-neutral-500">
              {shownDone} of {total} done
              <span className="ml-1.5 text-neutral-400">({workPct}%)</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50/60 px-5 py-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
              className="h-9 w-[220px] rounded-lg bg-white pl-8 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] rounded-lg bg-white text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              {(workFlow || []).map((step) => (
                <SelectItem key={step.slug} value={step.slug}>
                  {step.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-800"
            >
              <X size={13} /> Clear
            </button>
          )}

          <span className="ml-auto text-[11.5px] font-medium text-neutral-500">
            {isFiltering
              ? `${filtered.length} of ${tasks.length} shown`
              : `${tasks.length}${totalCount ? ` of ${totalCount}` : ""} tasks`}
            {filtered.length > 0 && (
              <span className="ml-1.5 text-neutral-400">· {doneInView} done</span>
            )}
          </span>

          {/* Same action as the "+" on the epic's row in the chart, put where
              someone reading the epic's whole list is already looking. */}
          {canCreate && (
            <TooltipWrapper content="Add a task to this epic">
              <button
                type="button"
                onClick={openCreate}
                aria-label="Add a task to this epic"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-[12px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add task</span>
              </button>
            </TooltipWrapper>
          )}
        </div>

        {/* The same create row the chart uses, so a task added from here gets
            the same fields and the same defaults as one added from a row. */}
        {showCreate && canCreate && (
          <div className="shrink-0 border-b border-neutral-200 bg-white">
            <InlineCreateTaskRow
              projectId={projectId}
              workType="task"
              statusOptions={statusOptions}
              importanceOptions={importanceOptions}
              extraVariables={createDefaults}
              onClose={closeCreate}
              onCreated={handleCreated}
            />
          </div>
        )}

        {/* Column headings for the list below. Hidden on the widths where the
            columns themselves are dropped, so a heading never sits above an
            empty strip. */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-neutral-200 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <span className="w-[18px] shrink-0" />
          <span className="w-[72px] shrink-0">Key</span>
          <span className="min-w-0 flex-1">Task</span>
          <span className="hidden w-[132px] shrink-0 sm:block">Status</span>
          <span className="hidden w-[124px] shrink-0 md:block">Priority</span>
          <span className="hidden w-[104px] shrink-0 text-right lg:block">Dates</span>
          <span className="w-8 shrink-0" />
          <span className="w-8 shrink-0" />
        </div>

        <div
          ref={scrollRef}
          className="min-h-[220px] flex-1 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:hover:bg-neutral-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2.5"
        >
          {isFirstLoad ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-[12px] font-medium">Loading tasks…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-[13px] font-semibold text-neutral-600">
                {isFiltering ? "No tasks match these filters" : "This epic has no tasks yet"}
              </p>
              <p className="max-w-[380px] text-[12px] text-neutral-400">
                {isFiltering
                  ? "Try a different search term, or clear the filters to see the whole epic."
                  : "Add the first one with the button above, and it will show up here."}
              </p>
              {isFiltering ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  Clear filters
                </button>
              ) : canCreate && !showCreate ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus size={14} /> Add task
                </button>
              ) : null}
            </div>
          ) : (
            <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
              {virtualItems.map((virtualRow) => {
                const task = filtered[virtualRow.index];
                if (!task) return null;
                return (
                  <TaskRow
                    key={virtualRow.key}
                    task={task}
                    top={virtualRow.start}
                    status={statusBySlug.get(task.task_status)}
                    workTypeMeta={workTypeBySlug.get(task.work_type)}
                    importanceMeta={importanceBySlug.get(task.importance)}
                    statusOptions={statusOptions}
                    importanceOptions={importanceOptions}
                    projectId={projectId}
                    isEditingSummary={editingSummaryId === task._id}
                    onOpenTask={handleOpenTask}
                    onStartSummaryEdit={startSummaryEdit}
                    onCommitSummary={commitSummary}
                    onCancelSummary={cancelSummaryEdit}
                    onStatusChange={handleStatusChange}
                    onImportanceChange={handleImportanceChange}
                    onAssigneeChange={handleAssigneeChange}
                    buildMenuItems={buildMenuItems}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Only speaks up when there is something the reader has to know: a
            failed page, or a list that is not the whole epic yet. A complete
            list gets no footer at all. */}
        {(failed || (hasMore && !isFirstLoad)) && (
          <div className="flex shrink-0 items-center gap-3 border-t border-neutral-200 bg-neutral-50/60 px-5 py-2.5">
            {failed ? (
              <>
                <AlertCircle size={14} className="shrink-0 text-rose-500" />
                <span className="text-[12px] text-neutral-600">
                  Some tasks could not be loaded.
                </span>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  Try again
                </button>
              </>
            ) : loading ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-400">
                <Loader2 size={12} className="animate-spin" /> Loading more tasks…
              </span>
            ) : (
              <>
                <span className="text-[12px] text-neutral-500">
                  Showing the first {tasks.length}
                  {totalCount ? ` of ${totalCount}` : ""} tasks.
                </span>
                <button
                  type="button"
                  onClick={loadMore}
                  className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  Load {Math.min(PAGE_SIZE, Math.max((totalCount || 0) - tasks.length, 0)) || PAGE_SIZE} more
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>

      {/* Both of these run their own mutation and both ask for something in
          writing first, so they are mounted only once a row has asked for one.
          They sit outside DialogContent because they are dialogs in their own
          right, stacked over this one. */}
      {flagTarget && (
        <AddFlag
          isOpen
          setIsOpen={(open) => { if (!open) setFlagTarget(null); }}
          taskInfo={flagTarget}
          isFlagged={true}
          onFlagged={() => handleFlagged(flagTarget._id)}
        />
      )}

      {deleteTarget && (
        <DeleteTaskDialog
          isOpen
          setIsOpen={(open) => { if (!open) setDeleteTarget(null); }}
          taskInfo={{
            _id: deleteTarget._id,
            project_key: deleteTarget.project_key,
            taskNumber: deleteTarget.taskNumber,
            summary: deleteTarget.summary,
            work_type: deleteTarget.work_type,
          }}
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      )}
    </Dialog>
  );
};

export default EpicTasksDialog;
