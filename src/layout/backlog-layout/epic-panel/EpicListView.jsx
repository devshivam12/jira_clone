import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronsDownUp, Loader2, PanelLeft, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddFlag from "@/components/common/AddFlag";
import DeleteTaskDialog from "@/components/common/DeleteTaskDialog";
import DynamicDropdownSelector from "@/components/common/DynamicDropdownSelector";
import ShowToast from "@/components/common/ShowToast";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import IssueRowSkeleton from "@/components/data-table/IssueRowSkeleton";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import useDateFormatter from "@/hooks/useDateFormatter";
import { useEpicChildren, usePruneExpanded } from "@/layout/timeline-layout/useEpicChildren";
import { useDeleteTaskMutation, useUpdateIssueMutation } from "@/redux/graphql_api/task";
import EpicImage from "@/assets/epic-image.svg";
import EpicCard, { EPIC_CARD_HEADER_HEIGHT } from "./EpicCard";
import { useEpicList } from "./useEpicList";
import RevealOnVisible from "./RevealOnVisible";
import { useLoadMoreOnVisible } from "./useLoadMoreOnVisible";

// The epic list: every epic of the project as its own table, with that epic's
// tasks inside it.
//
// This replaces the backlog and sprint tables in the main area rather than
// stacking under them. Three long lists on one screen was the situation the
// browser could not keep up with, and only one of them is ever the one being
// read, so only one is mounted.
const EpicListView = ({ projectData, onViewChange, onClose }) => {
  const { currentProject, workType, importance, workFlow } = projectData || {};
  const currentProjectId = currentProject?._id;

  const [, setSearchParams] = useSearchParams();
  const [updateTask] = useUpdateIssueMutation();
  const [deleteTask, { isLoading: deleteLoading }] = useDeleteTaskMutation();
  const formatDate = useDateFormatter("dd MMM");

  // Typing filters on the server, so the request only fires once the term has
  // settled.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { epics, totalCount, hasMore, isLoading, isFetching, loadMore, reload } =
    useEpicList(currentProjectId, debouncedSearch);

  const {
    expanded,
    toggleEpic,
    refreshEpic,
    loadMoreChildren,
    collapseAll,
    pruneTo,
    patchChild,
    removeChild,
  } = useEpicChildren();

  // An epic filtered out by the search, or on a page the user reloaded away
  // from, is not coming back on screen: its task list is dropped here.
  usePruneExpanded(epics, pruneTo);

  const [showCreateEpic, setShowCreateEpic] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [summaryValues, setSummaryValues] = useState({});
  const [assigneeStates, setAssigneeStates] = useState({});
  const [currentFlagTask, setCurrentFlagTask] = useState(null);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({ isOpen: false, task: null });
  const addFlagRef = useRef(null);

  const listSentinelRef = useLoadMoreOnVisible({ hasMore, isFetching, onLoadMore: loadMore });

  // The row callbacks below need a task's current value so they can put it
  // back when a request fails. They read it through this ref rather than from
  // `expanded` directly: that map changes every time any epic loads a page,
  // and depending on it would rebuild every handler (and re-render every card)
  // each time.
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  const findChild = useCallback((taskId) => {
    for (const state of expandedRef.current.values()) {
      const found = state.children.find((child) => child._id === taskId);
      if (found) return found;
    }
    return null;
  }, []);

  // The first epic opens on its own, so the view does not read as a wall of
  // closed headers. Every other epic stays closed until it is asked for.
  const autoExpandedRef = useRef(false);
  useEffect(() => {
    if (autoExpandedRef.current) return;
    if (!epics.length) return;
    autoExpandedRef.current = true;
    toggleEpic(epics[0]._id);
  }, [epics, toggleEpic]);

  const taskTypes = useMemo(() =>
    (workFlow || []).map((status, index) => ({
      id: index + 1,
      name: status.name,
      value: status.slug,
      color: status.color,
    })),
    [workFlow]
  );

  const importanceTypes = useMemo(() =>
    (importance || []).map((imp, index) => ({
      id: index + 1,
      name: imp.name,
      value: imp.slug,
      color: imp.color,
    })),
    [importance]
  );

  const workTypeMap = useMemo(() =>
    new Map((workType || []).map((status, index) => [
      status.slug,
      { id: index + 1, name: status.name, value: status.slug, color: status.color, icon: status.icon },
    ])),
    [workType]
  );

  const handleUpdateTask = useCallback(async (key, value, id, fullDetail) => {
    const payload = {
      operationName: "updateTask",
      variables: {
        taskId: id,
        key,
        value,
        ...(fullDetail !== undefined && { fullDetail }),
      },
    };
    return updateTask(payload).unwrap();
  }, [updateTask]);

  const openEpic = useCallback((epicId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("issueId", epicId);
      return next;
    });
  }, [setSearchParams]);

  const handleRowClick = useCallback((e, id) => {
    if (e.target.closest("[data-no-row-click]")) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("issueId", id);
      return next;
    });
  }, [setSearchParams]);

  const handleSummaryClick = useCallback((e, taskId) => {
    e.stopPropagation();
    setEditingTaskId(taskId);
  }, []);

  const handleSummaryChange = useCallback((e, taskId) => {
    setSummaryValues((prev) => ({ ...prev, [taskId]: e.target.value }));
  }, []);

  const saveSummaryAndClose = useCallback(async (task) => {
    const trimmed = summaryValues[task._id]?.trim();

    if (!trimmed || trimmed === task.summary) {
      setSummaryValues((prev) => ({ ...prev, [task._id]: task.summary }));
      setEditingTaskId(null);
      return;
    }

    // Shown as saved right away, and put back if the request fails.
    patchChild(task._id, { summary: trimmed });
    try {
      await handleUpdateTask("summary", trimmed, task._id);
    } catch {
      patchChild(task._id, { summary: task.summary });
      setSummaryValues((prev) => ({ ...prev, [task._id]: task.summary }));
      ShowToast.error("Failed to update summary.");
    } finally {
      setEditingTaskId(null);
    }
  }, [summaryValues, handleUpdateTask, patchChild]);

  const handleSummaryKeyDown = useCallback((e, task) => {
    if (e.key === "Enter") {
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
    setAssigneeStates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], isOpen: !prev[taskId]?.isOpen },
    }));
  }, []);

  const handleAssigneeChange = useCallback((selectedMember, task) => {
    setAssigneeStates((prev) => ({
      ...prev,
      [task._id]: { isOpen: false, assignee: selectedMember },
    }));

    const assignee = selectedMember?._id;
    if (assignee === task?.assigneeDetail?._id) return;

    patchChild(task._id, { assigneeDetail: selectedMember });
    handleUpdateTask("assigneeId", assignee, task._id).catch(() => {
      patchChild(task._id, { assigneeDetail: task.assigneeDetail });
      setAssigneeStates((prev) => ({
        ...prev,
        [task._id]: { isOpen: false, assignee: task.assigneeDetail },
      }));
      ShowToast.error("Failed to update assignee.");
    });
  }, [handleUpdateTask, patchChild]);

  const toggleAssigneeOpen = useCallback((taskId, isOpen) => {
    setAssigneeStates((prev) => ({ ...prev, [taskId]: { ...prev[taskId], isOpen } }));
  }, []);

  const changeTaskStatus = useCallback((status, taskId) => {
    const previous = findChild(taskId)?.task_status;
    patchChild(taskId, { task_status: status });
    handleUpdateTask("task_status", status, taskId).catch(() => {
      if (previous !== undefined) patchChild(taskId, { task_status: previous });
      ShowToast.error("Failed to update status.");
    });
  }, [findChild, handleUpdateTask, patchChild]);

  const changeImportance = useCallback((imp, taskId) => {
    const previous = findChild(taskId)?.importance;
    patchChild(taskId, { importance: imp });
    handleUpdateTask("importance", imp, taskId).catch(() => {
      if (previous !== undefined) patchChild(taskId, { importance: previous });
      ShowToast.error("Failed to update priority.");
    });
  }, [findChild, handleUpdateTask, patchChild]);

  const copyLinkKey = useCallback((isLink, task) => {
    const identifier = `${task.project_key}-${task.taskNumber}`;
    const text = isLink ? `${window.location.origin}/${identifier}/${task._id}` : identifier;
    const message = isLink
      ? `You've copied the link to ${identifier} to your clipboard`
      : "Key successfully copied to your clipboard";

    navigator.clipboard.writeText(text)
      .then(() => ShowToast.info(message))
      .catch((err) => ShowToast.warning(err));
  }, []);

  const getWorkItemMenuItems = useCallback((task) => [
    {
      id: "copy-link",
      label: "Copy link",
      onSelect: () => copyLinkKey(true, task),
    },
    {
      id: "copy-key",
      label: "Copy key",
      onSelect: () => copyLinkKey(false, task),
    },
    { type: "separator" },
    {
      id: "move-sprint",
      type: "submenu",
      label: "Move to sprint",
      content: (
        <DynamicDropdownSelector
          slug="sprint"
          showDropdown={true}
          label="Select sprint"
          projectId={currentProjectId}
          onChange={(sprint) => {
            if (!sprint) return;
            handleUpdateTask("sprintId", sprint._id, task._id, sprint)
              .then(() => ShowToast.success(`Moved to ${sprint.name || "sprint"}`))
              .catch(() => ShowToast.error("Could not move the task"));
          }}
        />
      ),
    },
    {
      id: task.isFlagged ? "remove-flag" : "add-flag",
      label: task.isFlagged ? "Remove flag" : "Add flag",
      onSelect: (e) => {
        e?.stopPropagation?.();
        if (task.isFlagged) {
          patchChild(task._id, { isFlagged: false });
          handleUpdateTask("isFlagged", "false", task._id).catch(() => {
            patchChild(task._id, { isFlagged: true });
          });
          return;
        }
        setCurrentFlagTask({
          _id: task._id,
          workType: task.work_type,
          project_key: task.project_key,
          taskNumber: task.taskNumber,
          summary: task.summary,
        });
        setIsFlagDialogOpen(true);
      },
    },
    { type: "separator" },
    {
      id: "delete",
      label: "Delete",
      danger: true,
      onSelect: (e) => {
        e?.stopPropagation?.();
        setDeleteDialogState({ isOpen: true, task });
      },
    },
  ], [copyLinkKey, currentProjectId, handleUpdateTask, patchChild]);

  // One object, so a card only re-renders when its own epic or task list
  // changes rather than every time this component renders.
  const rowHandlers = useMemo(() => ({
    onRowClick: handleRowClick,
    onSummaryClick: handleSummaryClick,
    onSummaryChange: handleSummaryChange,
    onSummaryKeyDown: handleSummaryKeyDown,
    onSummaryBlur: handleSummaryBlur,
    onAvatarClick: handleAvatarClick,
    onAssigneeChange: handleAssigneeChange,
    toggleAssigneeOpen,
    changeTaskStatus,
    changeImportance,
    getWorkItemMenuItems,
  }), [
    handleRowClick, handleSummaryClick, handleSummaryChange, handleSummaryKeyDown,
    handleSummaryBlur, handleAvatarClick, handleAssigneeChange, toggleAssigneeOpen,
    changeTaskStatus, changeImportance, getWorkItemMenuItems,
  ]);

  const handleDeleteTask = useCallback(async (reason) => {
    const task = deleteDialogState.task;
    if (!task) return;

    try {
      const response = await deleteTask({
        operationName: "deleteTask",
        variables: { taskId: task._id, reason },
      }).unwrap();

      if (response?.data?.deleteTask?.status === 200) {
        removeChild(task._id);
        reload();
        ShowToast.success("Task moved to archive");
        setDeleteDialogState({ isOpen: false, task: null });
      } else {
        ShowToast.error(response?.data?.deleteTask?.message || "Could not delete the task");
      }
    } catch (error) {
      ShowToast.error(`Something is wrong, Please check after sometime ${error}`);
    }
  }, [deleteDialogState.task, deleteTask, removeChild, reload]);

  // A new task changes both the epic's task list and its rollup counts, so the
  // open epic re-reads its first page and the epic list is refreshed.
  const handleTaskCreated = useCallback((epicId) => {
    refreshEpic(epicId);
    reload();
  }, [refreshEpic, reload]);

  const showInitialSkeleton = isLoading && epics.length === 0;
  const isEmpty = !isLoading && epics.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-neutral-200 px-6 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-neutral-800">
              Epics
            </h1>
            {totalCount > 0 && (
              <span className="hidden rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 sm:inline-flex">
                {epics.length} of {totalCount}
              </span>
            )}
            {isFetching && <Loader2 size={14} className="animate-spin text-neutral-400" />}
          </div>

          <div className="flex items-center gap-2">
            {expanded.size > 0 && (
              <TooltipWrapper content="Collapse all epics">
                <Button size="sm" variant="advanceMuted" className="h-8 px-3 text-xs" onClick={collapseAll}>
                  <ChevronsDownUp size={14} className="mr-1" />
                  Collapse all
                </Button>
              </TooltipWrapper>
            )}
            <TooltipWrapper content="Back to the epic panel">
              <button
                type="button"
                onClick={() => onViewChange("panel")}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100"
              >
                <PanelLeft size={18} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper content="Hide epics">
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </TooltipWrapper>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-primary"
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search epics"
              className="h-9 w-[260px] rounded-md border-neutral-300 bg-white pl-9 pr-8 shadow-sm"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            size="sm"
            variant="advanceMuted"
            className="h-9 px-3 text-sm"
            onClick={() => setShowCreateEpic(true)}
          >
            <Plus size={15} className="mr-1" />
            Create epic
          </Button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-20 pt-4">
        {showCreateEpic && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <InlineCreateTaskRow
              projectId={currentProjectId}
              workType="epic"
              statusOptions={taskTypes}
              importanceOptions={importanceTypes}
              onClose={() => setShowCreateEpic(false)}
              onCreated={reload}
            />
          </div>
        )}

        {showInitialSkeleton && (
          <div className="overflow-hidden rounded-xl border bg-white">
            {[...Array(4)].map((_, index) => (
              <IssueRowSkeleton key={`epic-list-skeleton-${index}`} />
            ))}
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <img src={EpicImage} alt="" className="w-24" />
            <p className="max-w-sm text-center text-sm text-neutral-600">
              {debouncedSearch
                ? `No epic matches “${debouncedSearch}”.`
                : "Plan and prioritize large chunks of work. Create your first epic to start breaking down work for your team."}
            </p>
            {!debouncedSearch && (
              <Button size="sm" variant="teritary" onClick={() => setShowCreateEpic(true)}>
                <Plus size={15} className="mr-1" />
                Create epic
              </Button>
            )}
          </div>
        )}

        {epics.map((epic) => (
          // A card further down the page is not built until it is close to
          // being seen. Once built it stays, because it holds the task list
          // of an epic the user opened.
          <RevealOnVisible key={epic._id} placeholderHeight={EPIC_CARD_HEADER_HEIGHT}>
            <EpicCard
              epic={epic}
              childState={expanded.get(epic._id)}
              onToggle={toggleEpic}
              onLoadMoreChildren={loadMoreChildren}
              onOpenEpic={openEpic}
              onTaskCreated={handleTaskCreated}
              workTypeMap={workTypeMap}
              taskTypes={taskTypes}
              importanceTypes={importanceTypes}
              currentProjectId={currentProjectId}
              editingTaskId={editingTaskId}
              summaryValues={summaryValues}
              assigneeStates={assigneeStates}
              addFlagRef={addFlagRef}
              rowHandlers={rowHandlers}
              searchQuery=""
              formatDate={formatDate}
            />
          </RevealOnVisible>
        ))}

        <div ref={listSentinelRef} className="h-1" />

        {isFetching && epics.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-neutral-500">
            <Loader2 size={14} className="animate-spin" />
            Loading more epics
          </div>
        )}
      </div>

      {currentFlagTask && (
        <AddFlag
          isOpen={isFlagDialogOpen}
          setIsOpen={setIsFlagDialogOpen}
          taskInfo={currentFlagTask}
          isFlagged={true}
          onConfirm={() => {
            patchChild(currentFlagTask._id, { isFlagged: true });
            handleUpdateTask("isFlagged", true, currentFlagTask._id).catch(() => {
              patchChild(currentFlagTask._id, { isFlagged: false });
            });
            setIsFlagDialogOpen(false);
            setCurrentFlagTask(null);
          }}
          onCancel={() => {
            setIsFlagDialogOpen(false);
            setCurrentFlagTask(null);
          }}
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
          work_type: deleteDialogState.task?.work_type,
        }}
        onConfirm={handleDeleteTask}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default React.memo(EpicListView);
