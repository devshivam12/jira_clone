import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutList, Loader2, PanelLeft, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import { getEpicTheme } from "@/layout/timeline-layout/epicColors";
import EpicImage from "@/assets/epic-image.svg";
import { useEpicList } from "./useEpicList";
import { useLoadMoreOnVisible } from "./useLoadMoreOnVisible";

// One epic in the sidebar: colour, key, summary and how much of it is done.
// No tasks, so a project with fifty epics is still a short list.
const EpicChip = memo(({ epic, onOpen }) => {
  const theme = getEpicTheme(epic.color);
  const total = epic.totalChildren || 0;
  const done = epic.doneChildren || 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const taskKey = epic.project_key && epic.taskNumber ? `${epic.project_key}-${epic.taskNumber}` : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(epic._id)}
      title={epic.summary}
      className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${theme.bar}`} />
        <span className="truncate text-[11px] font-semibold text-neutral-500">{taskKey}</span>
        <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
          {done}/{total}
        </span>
      </div>

      <p className="mt-1 truncate text-[13px] font-medium text-neutral-700">{epic.summary}</p>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
});
EpicChip.displayName = "EpicChip";

// The epic panel in its default, narrow form: every epic of the project as a
// chip, plus the switch to the full list view.
//
// Deliberately light. It sits next to the backlog, so it holds no task rows and
// asks for one page of epic headers at a time.
const EpicPanel = ({ projectData, onClose, onViewChange }) => {
  const { currentProject, workFlow, importance } = projectData || {};
  const currentProjectId = currentProject?._id;

  const [, setSearchParams] = useSearchParams();
  const [showCreateRow, setShowCreateRow] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { epics, totalCount, hasMore, isLoading, isFetching, loadMore, reload } =
    useEpicList(currentProjectId, debouncedSearch);

  const sentinelRef = useLoadMoreOnVisible({ hasMore, isFetching, onLoadMore: loadMore });

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

  const openEpic = useCallback((epicId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("issueId", epicId);
      return next;
    });
  }, [setSearchParams]);

  const hasEpics = epics.length > 0;
  const showEmptyState = !isLoading && !hasEpics && !debouncedSearch;
  const showNoMatch = !isLoading && !hasEpics && Boolean(debouncedSearch);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-neutral-200 bg-neutral-100">
      <div className="flex-none px-3 pb-2 pt-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="text-sm font-semibold text-neutral-700">Epic</p>
            {totalCount > 0 && (
              <span className="text-[11px] font-medium text-neutral-400">{totalCount}</span>
            )}
            {isFetching && <Loader2 size={11} className="animate-spin text-neutral-400" />}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/* The two views of the same epics: this panel, or the full list
                in the main area. */}
            <div className="flex items-center rounded-md bg-white p-0.5">
              <TooltipWrapper content="Panel view">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-700"
                >
                  <PanelLeft size={13} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper content="List view">
                <button
                  type="button"
                  onClick={() => onViewChange("list")}
                  className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  <LayoutList size={13} />
                </button>
              </TooltipWrapper>
            </div>

            <TooltipWrapper content="Hide epic panel">
              <button
                type="button"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
              >
                <X size={14} />
              </button>
            </TooltipWrapper>
          </div>
        </div>

        {(hasEpics || debouncedSearch) && (
          <div className="relative mt-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search epics"
              className="h-8 rounded-md border-neutral-200 bg-white pl-7 pr-7 text-xs"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2">
        {isLoading && !hasEpics && (
          <div className="space-y-2 pt-1">
            {[...Array(4)].map((_, index) => (
              <div key={`epic-chip-skeleton-${index}`} className="h-[62px] animate-pulse rounded-lg bg-white/70" />
            ))}
          </div>
        )}

        {showEmptyState && (
          <div className="pt-6 text-center">
            <img src={EpicImage} alt="" className="mx-auto w-20" />
            <p className="mt-6 text-sm font-normal text-neutral-700">
              Plan and prioritize large chunks of work.
              <br />
              Create your first epic to start capturing and breaking down work for your team.
            </p>
          </div>
        )}

        {showNoMatch && (
          <p className="pt-6 text-center text-xs text-neutral-500">
            No epic matches &quot;{debouncedSearch}&quot;.
          </p>
        )}

        {epics.map((epic) => (
          <EpicChip key={epic._id} epic={epic} onOpen={openEpic} />
        ))}

        <div ref={sentinelRef} className="h-1" />

        {isFetching && hasEpics && (
          <div className="flex items-center justify-center py-2">
            <Loader2 size={13} className="animate-spin text-neutral-400" />
          </div>
        )}
      </div>

      <div className="flex-none border-t border-neutral-200 p-2">
        {showCreateRow ? (
          <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
            <InlineCreateTaskRow
              projectId={currentProjectId}
              workType="epic"
              statusOptions={taskTypes}
              importanceOptions={importanceTypes}
              onClose={() => setShowCreateRow(false)}
              onCreated={reload}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-sm text-neutral-600 hover:bg-neutral-200"
            onClick={() => setShowCreateRow(true)}
          >
            <Plus size={16} className="text-neutral-500" />
            Create Epic
          </Button>
        )}
      </div>
    </div>
  );
};

export default memo(EpicPanel);
