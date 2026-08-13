import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { ChevronRight, Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import EpicBar from "./EpicBar";
import ChildTaskBar from "./ChildTaskBar";
import EpicDetailsPopover from "./EpicDetailsPopover";
import DependencyLines from "./DependencyLines";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import ManageAvatar from "@/components/common/ManageAvatar";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import { cn } from "@/lib/utils";
import { getEpicTheme } from "./epicColors";
import { useEpicChildren, usePruneExpanded } from "./useEpicChildren";
import {
  buildAxisColumns,
  quarterKey,
  dateToX,
  xToDate,
  getBarGeometry,
  isRunningNow,
  MIN_PX_PER_DAY,
  MAX_PX_PER_DAY,
} from "./timelineDate";

const EPIC_ROW_HEIGHT = 56;
// Child rows are only a little shorter than an epic row. They carry a real
// bar with a readable label inside it, so squeezing them into a thin strip
// made the tasks under an epic hard to read and hard to hit with a pointer.
const CHILD_ROW_HEIGHT = 46;
const CHILD_MORE_HEIGHT = 30;
// The "add a task" line that closes off an epic's box.
const CHILD_ADD_HEIGHT = 34;
const LABEL_WIDTH = 288;
const HEADER_HEIGHT = 44;

// The sticky label cell for one epic. Split out and memoized so scrolling
// (which changes only the mounted window) doesn't re-render the label of
// every row that happens to stay on screen.
const EpicRowLabel = React.memo(function EpicRowLabel({
  epic,
  isRunning,
  isExpanded,
  onToggle,
  onAddChild,
  onOpenDetails,
}) {
  // Precomputed here rather than inline in JSX so we don't allocate a fresh
  // split() array for every row on every render.
  const [firstName, lastName] = useMemo(
    () => (epic.assigneeDetail?.name || "").split(" "),
    [epic.assigneeDetail?.name]
  );
  const taskKey = epic.project_key && epic.taskNumber ? `${epic.project_key}-${epic.taskNumber}` : null;
  const theme = getEpicTheme(epic.color);
  const childCount = epic.totalChildren || 0;

  return (
    <div
      className="shrink-0 sticky left-0 z-10 border-r border-neutral-200 bg-white group-hover/row:bg-neutral-50 flex items-center gap-2 pl-2 pr-3 transition-colors"
      style={{ width: LABEL_WIDTH }}
    >
      <button
        type="button"
        onClick={() => onToggle(epic._id)}
        disabled={childCount === 0}
        className={cn(
          "shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 transition-colors",
          childCount === 0 ? "opacity-25 cursor-default" : "hover:bg-neutral-200 hover:text-neutral-700"
        )}
        title={childCount === 0 ? "No child tasks" : isExpanded ? "Hide tasks" : "Show tasks"}
      >
        <ChevronRight size={15} className={cn("transition-transform duration-150", isExpanded && "rotate-90")} />
      </button>

      <span className={cn("h-6 w-1 shrink-0 rounded-full", theme.bar)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {taskKey && (
            <span className="text-[10px] font-bold tracking-wide text-neutral-400">{taskKey}</span>
          )}
          {isRunning && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Now
            </span>
          )}
        </div>
        <div className="text-[13px] font-medium text-neutral-800 truncate leading-tight">{epic.summary}</div>
      </div>

      {childCount > 0 && (
        <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
          {epic.doneChildren || 0}/{childCount}
        </span>
      )}

      {/* Adds a task under this epic. Hidden until the row is hovered (or the
          button itself is focused, so it stays reachable from the keyboard)
          because one always-on icon per row turns the label column into a
          wall of plus signs. Plain `title` rather than TooltipWrapper: these
          two sit in every mounted row, and a Radix tooltip root per row is a
          lot of live objects for a one-line hint. */}
      <button
        type="button"
        onClick={() => onAddChild(epic)}
        title="Add a task to this epic"
        className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 opacity-0 focus:opacity-100 group-hover/row:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-opacity"
      >
        <Plus size={15} />
      </button>

      {/* Colour and dependencies live in their own small popover; the bar
          itself now opens the full editor instead. */}
      <button
        type="button"
        onClick={() => onOpenDetails(epic._id)}
        title="Colour and dependencies"
        className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 opacity-0 focus:opacity-100 group-hover/row:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 transition-opacity"
      >
        <SlidersHorizontal size={14} />
      </button>

      {epic.assigneeDetail?._id && (
        <ManageAvatar
          firstName={firstName}
          lastName={lastName}
          size="xs"
          showTooltip
          tooltipContent={epic.assigneeDetail.name}
        />
      )}
    </div>
  );
});

// One slice of the box that wraps everything under an expanded epic.
//
// The box is not a single tall element. Only a window of rows is ever
// mounted, so a real container around them would have to be as tall as the
// whole group whether or not any of it is on screen - the same mistake the
// dependency overlay used to make. Instead every row draws its own slice:
// side borders always, a rounded top on the first slice, a rounded bottom on
// the last. Stacked together they read as one box, and the browser only ever
// paints the part you can see.
//
// It lives in the label column, which is 288px. Extending it across the track
// would mean a bordered element up to twenty thousand pixels wide per row.
const ChildGroupCell = React.memo(function ChildGroupCell({
  accent,
  isGroupStart,
  isGroupEnd,
  children,
}) {
  return (
    <div
      className="shrink-0 sticky left-0 z-10 border-r border-neutral-200 bg-white flex items-stretch pl-7 pr-3"
      style={{ width: LABEL_WIDTH }}
    >
      <div
        className={cn(
          "flex flex-1 min-w-0 items-stretch overflow-hidden border-x border-neutral-200 bg-neutral-50",
          isGroupStart && "rounded-t-lg border-t",
          isGroupEnd && "rounded-b-lg border-b"
        )}
      >
        {/* Carries the parent epic's colour down the whole group, so a run of
            tasks is tied to the bar it belongs to at a glance. Unbroken
            because the row divider below starts after it. */}
        <span className={cn("w-1 shrink-0", accent)} />
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 px-2",
            !isGroupStart && "border-t border-neutral-200/70"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
});

const ChildRowLabel = React.memo(function ChildRowLabel({
  task,
  statusColor,
  statusName,
  accent,
  isGroupStart,
  isGroupEnd,
}) {
  const taskKey = task.project_key && task.taskNumber ? `${task.project_key}-${task.taskNumber}` : null;

  return (
    <ChildGroupCell accent={accent} isGroupStart={isGroupStart} isGroupEnd={isGroupEnd}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusColor || "bg-neutral-300")} title={statusName} />
      {taskKey && <span className="shrink-0 text-[11px] font-semibold text-neutral-400">{taskKey}</span>}
      <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-700">{task.summary}</span>
    </ChildGroupCell>
  );
});

