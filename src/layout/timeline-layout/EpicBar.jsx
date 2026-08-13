import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { getBarGeometry, getEpicProgress } from "./timelineDate";
import { getEpicTheme } from "./epicColors";

// A bar narrower than this has no room for its own label, so the summary is
// drawn just outside the right edge instead of being clipped to nothing.
const MIN_WIDTH_FOR_INNER_LABEL = 72;

// One draggable/resizable bar on the Timeline. Dragging the body moves both
// dates together; dragging an edge handle resizes just that date. Movement
// is tracked in local "preview" state and only committed (via onCommitDates)
// on pointerup, so a slow network doesn't make the bar jitter mid-drag.
//
// Clicking the bar opens the epic in the task editor panel, the same editor a
// row click opens anywhere else in the app. Colour and dependencies live in a
// small popover reached from the row's label instead; that popover is NOT
// mounted here, because one Popover per bar meant a Radix root, its context
// and its state for every row in the project, which is a lot of live objects
// for something only one row shows at a time.
const EpicBar = ({ epic, rangeStart, pxPerDay, isRunning, isHighlighted, onCommitDates, onOpenTask }) => {
  const [preview, setPreview] = useState(null); // { start, due }
  const draggedRef = useRef(false);
  // Detach function for an in-flight drag, so a row that unmounts mid-drag
  // (background refetch, filter change) doesn't leave window listeners behind.
  const detachRef = useRef(null);

  const base = useMemo(
    () => getBarGeometry(epic, rangeStart, pxPerDay),
    [epic, rangeStart, pxPerDay]
  );

  const effectiveStart = base?.start || null;
  const effectiveDue = base?.due || null;

  const startDrag = useCallback((mode) => (e) => {
    if (!effectiveStart || !effectiveDue) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX;
    draggedRef.current = false;

    // Tracked outside React state: committing from inside a setState updater
    // makes the updater impure, which double-fires the mutation under
    // StrictMode.
    let latest = null;
    // A pointer can report faster than the screen refreshes, and each report
    // used to be its own setPreview - so a single drag queued far more
    // renders than there were frames to paint them in. The moves are folded
    // into one render per frame instead.
    let rafId = null;

    const detach = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      detachRef.current = null;
    };

    function handleMove(moveEvent) {
      const deltaPx = moveEvent.clientX - startClientX;
      const deltaDays = Math.round(deltaPx / pxPerDay);
      if (deltaDays !== 0) draggedRef.current = true;

      let nextStart = effectiveStart;
      let nextDue = effectiveDue;
      if (mode === "move") {
        nextStart = addDays(effectiveStart, deltaDays);
        nextDue = addDays(effectiveDue, deltaDays);
      } else if (mode === "resize-start") {
        nextStart = addDays(effectiveStart, deltaDays);
        if (nextStart > effectiveDue) nextStart = effectiveDue;
      } else if (mode === "resize-end") {
        nextDue = addDays(effectiveDue, deltaDays);
        if (nextDue < effectiveStart) nextDue = effectiveStart;
      }
      latest = { start: nextStart, due: nextDue };

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setPreview(latest);
      });
    }

    function handleUp() {
      detach();
      if (latest && draggedRef.current) {
        onCommitDates(epic._id, {
          startDate: latest.start.toISOString(),
          dueDate: latest.due.toISOString(),
        });
      }
      setPreview(null);
    }

    detachRef.current = detach;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [effectiveStart, effectiveDue, pxPerDay, epic._id, onCommitDates]);

  useEffect(() => () => detachRef.current?.(), []);

  const handleBarClick = useCallback((e) => {
    e.stopPropagation();
    if (draggedRef.current) return;
    onOpenTask(epic._id);
  }, [onOpenTask, epic._id]);

  // Every hook above runs unconditionally. This used to sit above the
  // useCallbacks, so an epic gaining its first date changed the hook count
  // between renders and React would throw.
  if (!base) {
    // Nothing to place on the axis until the epic has at least one date.
    return null;
  }

  const barStart = preview?.start || base.start;
  const barDue = preview?.due || base.due;
  const left = preview
    ? differenceInCalendarDays(barStart, rangeStart) * pxPerDay
    : base.left;
  const width = preview
    ? Math.max(pxPerDay, (differenceInCalendarDays(barDue, barStart) + 1) * pxPerDay)
    : base.width;

  const theme = getEpicTheme(epic.color);
  const { total, workPct } = getEpicProgress(epic);
  const showInnerLabel = width >= MIN_WIDTH_FOR_INNER_LABEL;

  return (
    <>
      <div
        className={cn(
          // The track itself is the pale colour and the progress fill is the
          // solid one, so how far along an epic is reads from across the room
          // instead of needing the number.
          "absolute top-1/2 -translate-y-1/2 h-7 rounded-full cursor-grab active:cursor-grabbing group select-none",
          "transition-shadow duration-150 hover:shadow-lg",
          theme.barSoft,
          isRunning && "ring-2 ring-offset-1 ring-offset-white shadow-md",
          isRunning && theme.ring,
          isHighlighted && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white",
          preview && "shadow-lg"
        )}
        style={{ left, width }}
        onPointerDown={startDrag("move")}
        onClick={handleBarClick}
        title={`${epic.summary} — click to open, drag to reschedule`}
      >
        {total > 0 && workPct > 0 && (
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full pointer-events-none", theme.bar)}
            style={{ width: `${workPct}%` }}
          />
        )}

        <div
          className="absolute inset-y-0 left-0 w-2.5 cursor-ew-resize rounded-l-full opacity-0 group-hover:opacity-100 bg-black/15"
          onPointerDown={startDrag("resize-start")}
        />
        <div
          className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize rounded-r-full opacity-0 group-hover:opacity-100 bg-black/15"
          onPointerDown={startDrag("resize-end")}
        />

        {showInnerLabel && (
          <span className="absolute inset-0 flex items-center gap-1.5 px-3 pointer-events-none">
            <span className="truncate text-[11px] font-semibold text-neutral-800">{epic.summary}</span>
            {total > 0 && (
              <span className="ml-auto shrink-0 text-[10px] font-bold text-neutral-600/80">{workPct}%</span>
            )}
          </span>
        )}
      </div>

      {!showInnerLabel && (
        <span
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium text-neutral-500 pointer-events-none"
          style={{ left: left + width + 8 }}
        >
          {epic.summary}
        </span>
      )}
    </>
  );
};

export default React.memo(EpicBar);
