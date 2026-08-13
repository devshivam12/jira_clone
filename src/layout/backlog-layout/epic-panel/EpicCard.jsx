import { memo, useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ClipboardX, Loader2, MoreHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import StatusBar from "@/components/common/StatusBar";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import IssueRowSkeleton from "@/components/data-table/IssueRowSkeleton";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import TaskRow from "@/components/data-table/task-row";
import { getEpicTheme } from "@/layout/timeline-layout/epicColors";
import { useLoadMoreOnVisible } from "./useLoadMoreOnVisible";

const ROW_HEIGHT = 56;

export const EPIC_CARD_HEADER_HEIGHT = 61;

const EpicCard = memo(({
  epic,
  childState,
  onToggle,
  onLoadMoreChildren,
  onOpenEpic,
  onTaskCreated,
  workTypeMap,
  taskTypes,
  importanceTypes,
  currentProjectId,
  editingTaskId,
  summaryValues,
  assigneeStates,
  addFlagRef,
  rowHandlers,
  searchQuery,
  formatDate,
}) => {
  const [showCreateRow, setShowCreateRow] = useState(false);
  const scrollRef = useRef(null);

  const expanded = Boolean(childState);
  const children = childState?.children || [];
  const loading = childState?.loading ?? false;
  const hasMore = childState?.hasMore ?? false;

  const theme = getEpicTheme(epic.color);
  const taskKey = epic.project_key && epic.taskNumber ? `${epic.project_key}-${epic.taskNumber}` : "";
  const loadedCount = children.length;
  const totalChildren = epic.totalChildren || 0;

  const dateRange = useMemo(() => {
    if (!epic.startDate && !epic.dueDate) return null;
    const start = epic.startDate ? formatDate(epic.startDate) : "No start";
    const end = epic.dueDate ? formatDate(epic.dueDate) : "No due date";
    return `${start} - ${end}`;
  }, [epic.startDate, epic.dueDate, formatDate]);

  // Only the rows inside this card's own scroll box are mounted, so an open
  // epic with 400 tasks costs about eight rows of DOM like every other list
  // in the app.
  const rowVirtualizer = useVirtualizer({
    count: loadedCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  // The next page of tasks is asked for when the end of the loaded ones comes
  // into view inside this box, not on every scroll frame.
  const handleLoadMoreChildren = useCallback(
    () => onLoadMoreChildren(epic._id),
    [onLoadMoreChildren, epic._id]
  );
  const childSentinelRef = useLoadMoreOnVisible({
    hasMore,
    isFetching: loading,
    onLoadMore: handleLoadMoreChildren,
  });

  const handleToggle = useCallback(() => onToggle(epic._id), [onToggle, epic._id]);
  const handleCreated = useCallback(() => onTaskCreated(epic._id), [onTaskCreated, epic._id]);

  const showEmptyState = expanded && !loading && loadedCount === 0;
  const showInitialSkeleton = expanded && loading && loadedCount === 0;

  return (
    <div className="rounded-xl border bg-white overflow-hidden cursor-default">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b bg-gray-50 px-3 py-3 sm:px-4">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-8 w-8 shrink-0"
            title={expanded ? "Hide tasks" : "Show tasks"}
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Button>

          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.bar}`} />

          <button
            type="button"
            onClick={() => onOpenEpic(epic._id)}
            className="flex min-w-0 items-baseline gap-2 text-left"
            title={epic.summary}
          >
            {taskKey && (
              <span className="shrink-0 text-xs font-semibold text-neutral-500 underline decoration-dotted">
                {taskKey}
              </span>
            )}
            <span className="truncate text-[15px] font-medium text-neutral-700 hover:text-blue-600">
              {epic.summary}
            </span>
          </button>

          <span className="ml-1 hidden shrink-0 text-xs text-neutral-400 sm:inline">
            {totalChildren} {totalChildren === 1 ? "task" : "tasks"}
          </span>

          {dateRange && (
            <span className="ml-2 hidden shrink-0 whitespace-nowrap text-xs text-gray-500 lg:inline">
              {dateRange}
            </span>
          )}
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
          <div className="flex shrink-0 items-center pr-1 lg:pr-2">
            <StatusBar statusCount={epic.statusRollup} taskTypes={taskTypes} />
          </div>
          <Button
            size="sm"
            variant="advanceMuted"
            className="h-8 shrink-0 px-3 text-xs sm:text-sm"
            onClick={() => {
              if (!expanded) handleToggle();
              setShowCreateRow(true);
            }}
          >
            Create task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <TooltipWrapper content="More actions" disableFocusListener>
                  <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                </TooltipWrapper>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 rounded-sm" align="end" sideOffset={8}>
              <DropdownMenuItem className="cursor-pointer px-3 py-2.5" onSelect={() => onOpenEpic(epic._id)}>
                <span className="font-medium text-neutral-600">Open epic</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="w-full">
          {showInitialSkeleton ? (
            <div>
              {[...Array(3)].map((_, index) => (
                <IssueRowSkeleton key={`epic-skeleton-${epic._id}-${index}`} />
              ))}
            </div>
          ) : showEmptyState ? (
            <div className="my-4 flex flex-col items-center justify-center gap-2">
              <ClipboardX size={48} className="text-neutral-400" />
              <span className="text-center text-sm text-gray-500">
                No tasks have been added to this epic.
              </span>
            </div>
          ) : (
            <div ref={scrollRef} className="max-h-[300px] overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  minWidth: "950px",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const task = children[virtualRow.index];
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
                      onRowClick={rowHandlers.onRowClick}
                      onSummaryClick={rowHandlers.onSummaryClick}
                      onSummaryChange={rowHandlers.onSummaryChange}
                      onSummaryKeyDown={rowHandlers.onSummaryKeyDown}
                      onSummaryBlur={rowHandlers.onSummaryBlur}
                      onAvatarClick={rowHandlers.onAvatarClick}
                      onAssigneeChange={rowHandlers.onAssigneeChange}
                      toggleAssigneeOpen={rowHandlers.toggleAssigneeOpen}
                      changeTaskStatus={rowHandlers.changeTaskStatus}
                      changeImportance={rowHandlers.changeImportance}
                      getWorkItemMenuItems={rowHandlers.getWorkItemMenuItems}
                      searchQuery={searchQuery}
                    />
                  );
                })}
              </div>

              {/* Sits inside the scroll box, right under the rows, so it is
                  reached only by scrolling this epic to its end. */}
              <div ref={childSentinelRef} className="h-1" />

              {loading && loadedCount > 0 && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-500">
                  <Loader2 size={14} className="animate-spin" />
                  Loading more tasks
                </div>
              )}
            </div>
          )}

          {!loading && hasMore && (
            <div className="border-t bg-neutral-50/60 px-4 py-1.5 text-center text-[11px] text-neutral-500">
              Showing {loadedCount} of {childState?.totalCount || totalChildren} tasks
            </div>
          )}

          {showCreateRow && (
            <InlineCreateTaskRow
              projectId={currentProjectId}
              workType="task"
              statusOptions={taskTypes}
              importanceOptions={importanceTypes}
              extraVariables={{ parentId: epic._id }}
              onClose={() => setShowCreateRow(false)}
              onCreated={handleCreated}
            />
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => (
  // Editing one task, or opening one epic, should not re-render the other
  // cards on the page.
  prevProps.epic === nextProps.epic &&
  prevProps.childState === nextProps.childState &&
  prevProps.editingTaskId === nextProps.editingTaskId &&
  prevProps.summaryValues === nextProps.summaryValues &&
  prevProps.assigneeStates === nextProps.assigneeStates &&
  prevProps.searchQuery === nextProps.searchQuery &&
  prevProps.workTypeMap === nextProps.workTypeMap &&
  prevProps.taskTypes === nextProps.taskTypes &&
  prevProps.importanceTypes === nextProps.importanceTypes &&
  prevProps.currentProjectId === nextProps.currentProjectId &&
  prevProps.rowHandlers === nextProps.rowHandlers
));

EpicCard.displayName = "EpicCard";

export default EpicCard;