// The axis header's columns + resize handles + "Today" badge. Split out
// and memoized so a pure scroll frame (which only changes which rows are
// mounted below, not any of these props) skips rebuilding this .map() and
// re-diffing ~12 header cells every frame instead of just bailing out.
//
// Columns are months or quarters depending on the zoom (see buildAxisColumns).
// Each quarter column is also a bar you can click: it picks which quarter's
// epics the rows below show, without moving the axis off the year. The quarter
// today falls in wears a red bar, so "where are we now" is readable even after
// clicking around to other quarters.
const AxisHeaderColumns = React.memo(function AxisHeaderColumns({
  axisColumns,
  todayX,
  showToday,
  onResizeStart,
  onSelectQuarter,
  selectedQuarterKey,
  currentQuarterKey,
}) {
  return (
    <>
      {axisColumns.map((col) => {
        const isQuarter = col.unit === "quarter";
        const isClickable = isQuarter && !!onSelectQuarter;
        const isSelected = isQuarter && col.key === selectedQuarterKey;
        const isCurrent = isQuarter && col.key === currentQuarterKey;
        return (
          <div
            key={col.key}
            className={cn(
              "group/col absolute top-0 h-full flex items-center text-[11px] font-bold uppercase tracking-wider border-r border-neutral-200 transition-colors",
              // The clickable quarter columns keep their padding on the button
              // instead, so the whole column is one hit target rather than a
              // strip with dead edges.
              !isClickable && "px-3",
              isSelected ? "bg-blue-50/80 text-blue-700" : "text-neutral-500"
            )}
            style={{ left: col.x, width: col.width }}
          >
            {isClickable ? (
              <button
                type="button"
                onClick={() => onSelectQuarter(col.start)}
                aria-pressed={isSelected}
                className={cn(
                  "h-full w-full min-w-0 flex flex-col justify-center px-3 pb-1.5 text-left leading-tight transition-colors",
                  !isSelected && "hover:bg-blue-50/50 hover:text-blue-600"
                )}
                title={
                  isSelected
                    ? `${col.label} (${col.sublabel}) is being shown`
                    : `Show the epics of ${col.label} (${col.sublabel})`
                }
              >
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{col.label}</span>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[8px] font-bold leading-none text-white">
                      Now
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "block truncate text-[9px] font-semibold normal-case tracking-normal",
                    isSelected ? "text-blue-500" : "text-neutral-400"
                  )}
                >
                  {col.sublabel}
                </span>

                {/* Every quarter carries a bar along the bottom of its column,
                    so the four of them read as a row of bars you can click,
                    not just column headings. The running quarter's is red -
                    it marks all three of its months rather than only the
                    single day the today line sits on - the selected one's is
                    blue, and the rest stay grey until hovered. */}
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-1.5 transition-colors",
                    isCurrent
                      ? "bg-rose-500"
                      : isSelected
                        ? "bg-blue-500"
                        : "bg-neutral-200 group-hover/col:bg-blue-300"
                  )}
                />
              </button>
            ) : (
              <span className="flex-1 min-w-0 truncate">{col.label}</span>
            )}

            {/* Deliberately a zoom, not a per-column resize. Every column
                shares one pxPerDay so a day is the same width everywhere,
                which is what lets you compare two bars by eye. The cursor and
                tooltip say "zoom" so the handle doesn't promise per-column
                widths it won't deliver.
                Left out of the quarter view, where the day width is fixed by
                the chart so the whole year keeps fitting the screen, and a
                handle that fights that would only look broken. */}
            {onResizeStart && (
              <div
                className="absolute inset-y-0 -right-1 w-2 cursor-ew-resize z-10 flex justify-center"
                onPointerDown={onResizeStart(col)}
                title="Drag to zoom the timeline (all columns scale together)"
              >
                <div className="w-0.5 h-full bg-transparent group-hover/col:bg-blue-400/70 group-active/col:bg-blue-500" />
              </div>
            )}
          </div>
        );
      })}
      {/* Pinned to the sticky header so "today" stays visible even when the
          row area is scrolled down. */}
      {showToday && (
        <div className="absolute top-0 z-10 pointer-events-none -translate-x-1/2" style={{ left: todayX }}>
          <span className="mt-1.5 inline-block rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
            Today
          </span>
        </div>
      )}
    </>
  );
});

