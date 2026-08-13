import React from "react";
import { cn } from "@/lib/utils";
import { getBarGeometry } from "./timelineDate";

// Wide enough to hold a readable label. Below this the bar carries no text at
// all: the row's own label cell already spells the task out, so a second copy
// spilling onto the track was just the same name twice.
const MIN_WIDTH_FOR_INNER_LABEL = 72;

// A child task's bar on its parent epic's lane. Read only: rescheduling
// happens on the epic, and a task without dates has nothing to place on the
// axis, so it shows a marker at the epic's start instead of vanishing.
// Opening the task is handled by the row around this, so the whole row - not
// just the bar - is clickable.
const ChildTaskBar = ({ task, rangeStart, pxPerDay, statusColor, statusName, fallbackLeft }) => {
  const geometry = getBarGeometry(task, rangeStart, pxPerDay);

  const taskKey = task.project_key && task.taskNumber ? `${task.project_key}-${task.taskNumber}` : "";

  if (!geometry) {
    return (
      <span
        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] text-neutral-400 italic"
        style={{ left: Math.max(fallbackLeft || 0, 0) }}
        title="No dates set"
      >
        {taskKey || "No dates"}
      </span>
    );
  }

  const { left, width } = geometry;
  const showInnerLabel = width >= MIN_WIDTH_FOR_INNER_LABEL;

  return (
    /* Only a little shorter than an epic bar. A task under an epic is real
       work, so it gets a bar you can read and hit, not a hairline. */
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 h-5 rounded-md shadow-sm",
        statusColor || "bg-neutral-300"
      )}
      style={{ left, width }}
      title={`${taskKey} ${task.summary}${statusName ? ` · ${statusName}` : ""}`}
    >
      {showInnerLabel && (
        <span className="absolute inset-0 flex items-center px-2 truncate text-[11px] font-medium text-neutral-900/80">
          {task.summary}
        </span>
      )}
    </div>
  );
};

export default React.memo(ChildTaskBar);
