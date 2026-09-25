import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBarGeometry } from "./timelineDate";
import { getStatusColorProps } from "./epicColors";

// Wide enough to hold the status dot plus a readable name. Below this the bar
// keeps the dot only: the row's own label cell already spells the task out, so
// a second copy spilling onto the track was just the same name twice.
const MIN_WIDTH_FOR_INNER_LABEL = 96;

// A child task's bar on its parent epic's lane. Read only: rescheduling
// happens on the epic.
//
// Drawn as a light pill in the parent epic's colour with the task's status as a
// dot inside it, rather than a solid block filled with the status colour. Two
// reasons: a bar tinted like its epic ties the task to the lane it belongs to,
// and status colours are configured per project, so a solid fill could land on
// anything from pale yellow to near-black and there is no way to pick label
// text that stays readable on all of them. On a tint, one text colour always
// works.
//
// A task without dates has nothing to place on the axis, so its track stays
// empty. The row is still clickable across its full width, so such a task is
// no harder to open for having no bar.
const ChildTaskBar = ({ task, rangeStart, pxPerDay, status, theme }) => {
  const geometry = getBarGeometry(task, rangeStart, pxPerDay);
  if (!geometry) return null;

  const { left, width } = geometry;
  const showInnerLabel = width >= MIN_WIDTH_FOR_INNER_LABEL;
  const isDone = !!status?.isDone;
  const dot = getStatusColorProps(status?.color);

  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 h-5 rounded-full border shadow-sm",
        // The hover cue is driven from the row (see ChildRow), so pointing at
        // the label cell and pointing at the bar light up the same task.
        "transition-colors duration-150 group-hover/child:border-blue-400 group-hover/child:shadow-md",
        theme.tint,
        theme.border,
        isDone && "opacity-75"
      )}
      style={{ left, width }}
    >
      <span className="absolute inset-y-0 left-0 flex items-center pl-1.5">
        {isDone ? (
          <Check size={11} className="text-emerald-600" strokeWidth={3} />
        ) : (
          <span
            style={dot.style}
            className={cn("h-2 w-2 rounded-full ring-1 ring-white/80", dot.className)}
          />
        )}
      </span>

      {showInnerLabel && (
        <span
          className={cn(
            "absolute inset-0 flex items-center pl-5 pr-2 text-[10.5px] font-medium leading-none",
            isDone ? "text-neutral-500 line-through" : "text-neutral-700"
          )}
        >
          <span className="truncate">{task.summary}</span>
        </span>
      )}
    </div>
  );
};

export default React.memo(ChildTaskBar);