// The faint per-column gridlines behind the bars. Drawn once from
// axisColumns (never from scroll state), so this is memoized purely to
// skip re-diffing it on every scroll frame like the component above.
//
// The selected quarter's band is tinted here too, so the rows on screen are
// visibly tied to the quarter bar they came from rather than just happening to
// sit under it.
const AxisGridLines = React.memo(function AxisGridLines({ axisColumns, selectedQuarterKey }) {
  return axisColumns.map((col) => (
    <div
      key={col.key}
      className={cn(
        "absolute top-0 h-full border-r border-neutral-200/70",
        col.key === selectedQuarterKey && "bg-blue-50/50"
      )}
      style={{ left: col.x, width: col.width }}
    />
  ));
});

// One virtualized row. Wrapped in React.memo and given a plain `top` number
// instead of an inline style object built at the call site, so that scrolling
// - which hands the virtualizer a fresh `virtualItems` array every frame but
// leaves each *persisting* row's own top unchanged - doesn't force every
// mounted row to rebuild its className (cn() included) and re-render. Only
// rows that actually mount, unmount, or have their own data change do that.
const EpicRow = React.memo(function EpicRow({
  epic,
  top,
  totalWidth,
  rangeStart,
  pxPerDay,
  isRunning,
  isExpanded,
  isHighlighted,
  onToggle,
  onAddChild,
  onCommitDates,
  onOpenDetails,
  onOpenTask,
}) {
  return (
    <div
      className="group/row flex absolute left-0 w-full border-b border-neutral-200"
      // Positioned with `top`, not `transform`. A transform would make each
      // row its own stacking context, trapping the sticky label's z-10
      // inside it so the today line and the dependency overlay would paint
      // over the label column while scrolling right.
      style={{ height: EPIC_ROW_HEIGHT, top }}
    >
      <EpicRowLabel
        epic={epic}
        isRunning={isRunning}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onAddChild={onAddChild}
        onOpenDetails={onOpenDetails}
      />
      {/* overflow-hidden clips bars to the visible period. An epic can start
          inside the quarter and end long after it, and without this its bar
          would stretch past the last month and add empty horizontal scroll
          space.
          No hover background here on purpose. This element is `totalWidth`
          wide - twenty thousand pixels at the widest zoom - so tinting it
          made every mouse move between rows repaint a strip that size, twice
          (leave, then enter), and an animated transition kept doing it for
          the length of the animation. The hover cue lives on the label cell,
          which is 288px. */}
      <div className="relative flex-1 overflow-hidden" style={{ width: totalWidth }}>
        <EpicBar
          epic={epic}
          rangeStart={rangeStart}
          pxPerDay={pxPerDay}
          isRunning={isRunning}
          isHighlighted={isHighlighted}
          onCommitDates={onCommitDates}
          onOpenTask={onOpenTask}
        />
      </div>
    </div>
  );
});

