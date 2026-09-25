import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { ChevronDown, ChevronRight, Flag, Loader2, Maximize2, Plus, SlidersHorizontal } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import EpicBar from "./EpicBar";
import ChildTaskBar from "./ChildTaskBar";
import EpicDetailsPopover from "./EpicDetailsPopover";
import EpicTasksDialog from "./EpicTasksDialog";
import SprintMarkers, { SprintBoundaries } from "./SprintMarkers";
import DependencyLines from "./DependencyLines";
import InlineCreateTaskRow from "@/components/data-table/inline-create-task-row";
import ManageAvatar from "@/components/common/ManageAvatar";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import { cn } from "@/lib/utils";
import { getEpicTheme, getStatusColorProps } from "./epicColors";
import { useEpicChildren, usePruneExpanded } from "./useEpicChildren";
import {
  buildAxisColumns,
  quarterKey,
  dateToX,
  xToDate,
  formatTaskDateRange,
  getBarGeometry,
  isRunningNow,
  layoutSprints,
  MIN_PX_PER_DAY,
  MAX_PX_PER_DAY,
  SPRINT_LANE_HEIGHT,
} from "./timelineDate";

const EPIC_ROW_HEIGHT = 56;
// Child rows are only a little shorter than an epic row. They carry a real
// bar with a readable label inside it, so squeezing them into a thin strip
// made the tasks under an epic hard to read and hard to hit with a pointer.
// The label cell holds two lines - name on top, status and dates below - and
// that is what this height is set for.
const CHILD_ROW_HEIGHT = 46;
const CHILD_MORE_HEIGHT = 34;
// The "add a task" line that closes off an epic's group.
const CHILD_ADD_HEIGHT = 36;
const LABEL_WIDTH = 288;
const HEADER_HEIGHT = 44;

// A finished task is drawn muted with a tick instead of a status dot. Projects
// name this step themselves, so both the slug and the label are checked.
const DONE_STATUS_WORDS = new Set(["done", "complete", "completed", "closed"]);

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
  onOpenAllTasks,
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
      <TooltipWrapper
        content={childCount === 0 ? "No child tasks" : isExpanded ? "Hide tasks" : "Show tasks"}
      >
        {/* aria-disabled instead of disabled: a disabled button receives no
            pointer events, so the tooltip that explains why it does nothing
            would never open. The click is guarded instead. */}
        <button
          type="button"
          onClick={() => { if (childCount > 0) onToggle(epic._id); }}
          aria-disabled={childCount === 0}
          className={cn(
            "shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 transition-colors",
            childCount === 0 ? "opacity-25 cursor-default" : "hover:bg-neutral-200 hover:text-neutral-700"
          )}
        >
          <ChevronRight size={15} className={cn("transition-transform duration-150", isExpanded && "rotate-90")} />
        </button>
      </TooltipWrapper>

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

      {/* Opens the epic's whole task list in a dialog. The rows under a bar
          are a peek - a narrow label column, 25 tasks at a time - so an epic
          with more than a screenful of work needs somewhere with room to read
          it properly. Only offered when there is something to open. */}
      {childCount > 0 && (
        <TooltipWrapper content={`View all ${childCount} tasks`}>
          <button
            type="button"
            onClick={() => onOpenAllTasks(epic._id)}
            aria-label={`View all ${childCount} tasks`}
            className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 opacity-0 focus:opacity-100 group-hover/row:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-opacity"
          >
            <Maximize2 size={13} />
          </button>
        </TooltipWrapper>
      )}

      {/* Adds a task under this epic. Hidden until the row is hovered (or the
          button itself is focused, so it stays reachable from the keyboard)
          because one always-on icon per row turns the label column into a
          wall of plus signs. */}
      <TooltipWrapper content="Add a task to this epic">
        <button
          type="button"
          onClick={() => onAddChild(epic)}
          aria-label="Add a task to this epic"
          className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 opacity-0 focus:opacity-100 group-hover/row:opacity-100 hover:bg-blue-50 hover:text-blue-600 transition-opacity"
        >
          <Plus size={15} />
        </button>
      </TooltipWrapper>

      {/* Colour and dependencies live in their own small popover; the bar
          itself now opens the full editor instead. */}
      <TooltipWrapper content="Colour and dependencies">
        <button
          type="button"
          onClick={() => onOpenDetails(epic._id)}
          aria-label="Colour and dependencies"
          className="shrink-0 h-6 w-6 grid place-items-center rounded-md text-neutral-400 opacity-0 focus:opacity-100 group-hover/row:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 transition-opacity"
        >
          <SlidersHorizontal size={14} />
        </button>
      </TooltipWrapper>

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