// A child task's row. The whole row is the click target (label cell and track
// alike) so a task with no dates - which has only a text marker on the track -
// is just as easy to open as one with a bar.
//
// No bottom border: the box drawn by ChildGroupCell is what separates the
// rows now, and a border across the row would cut straight through it. The
// last row of a group closes the box off across the track instead.
const ChildRow = React.memo(function ChildRow({
  task,
  top,
  totalWidth,
  rangeStart,
  pxPerDay,
  parentLeft,
  statusColor,
  statusName,
  accent,
  isGroupStart,
  isGroupEnd,
  onOpenTask,
}) {
  return (
    <div
      className={cn(
        "flex absolute left-0 w-full bg-neutral-50/40 cursor-pointer",
        isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_ROW_HEIGHT, top }}
      onClick={() => onOpenTask(task._id)}
      title={`Open ${task.summary}`}
    >
      <ChildRowLabel
        task={task}
        statusColor={statusColor}
        statusName={statusName}
        accent={accent}
        isGroupStart={isGroupStart}
        isGroupEnd={isGroupEnd}
      />
      {/* Same reason as the epic track above: no hover tint on a
          full-timeline-width element. */}
      <div className="relative flex-1 overflow-hidden" style={{ width: totalWidth }}>
        <ChildTaskBar
          task={task}
          rangeStart={rangeStart}
          pxPerDay={pxPerDay}
          statusColor={statusColor}
          statusName={statusName}
          fallbackLeft={parentLeft}
        />
      </div>
    </div>
  );
});

// "Load more tasks" / "Loading tasks", drawn as another slice of the box.
const ChildMoreRow = React.memo(function ChildMoreRow({
  row,
  top,
  onLoadMore,
}) {
  return (
    <div
      className={cn(
        "flex absolute left-0 w-full bg-neutral-50/40",
        row.isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_MORE_HEIGHT, top }}
    >
      <ChildGroupCell accent={row.accent} isGroupStart={row.isGroupStart} isGroupEnd={row.isGroupEnd}>
        {row.loading ? (
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Loader2 size={11} className="animate-spin" /> Loading tasks…
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onLoadMore(row.epicId)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Load more tasks
            {row.totalCount ? ` (${row.loaded} of ${row.totalCount})` : ""}
          </button>
        )}
      </ChildGroupCell>
    </div>
  );
});