// The branch drawn down the left of everything under an expanded epic: a line
// in the parent epic's colour with a short elbow into each row, so a run of
// tasks reads as hanging off the bar above it. The last row of a group stops
// its line at the elbow, which closes the branch the way a tree view does.
//
// Every row draws its own piece rather than a real container wrapping the
// group. Only a window of rows is ever mounted, so a container would have to
// be as tall as the whole group whether or not any of it is on screen - the
// same mistake the dependency overlay used to make.
const ChildRail = React.memo(function ChildRail({ theme, isGroupEnd }) {
  return (
    <span className="relative shrink-0 w-5 self-stretch" aria-hidden="true">
      <span
        className={cn(
          "absolute left-1.5 top-0 w-[2px] rounded-full opacity-60",
          theme.bar,
          // Stops level with the elbow on the closing row, so the branch ends
          // in an "L" instead of running past its last item.
          isGroupEnd ? "h-[calc(50%_+_1px)]" : "h-full"
        )}
      />
      <span
        className={cn(
          "absolute left-1.5 top-1/2 h-[2px] w-2.5 -translate-y-1/2 rounded-full opacity-60",
          theme.bar
        )}
      />
    </span>
  );
});

// The sticky label cell shared by a child row, its "show more" line and its
// "add task" line, so all three sit on the same rail and the same indent.
//
// The background has to be fully opaque: this cell is what the bars slide
// behind when the chart is scrolled sideways.
const ChildGroupCell = React.memo(function ChildGroupCell({
  theme,
  isGroupEnd,
  children,
}) {
  return (
    <div
      className="shrink-0 sticky left-0 z-10 flex items-stretch gap-1.5 border-r border-neutral-200 bg-neutral-50 pl-4 pr-2.5 transition-colors group-hover/child:bg-blue-50"
      style={{ width: LABEL_WIDTH }}
    >
      <ChildRail theme={theme} isGroupEnd={isGroupEnd} />
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
});

// One child task in the label column. Two lines, because a single line of
// "dot, key, name" left most of a 46px row empty and told the reader nothing
// they could act on: the status, the dates and who owns it were all only
// available by opening the task.
const ChildRowLabel = React.memo(function ChildRowLabel({
  task,
  status,
  workTypeMeta,
  theme,
  isGroupEnd,
}) {
  const taskKey = task.project_key && task.taskNumber ? `${task.project_key}-${task.taskNumber}` : null;
  const dateLabel = useMemo(
    () => formatTaskDateRange(task.startDate, task.dueDate),
    [task.startDate, task.dueDate]
  );
  const [firstName, lastName] = useMemo(
    () => (task.assigneeDetail?.name || "").split(" "),
    [task.assigneeDetail?.name]
  );
  const dot = getStatusColorProps(status?.color);
  const isDone = !!status?.isDone;

  return (
    <ChildGroupCell theme={theme} isGroupEnd={isGroupEnd}>
      {/* The same work type icon the backlog rows use, so a bug under an epic
          is recognisable here without reading anything. */}
      {workTypeMeta?.icon ? (
        <TooltipWrapper content={workTypeMeta.name}>
          <span
            className={cn(
              "shrink-0 grid h-[18px] w-[18px] place-items-center rounded-md",
              workTypeMeta.color || "bg-neutral-300"
            )}
          >
            <img
              src={workTypeMeta.icon}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-2.5 w-2.5 filter brightness-0 invert"
            />
          </span>
        </TooltipWrapper>
      ) : (
        <span
          style={dot.style}
          className={cn("h-2 w-2 shrink-0 rounded-full", dot.className)}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {taskKey && (
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">
              {taskKey}
            </span>
          )}
          {/* The line is truncated to fit the label column, so the tooltip is
              often the only way to read the whole name. */}
          <TooltipWrapper content={task.summary}>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[12.5px] font-medium leading-tight",
                isDone ? "text-neutral-400 line-through" : "text-neutral-800"
              )}
            >
              {task.summary}
            </span>
          </TooltipWrapper>
          {task.isFlagged && (
            <Flag size={10} className="shrink-0 text-rose-500" fill="currentColor" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <TooltipWrapper content={status?.name || "No status"}>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-wide text-neutral-500 ring-1 ring-neutral-200">
              <span
                style={dot.style}
                className={cn("h-1.5 w-1.5 rounded-full", dot.className)}
              />
              <span className="max-w-[72px] truncate">{status?.name || "No status"}</span>
            </span>
          </TooltipWrapper>
          <span
            className={cn(
              "truncate text-[10px] leading-none",
              dateLabel ? "text-neutral-400" : "text-neutral-300 italic"
            )}
          >
            {dateLabel || "No dates"}
          </span>
        </div>
      </div>

      {task.assigneeDetail?._id && (
        <span className="shrink-0">
          {/* The avatar carries the project tooltip itself, so the name is
              shown the same way here as on the epic row above. */}
          <ManageAvatar
            firstName={firstName}
            lastName={lastName}
            size="xs"
            showTooltip
            tooltipContent={task.assigneeDetail.name}
          />
        </span>
      )}
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
              <TooltipWrapper
                direction="bottom"
                content={
                  isSelected
                    ? `${col.label} (${col.sublabel}) is being shown`
                    : `Show the epics of ${col.label} (${col.sublabel})`
                }
              >
                <button
                  type="button"
                  onClick={() => onSelectQuarter(col.start)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-full w-full min-w-0 flex flex-col justify-center px-3 pb-1.5 text-left leading-tight transition-colors",
                    !isSelected && "hover:bg-blue-50/50 hover:text-blue-600"
                  )}
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

                  {/* Every quarter carries a bar along the bottom of its
                      column, so the four of them read as a row of bars you can
                      click, not just column headings. The running quarter's is
                      red - it marks all three of its months rather than only
                      the single day the today line sits on - the selected
                      one's is blue, and the rest stay grey until hovered. */}
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
              </TooltipWrapper>
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
              <TooltipWrapper
                direction="bottom"
                content="Drag to zoom the timeline (all columns scale together)"
              >
                <div
                  className="absolute inset-y-0 -right-1 w-2 cursor-ew-resize z-10 flex justify-center"
                  onPointerDown={onResizeStart(col)}
                >
                  <div className="w-0.5 h-full bg-transparent group-hover/col:bg-blue-400/70 group-active/col:bg-blue-500" />
                </div>
              </TooltipWrapper>
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
  onOpenAllTasks,
  onOpenTask,
}) {
  return (
    <div
      className={cn(
        "group/row flex absolute left-0 w-full",
        // An open epic keeps no line between itself and its first task, so the
        // epic and the branch below it read as one block rather than as a row
        // that happens to be followed by some others.
        !isExpanded && "border-b border-neutral-200"
      )}
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
        onOpenAllTasks={onOpenAllTasks}
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
// alike) so a task with no dates - which draws nothing on the track at all -
// is just as easy to open as one with a bar.
//
// `group/child` is what ties the two halves together: hovering anywhere on the
// row tints the label cell and lights up the bar, even though the two are far
// apart on screen. The tint itself is only ever applied to the 288px label
// cell and to the bar, never to this element, which is as wide as the whole
// timeline - up to twenty thousand pixels - and would repaint that entire strip
// twice for every pointer move between rows.
//
// No bottom border except on the last row of a group: the rail is what ties
// the rows together, and a line under each one cut the branch into slices.
const ChildRow = React.memo(function ChildRow({
  task,
  top,
  totalWidth,
  rangeStart,
  pxPerDay,
  status,
  workTypeMeta,
  theme,
  isGroupEnd,
  onOpenTask,
}) {
  return (
    <div
      className={cn(
        "group/child flex absolute left-0 w-full bg-neutral-50/40 cursor-pointer",
        isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_ROW_HEIGHT, top }}
      onClick={() => onOpenTask(task._id)}
    >
      <ChildRowLabel
        task={task}
        status={status}
        workTypeMeta={workTypeMeta}
        theme={theme}
        isGroupEnd={isGroupEnd}
      />
      <div className="relative flex-1 overflow-hidden" style={{ width: totalWidth }}>
        <ChildTaskBar
          task={task}
          rangeStart={rangeStart}
          pxPerDay={pxPerDay}
          status={status}
          theme={theme}
        />
      </div>
    </div>
  );
});

// "Show the rest" / "Loading tasks", sitting on the same rail as the tasks.
const ChildMoreRow = React.memo(function ChildMoreRow({
  row,
  top,
  onLoadMore,
}) {
  const remaining = row.totalCount ? Math.max(row.totalCount - row.loaded, 0) : 0;

  return (
    <div
      className={cn(
        "group/child flex absolute left-0 w-full bg-neutral-50/40",
        row.isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_MORE_HEIGHT, top }}
    >
      <ChildGroupCell theme={row.theme} isGroupEnd={row.isGroupEnd}>
        {row.loading ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Loader2 size={11} className="animate-spin" /> Loading tasks…
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onLoadMore(row.epicId)}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-blue-600 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <ChevronDown size={12} />
            {remaining ? `Show ${remaining} more` : "Show more tasks"}
          </button>
        )}
      </ChildGroupCell>
    </div>
  );
});

// The line that closes the branch off. Adding a task from here is the same
// action as the "+" on the epic row above, put where someone reading the list
// of tasks is already looking - and so is opening the full list, which is
// most wanted exactly here, at the bottom of a group that only shows part of
// the epic.
const ChildAddRow = React.memo(function ChildAddRow({ row, top, onAddChild, onOpenAllTasks }) {
  const childCount = row.epic.totalChildren || 0;

  return (
    <div
      className={cn(
        "group/child flex absolute left-0 w-full bg-neutral-50/40",
        row.isGroupEnd && "border-b border-neutral-200"
      )}
      style={{ height: CHILD_ADD_HEIGHT, top }}
    >
      <ChildGroupCell theme={row.theme} isGroupEnd={row.isGroupEnd}>
        <button
          type="button"
          onClick={() => onAddChild(row.epic)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-neutral-300 bg-white px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus size={12} /> Add task
        </button>

        {childCount > 0 && (
          <TooltipWrapper content={`View all ${childCount} tasks`}>
            <button
              type="button"
              onClick={() => onOpenAllTasks(row.epic._id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              <Maximize2 size={11} /> View all
            </button>
          </TooltipWrapper>
        )}
      </ChildGroupCell>
    </div>
  );
});

const TimelineChart = ({
  epics,
  sprints,
  showSprints = false,
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
  workType,
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

  // Which epic's full task list is open, held the same way and for the same
  // reason. The dialog is mounted only while this is set, so an epic that was
  // never opened costs nothing.
  const [allTasksId, setAllTasksId] = useState(null);

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

  // Sprint pills for the band under the axis, and the boundaries they drop
  // down the rows. Worked out even while the band is switched off, because the
  // list is short and the layout is cheap next to re-running it the moment
  // somebody turns it back on.
  const sprintLayout = useMemo(
    () => layoutSprints(sprints, rangeStart, rangeEnd, pxPerDay),
    [sprints, rangeStart, rangeEnd, pxPerDay]
  );
  const sprintBandOn = showSprints && sprintLayout.items.length > 0;
  const sprintBandHeight = sprintBandOn ? sprintLayout.laneCount * SPRINT_LANE_HEIGHT : 0;

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
  // The quarter view says "we are here" with the red bar and the "Now" chip on
  // the running quarter, so the floating "Today" pill would only be a third
  // copy of the same fact sitting on top of that quarter's label. The thin
  // today line down the rows stays either way.
  const showTodayBadge = showToday && axisUnit !== "quarter";

  const statusOptions = useMemo(
    () => (workFlow || []).map((s, i) => ({ id: i + 1, name: s.name, value: s.slug, color: s.color })),
    [workFlow]
  );
  const importanceOptions = useMemo(
    () => (importance || []).map((imp, i) => ({ id: i + 1, name: imp.name, value: imp.slug, color: imp.color })),
    [importance]
  );
  // One entry per workflow step, built once. Child rows read their status from
  // here, so the name, the dot colour and "is this finished" are worked out for
  // the whole project instead of per row, and the object handed to a row keeps
  // the same identity across scroll frames - which is what lets the memoized
  // rows bail out of re-rendering.
  const statusBySlug = useMemo(() => {
    const map = new Map();
    (workFlow || []).forEach((s) => {
      const slug = (s.slug || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      map.set(s.slug, {
        name: s.name,
        color: s.color,
        isDone: DONE_STATUS_WORDS.has(slug) || DONE_STATUS_WORDS.has(name),
      });
    });
    return map;
  }, [workFlow]);

  // Work type (task, bug, story…) icons, keyed the same way, for the small
  // badge on each child row.
  const workTypeBySlug = useMemo(() => {
    const map = new Map();
    (workType || []).forEach((w) => map.set(w.slug, w));
    return map;
  }, [workType]);

  // Priority names and colours, for the epic's task dialog. The chart's own
  // rows have no room for this column, so nothing else reads it.
  const importanceBySlug = useMemo(() => {
    const map = new Map();
    (importance || []).forEach((imp) => map.set(imp.slug, imp));
    return map;
  }, [importance]);

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

      // Everything below belongs to one branch. `groupStart` remembers where it
      // began so the first and last pieces can be flagged once the group is
      // complete - which piece comes last depends on whether there is more to
      // load, so it can't be decided while pushing.
      const groupStart = list.length;
      // The whole theme, not just the bar colour: the rail, the child bars and
      // their borders all come from it. Themes are a fixed lookup table, so the
      // object below is shared by every row of the group and stays the same
      // across renders.
      const theme = getEpicTheme(epic.color);

      for (const child of state.children) {
        list.push({
          kind: "child",
          key: `${epic._id}:${child._id}`,
          height: CHILD_ROW_HEIGHT,
          top,
          task: child,
          theme,
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
          theme,
        });
        top += CHILD_MORE_HEIGHT;
      }

      // Held back only while the first page is still on its way, so the group
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
          theme,
        });
        top += CHILD_ADD_HEIGHT;
      }

      // Only the last piece is flagged: it is the one that stops the rail and
      // closes the group off with a line.
      if (list.length > groupStart) {
        list[list.length - 1].isGroupEnd = true;
      }
    }

    return { rows: list, epicRowById: byId, rowsHeight: top };
    // `today` is a fresh Date every render but only feeds a same-day
    // comparison, so it is deliberately not a dependency.
    //
    // Neither is the zoom. This pass places rows vertically only; the one
    // thing here that read the axis was the date-less task marker, and that
    // is gone, so zooming no longer rebuilds the whole row list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epics, expanded]);

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

  // Read live off the current list for the same reason, so an epic renamed or
  // rescheduled while its task dialog is open shows the new values in the
  // dialog header too.
  const allTasksEpic = allTasksId ? epicRowById.get(allTasksId)?.epic || null : null;
  useEffect(() => {
    if (allTasksId && !allTasksEpic) setAllTasksId(null);
  }, [allTasksId, allTasksEpic]);

  // The rows live below the sticky header, but the element that actually
  // scrolls is the outer container. scrollMargin tells
  // the virtualizer about that offset so the mounted window lines up with
  // what is really on screen. Measured against the scroll container rather
  // than via offsetTop, which would silently return a wrong value if the
  // container ever stopped being the offsetParent.
  const [trackOffset, setTrackOffset] = useState(0);
  // Re-measured whenever the header changes height, which is what turning the
  // sprint band on and off does. Left at its first value, every mounted row
  // would sit one band's worth away from where the virtualizer thinks it is.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const scroller = scrollRef.current;
    if (!track || !scroller) return;
    const offset =
      track.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    setTrackOffset(offset);
  }, [sprintBandHeight]);

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

  // Nothing to drag in the quarter view: its width is pinned to the viewport
  // so the year keeps fitting, and a handle there would be pulling against a
  // value that gets recomputed straight back.
  const resizeHandler = fitToWidth ? null : startColumnResize;

  useEffect(() => () => columnResizeDetachRef.current?.(), []);

  // Stable identity keeps the memoized bars from re-rendering on every
  // parent state change.
  const handleOpenDetails = useCallback((epicId) => setDetailsId(epicId), []);
  const handleDetailsOpenChange = useCallback((open) => {
    if (!open) setDetailsId(null);
  }, []);
  const closeDetails = useCallback(() => setDetailsId(null), []);

  const handleOpenAllTasks = useCallback((epicId) => setAllTasksId(epicId), []);
  const closeAllTasks = useCallback(() => setAllTasksId(null), []);

  // A task added or edited inside the dialog. The dialog keeps its own list up
  // to date; the chart behind it still holds the old rows under that epic and
  // the old x/y count on its label, so both are refreshed here.
  //
  // Creating calls this straight away - a new task should appear on the chart
  // at once. Edits call it once, as the dialog closes, rather than on every
  // dropdown, so a run of small changes is one refetch instead of ten.
  const handleDialogDataChanged = useCallback(() => {
    if (allTasksId) refreshEpic(allTasksId);
    onChanged?.();
  }, [allTasksId, refreshEpic, onChanged]);

  return (
    <div className="flex flex-col h-full min-w-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative bg-white [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-400 [&::-webkit-scrollbar-corner]:bg-transparent"
      >
        <div style={{ width: LABEL_WIDTH + totalWidth, minWidth: "100%" }}>
          {/* The whole header is one sticky block so the axis and the sprint
              band below it stay together while the rows scroll under them. */}
          <div className="sticky top-0 z-20 bg-white border-b border-neutral-200">
            <div className="flex">
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
                  showToday={showTodayBadge}
                  onResizeStart={resizeHandler}
                  onSelectQuarter={onSelectQuarter}
                  selectedQuarterKey={selectedQuarterKey}
                  currentQuarterKey={currentQuarterKey}
                />
              </div>
            </div>

            {/* The delivery cycles the dates above belong to. A roadmap in a
                scrum team is read against sprint boundaries, so without this
                the reader has to work out from a month label which cycle a bar
                lands in. Only drawn when the project actually has sprints in
                the period on screen. */}
            {sprintBandOn && (
              <div className="flex border-t border-neutral-200/80 bg-neutral-50/50">
                <div
                  className="shrink-0 border-r border-neutral-200 bg-white sticky left-0 z-30 flex items-center pl-4 pr-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
                  style={{ width: LABEL_WIDTH, height: sprintBandHeight }}
                >
                  Sprints
                </div>
                <div className="relative" style={{ width: totalWidth, height: sprintBandHeight }}>
                  <SprintMarkers items={sprintLayout.items} />
                </div>
              </div>
            )}
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
                {/* Sits in the same layer as the month gridlines, so a sprint
                    edge that falls on a month edge draws one line, not two
                    side by side. */}
                {sprintBandOn && (
                  <SprintBoundaries items={sprintLayout.items} height={rowsHeight} />
                )}
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
                      onOpenAllTasks={handleOpenAllTasks}
                      onOpenTask={onOpenTask}
                    />
                  );
                }

                if (row.kind === "child") {
                  return (
                    <ChildRow
                      key={row.key}
                      task={row.task}
                      top={top}
                      totalWidth={totalWidth}
                      rangeStart={rangeStart}
                      pxPerDay={pxPerDay}
                      status={statusBySlug.get(row.task.task_status)}
                      workTypeMeta={workTypeBySlug.get(row.task.work_type)}
                      theme={row.theme}
                      isGroupEnd={row.isGroupEnd}
                      onOpenTask={onOpenTask}
                    />
                  );
                }

                if (row.kind === "child-add") {
                  return (
                    <ChildAddRow
                      key={row.key}
                      row={row}
                      top={top}
                      onAddChild={handleAddChild}
                      onOpenAllTasks={handleOpenAllTasks}
                    />
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
                {/* The strip is as wide as the whole chart, and Radix places a
                    tooltip against the middle of its trigger, so the hint is
                    anchored to the row rather than to the pointer. It still
                    lands inside the viewport, which is enough for a one-line
                    hint on a click target this large. */}
                <TooltipWrapper content="Click to add an epic starting here">
                  <div
                    className="relative flex-1 cursor-cell hover:bg-blue-50/40 transition-colors"
                    style={{ width: totalWidth }}
                    onClick={handleTrackClick}
                  />
                </TooltipWrapper>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mounted only while an epic's list is open, so the dialog's own query
          (and the tasks it holds) exist for exactly as long as it is on
          screen. Outside the scrolling container: it is a modal over the whole
          page, not part of the chart surface. */}
      {allTasksEpic && (
        <EpicTasksDialog
          epic={allTasksEpic}
          workFlow={workFlow}
          statusBySlug={statusBySlug}
          workTypeBySlug={workTypeBySlug}
          importanceBySlug={importanceBySlug}
          projectId={projectId}
          statusOptions={statusOptions}
          importanceOptions={importanceOptions}
          onOpenTask={onOpenTask}
          onCreated={handleDialogDataChanged}
          onTaskChanged={handleDialogDataChanged}
          onClose={closeAllTasks}
        />
      )}

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