// The line that closes the box off. Adding a task from here is the same action
// as the "+" on the epic row above, put where someone reading the list of
// tasks is already looking.
const ChildAddRow = React.memo(function ChildAddRow({ row, top, onAddChild }) {
  return (
    <div
      className={cn(
        "flex absolute left-0 w-full bg-neutral-50/40",
        row.isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_ADD_HEIGHT, top }}
    >
      <ChildGroupCell accent={row.accent} isGroupStart={row.isGroupStart} isGroupEnd={row.isGroupEnd}>
        <button
          type="button"
          onClick={() => onAddChild(row.epic)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-400 hover:text-blue-600"
        >
          <Plus size={13} /> Add task
        </button>
      </ChildGroupCell>
    </div>
  );
});

const TimelineChart = ({
  epics,
  rangeStart,
  rangeEnd,
  pxPerDay: pxPerDayProp,
  onPxPerDayChange,
  axisUnit = "month",
  fitToWidth = false,
  onSelectQuarter,
  selectedQuarterKey,
  projectId,
  workFlow,
  importance,
  onCommitDates,
  onChanged,
  hasMore,
  isFetchingMore,
  onLoadMore,
  highlightEpicId,
  onOpenTask,
}) => {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  // One inline create row serves both jobs. `parentEpic` is what tells them
  // apart: unset means a new epic on the chart, set means a task created
  // under that epic (which is what the row's "+" opens).
  const [createRow, setCreateRow] = useState(null);

  // Single popover shared by every bar. Only the id is stored; the epic, its
  // row and its bar geometry are derived during render, so the popover keeps
  // showing live data after an edit and follows the bar across zoom changes
  // and re-sorts instead of pointing at a stale snapshot.
  const [detailsId, setDetailsId] = useState(null);

  const { expanded, toggleEpic, refreshEpic, loadMoreChildren, pruneTo } = useEpicChildren();
  usePruneExpanded(epics, pruneTo);

  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;

  // How much room the chart actually has. Needed only for the quarter view,
  // but measured always: reading it lazily would mean the first quarter render
  // laid the axis out at the wrong width and then jumped.
  const [viewportWidth, setViewportWidth] = useState(0);
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const measure = () => setViewportWidth(scroller.clientWidth);
    measure();
    // Opening the task editor beside the chart, or collapsing the sidebar,
    // changes this width without a window resize, so the element itself is
    // what gets watched.
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  // The quarter view is a year overview: its whole point is that the four
  // quarter bars are on screen together, so its day width comes from the space
  // available rather than from the zoom preset. At the old fixed 4px/day a year
  // came out ~1460px wide, which pushed Q4 off the right edge - so the one
  // thing the view exists for needed a horizontal scroll to see. Two pixels of
  // slack keep the last column's border inside the viewport instead of leaving
  // a scrollbar behind for it.
  const pxPerDay = useMemo(() => {
    if (!fitToWidth || viewportWidth <= 0 || totalDays <= 0) return pxPerDayProp;
    return Math.max(MIN_PX_PER_DAY, (viewportWidth - LABEL_WIDTH - 2) / totalDays);
  }, [fitToWidth, viewportWidth, totalDays, pxPerDayProp]);

  const totalWidth = totalDays * pxPerDay;

  const axisColumns = useMemo(
    () => buildAxisColumns(rangeStart, rangeEnd, pxPerDay, axisUnit),
    [rangeStart, rangeEnd, pxPerDay, axisUnit]
  );

  // Only drawn when today actually falls inside the period being viewed.
  // Stepping back to an earlier quarter puts today past the right edge, which
  // would widen the scrollable area and leave a stray red line sitting in
  // empty space well beyond the last month.
  const today = new Date();
  const todayX = dateToX(today, rangeStart, pxPerDay);
  const showToday = today >= rangeStart && today <= rangeEnd;
  // Which quarter bar gets the red marker. A string, so the memoized header
  // does not re-render on every parent render the way a fresh Date would make
  // it. Only meaningful while quarter columns are on.
  const currentQuarterKey = axisUnit === "quarter" ? quarterKey(today) : null;

  const statusOptions = useMemo(
    () => (workFlow || []).map((s, i) => ({ id: i + 1, name: s.name, value: s.slug, color: s.color })),
    [workFlow]
  );
  const importanceOptions = useMemo(
    () => (importance || []).map((imp, i) => ({ id: i + 1, name: imp.name, value: imp.slug, color: imp.color })),
    [importance]
  );
  const statusBySlug = useMemo(() => {
    const map = new Map();
    (workFlow || []).forEach((s) => map.set(s.slug, s));
    return map;
  }, [workFlow]);

  // Epics and their expanded children flattened into one list, so a single
  // virtualizer covers both and child rows scroll as part of the same
  // surface. `epicRowById` carries each epic's laid-out position, which the
  // dependency overlay and the details popover need now that a row's offset
  // is no longer just index * height.
  const { rows, epicRowById, rowsHeight } = useMemo(() => {
    const list = [];
    const byId = new Map();
    let top = 0;

    for (let index = 0; index < epics.length; index++) {
      const epic = epics[index];
      const state = expanded.get(epic._id);
      const running = isRunningNow(epic, today);

      byId.set(epic._id, {
        index: list.length,
        epic,
        top,
        centerY: top + EPIC_ROW_HEIGHT / 2,
      });

      list.push({
        kind: "epic",
        key: epic._id,
        height: EPIC_ROW_HEIGHT,
        top,
        epic,
        running,
        expanded: !!state,
      });
      top += EPIC_ROW_HEIGHT;

      if (!state) continue;

      // Everything below belongs to one box. `groupStart` remembers where it
      // began so the first and last slices can be flagged once the group is
      // complete - which piece comes last depends on whether there is more to
      // load, so it can't be decided while pushing.
      const groupStart = list.length;
      const accent = getEpicTheme(epic.color).bar;
      const parentLeft = getBarGeometry(epic, rangeStart, pxPerDay)?.left || 0;

      for (const child of state.children) {
        list.push({
          kind: "child",
          key: `${epic._id}:${child._id}`,
          height: CHILD_ROW_HEIGHT,
          top,
          task: child,
          parentLeft,
          accent,
        });
        top += CHILD_ROW_HEIGHT;
      }

      if (state.loading || state.hasMore) {
        list.push({
          kind: "child-more",
          key: `${epic._id}:more`,
          height: CHILD_MORE_HEIGHT,
          top,
          epicId: epic._id,
          loading: state.loading,
          loaded: state.children.length,
          totalCount: state.totalCount,
          accent,
        });
        top += CHILD_MORE_HEIGHT;
      }

      // Held back only while the first page is still on its way, so the box
      // doesn't briefly show an empty "Add task" line before its tasks
      // arrive. Once anything is loaded it stays put, including while a
      // later page loads, so the group doesn't change height under a click.
      const isFirstLoad = state.loading && state.children.length === 0;
      if (!isFirstLoad) {
        list.push({
          kind: "child-add",
          key: `${epic._id}:add`,
          height: CHILD_ADD_HEIGHT,
          top,
          epic,
          accent,
        });
        top += CHILD_ADD_HEIGHT;
      }

      if (list.length > groupStart) {
        list[groupStart].isGroupStart = true;
        list[list.length - 1].isGroupEnd = true;
      }
    }

    return { rows: list, epicRowById: byId, rowsHeight: top };
    // `today` is a fresh Date every render but only feeds a same-day
    // comparison, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epics, expanded, rangeStart, pxPerDay]);

  const detailsRow = detailsId ? epicRowById.get(detailsId) : null;
  const detailsEpic = detailsRow?.epic || null;
  const detailsGeometry = useMemo(
    () => (detailsEpic ? getBarGeometry(detailsEpic, rangeStart, pxPerDay) : null),
    [detailsEpic, rangeStart, pxPerDay]
  );

  // Searching or deleting can drop the open epic out of the list; without
  // this the popover would hang around pointing at a row that isn't there.
  useEffect(() => {
    if (detailsId && !detailsRow) setDetailsId(null);
  }, [detailsId, detailsRow]);

  // The rows live below the sticky header, but the element that actually
  // scrolls is the outer container. scrollMargin tells
  // the virtualizer about that offset so the mounted window lines up with
  // what is really on screen. Measured against the scroll container rather
  // than via offsetTop, which would silently return a wrong value if the
  // container ever stopped being the offsetParent.
  const [trackOffset, setTrackOffset] = useState(0);
  useLayoutEffect(() => {
    const track = trackRef.current;
    const scroller = scrollRef.current;
    if (!track || !scroller) return;
    const offset =
      track.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    setTrackOffset(offset);
  }, []);

  // Row heights are exact and known up front, so the virtualizer never has to
  // measure DOM nodes. It reads them through a ref because estimateSize is
  // captured once, and expanding a row changes what index N is.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => rowsRef.current[index]?.height ?? EPIC_ROW_HEIGHT,
    getItemKey: (index) => rowsRef.current[index]?.key ?? index,
    // Each mounted row is a full-timeline-width element with a sticky label
    // cell, so extra rows are not free. Four either side is enough to keep a
    // normal scroll from showing gaps.
    overscan: 4,
    scrollMargin: trackOffset,
  });

  // Expanding or collapsing changes the height of rows the virtualizer has
  // already cached, so the cache has to be thrown away for the new layout to
  // be picked up.
  useEffect(() => {
    rowVirtualizer.measure();
  }, [rows, rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const visibleFrom = virtualItems.length ? virtualItems[0].index : 0;
  const visibleTo = virtualItems.length ? virtualItems[virtualItems.length - 1].index : 0;

  // Pull the next page once the user scrolls within a few rows of the end of
  // what's loaded. onLoadMore is already guarded against overlapping calls.
  useEffect(() => {
    if (!hasMore || isFetchingMore || !onLoadMore) return;
    if (!virtualItems.length) return;
    if (visibleTo >= rows.length - 5) onLoadMore();
  }, [visibleTo, virtualItems.length, rows.length, hasMore, isFetchingMore, onLoadMore]);

  // Clicking a card in the "running now" strip brings that epic's lane into
  // view, both down the list and across the axis.
  useEffect(() => {
    if (!highlightEpicId) return;
    const row = epicRowById.get(highlightEpicId);
    if (!row) return;
    rowVirtualizer.scrollToIndex(row.index, { align: "center" });

    const geometry = getBarGeometry(row.epic, rangeStart, pxPerDay);
    const scroller = scrollRef.current;
    if (geometry && scroller) {
      scroller.scrollTo({ left: Math.max(0, geometry.left - 120), behavior: "smooth" });
    }
    // Re-running on zoom/data changes would yank the scroll position back
    // every time the user moves the chart, so this fires on a new pick only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightEpicId]);

  const openCreateRow = useCallback((defaults) => {
    setCreateRow({ workType: "epic", defaults: defaults || {}, parentEpic: null });
  }, []);

  // The "+" on an epic row. The new task starts on the epic's own dates so it
  // lands on the chart straight away instead of sitting date-less at the far
  // left; the dates are normalised because the server can send them back as
  // timestamps and the create mutation wants a real date value.
  const handleAddChild = useCallback((epic) => {
    const defaults = { parentId: epic._id };
    if (epic.startDate) defaults.startDate = new Date(epic.startDate).toISOString();
    if (epic.dueDate) defaults.dueDate = new Date(epic.dueDate).toISOString();
    setCreateRow({ workType: "task", defaults, parentEpic: epic });
  }, []);

  const closeCreateRow = useCallback(() => setCreateRow(null), []);

  const handleCreated = useCallback(() => {
    const parentEpicId = createRow?.parentEpic?._id;
    setCreateRow(null);
    // Opens the epic (or re-reads it if it was already open) so the task that
    // was just added is visible under it without another click.
    if (parentEpicId) refreshEpic(parentEpicId);
    onChanged?.();
  }, [createRow, refreshEpic, onChanged]);

  const handleTrackClick = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const start = xToDate(x, rangeStart, pxPerDay);
    const due = addDays(start, 13);
    openCreateRow({ startDate: start.toISOString(), dueDate: due.toISOString() });
  }, [rangeStart, pxPerDay, openCreateRow]);

  // Dragging the edge of any month column zooms the whole timeline: every
  // column shares one pxPerDay, so widening one widens all of them together
  // and keeps bars proportional across month boundaries. The dragged
  // column's own width/days ratio is what gets turned back into pxPerDay, so
  // its right edge tracks the pointer most closely.
  const columnResizeDetachRef = useRef(null);
  const startColumnResize = useCallback((col) => (e) => {
    if (!onPxPerDayChange) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX;
    const startWidth = col.width;
    let rafId = null;

    const detach = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      columnResizeDetachRef.current = null;
    };

    function handleMove(moveEvent) {
      const deltaPx = moveEvent.clientX - startClientX;
      const nextWidth = Math.max(col.days * MIN_PX_PER_DAY, startWidth + deltaPx);
      const nextPxPerDay = Math.min(MAX_PX_PER_DAY, Math.max(MIN_PX_PER_DAY, nextWidth / col.days));
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => onPxPerDayChange(nextPxPerDay));
    }
    function handleUp() {
      detach();
    }

    columnResizeDetachRef.current = detach;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [onPxPerDayChange]);

  useEffect(() => () => columnResizeDetachRef.current?.(), []);

  // Stable identity keeps the memoized bars from re-rendering on every
  // parent state change.
  const handleOpenDetails = useCallback((epicId) => setDetailsId(epicId), []);
  const handleDetailsOpenChange = useCallback((open) => {
    if (!open) setDetailsId(null);
  }, []);
  const closeDetails = useCallback(() => setDetailsId(null), []);

  return (
    <div className="flex flex-col h-full min-w-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative bg-white [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-400 [&::-webkit-scrollbar-corner]:bg-transparent"
      >
        <div style={{ width: LABEL_WIDTH + totalWidth, minWidth: "100%" }}>
          <div className="flex sticky top-0 z-20 bg-white border-b border-neutral-200">
            <div
              className="shrink-0 border-r border-neutral-200 bg-white sticky left-0 z-30 flex items-center gap-2 pl-4 pr-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400"
              style={{ width: LABEL_WIDTH, height: HEADER_HEIGHT }}
            >
              <span className="flex-1">Epic</span>
              {/* Same action as the "Add epic" row at the bottom of the list,
                  put where it stays reachable. The bottom row scrolls away
                  once a project has more epics than fit on screen. */}
              <TooltipWrapper content="Create epic" direction="bottom">
                <button
                  type="button"
                  onClick={() => openCreateRow(null)}
                  className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </TooltipWrapper>
            </div>
            <div className="relative" style={{ width: totalWidth, height: HEADER_HEIGHT }}>
              <AxisHeaderColumns
                axisColumns={axisColumns}
                todayX={todayX}
                showToday={showToday}
                onResizeStart={startColumnResize}
                onSelectQuarter={onSelectQuarter}
                selectedQuarterKey={selectedQuarterKey}
                currentQuarterKey={currentQuarterKey}
              />
            </div>
          </div>

          <div className="relative" ref={trackRef}>
            {showToday && (
              <div
                className="absolute top-0 w-px bg-rose-400 z-10 pointer-events-none"
                style={{ left: LABEL_WIDTH + todayX, height: rowsHeight + EPIC_ROW_HEIGHT }}
              />
            )}

            {/* Spacer sized to the full list; only the windowed rows below are mounted. */}
            <div className="relative" style={{ height: rowsHeight }}>
              {/* Faint vertical gridlines at each column boundary so a bar's
                  position on the axis is readable at a glance, not just at
                  the header. Drawn once (not per row) since it never depends
                  on scroll position. */}
              <div
                className="absolute top-0 pointer-events-none"
                style={{ left: LABEL_WIDTH, width: totalWidth, height: rowsHeight }}
              >
                <AxisGridLines axisColumns={axisColumns} selectedQuarterKey={selectedQuarterKey} />
              </div>

              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                const top = virtualRow.start - rowVirtualizer.options.scrollMargin;

                if (row.kind === "epic") {
                  return (
                    <EpicRow
                      key={row.key}
                      epic={row.epic}
                      top={top}
                      totalWidth={totalWidth}
                      rangeStart={rangeStart}
                      pxPerDay={pxPerDay}
                      isRunning={row.running}
                      isExpanded={row.expanded}
                      isHighlighted={row.epic._id === highlightEpicId}
                      onToggle={toggleEpic}
                      onAddChild={handleAddChild}
                      onCommitDates={onCommitDates}
                      onOpenDetails={handleOpenDetails}
                      onOpenTask={onOpenTask}
                    />
                  );
                }

                if (row.kind === "child") {
                  const status = statusBySlug.get(row.task.task_status);
                  return (
                    <ChildRow
                      key={row.key}
                      task={row.task}
                      top={top}
                      totalWidth={totalWidth}
                      rangeStart={rangeStart}
                      pxPerDay={pxPerDay}
                      parentLeft={row.parentLeft}
                      statusColor={status?.color}
                      statusName={status?.name}
                      accent={row.accent}
                      isGroupStart={row.isGroupStart}
                      isGroupEnd={row.isGroupEnd}
                      onOpenTask={onOpenTask}
                    />
                  );
                }

                if (row.kind === "child-add") {
                  return (
                    <ChildAddRow key={row.key} row={row} top={top} onAddChild={handleAddChild} />
                  );
                }

                return (
                  <ChildMoreRow key={row.key} row={row} top={top} onLoadMore={loadMoreChildren} />
                );
              })}

              <div
                className="absolute top-0 pointer-events-none"
                style={{ left: LABEL_WIDTH, width: totalWidth, height: rowsHeight }}
              >
                <DependencyLines
                  epics={epics}
                  rangeStart={rangeStart}
                  pxPerDay={pxPerDay}
                  epicRowById={epicRowById}
                  totalHeight={rowsHeight}
                  visibleFrom={visibleFrom}
                  visibleTo={visibleTo}
                />
              </div>

              {/* Anchor for the one shared details popover. Its top comes from
                  the same layout pass that placed the row, so it always lands
                  on the row the bar belongs to even when rows above it are
                  expanded. */}
              {detailsEpic && detailsGeometry && (
                <Popover open onOpenChange={handleDetailsOpenChange}>
                  <PopoverAnchor asChild>
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: LABEL_WIDTH + detailsGeometry.left,
                        top: detailsRow.top,
                        width: Math.max(detailsGeometry.width, 1),
                        height: EPIC_ROW_HEIGHT,
                      }}
                    />
                  </PopoverAnchor>
                  <PopoverContent align="start" className="p-3" hideWhenDetached>
                    <EpicDetailsPopover
                      epic={detailsEpic}
                      allEpics={epics}
                      onChanged={onChanged}
                      onClose={closeDetails}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {hasMore && (
              <div
                className="sticky left-0 flex items-center gap-2 px-4 text-[11px] font-medium text-neutral-400 border-b border-neutral-200 bg-white"
                style={{ width: LABEL_WIDTH, height: 32 }}
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Loading more epics…
                  </>
                ) : (
                  "Scroll for more epics"
                )}
              </div>
            )}

            {!createRow && (
              <div className="flex border-b border-neutral-200" style={{ height: EPIC_ROW_HEIGHT }}>
                <div
                  className="shrink-0 sticky left-0 bg-white border-r border-neutral-200 z-10"
                  style={{ width: LABEL_WIDTH }}
                >
                  <button
                    type="button"
                    onClick={() => openCreateRow(null)}
                    className="flex items-center gap-1.5 h-full w-full px-4 text-sm font-medium text-neutral-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                  >
                    <Plus size={15} /> Add epic
                  </button>
                </div>
                <div
                  className="relative flex-1 cursor-cell hover:bg-blue-50/40 transition-colors"
                  style={{ width: totalWidth }}
                  onClick={handleTrackClick}
                  title="Click to add an epic starting here"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {createRow && (
        <div className="border-t border-neutral-200 bg-white">
          {createRow.parentEpic && (
            <div className="px-3 pt-2 sm:px-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              New task in{" "}
              <span className="text-neutral-600 normal-case">{createRow.parentEpic.summary}</span>
            </div>
          )}
          <InlineCreateTaskRow
            projectId={projectId}
            workType={createRow.workType}
            statusOptions={statusOptions}
            importanceOptions={importanceOptions}
            extraVariables={createRow.defaults}
            onClose={closeCreateRow}
            onCreated={handleCreated}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(TimelineChart);
