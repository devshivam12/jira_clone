import React from "react";
import { format } from "date-fns";
import TooltipWrapper from "@/components/common/TooltipWrapper";
import { cn } from "@/lib/utils";
import { SPRINT_LANE_HEIGHT } from "./timelineDate";

// Below this a pill has no room for a name, so it keeps its shape and colour
// and leaves the name to the tooltip.
const MIN_WIDTH_FOR_LABEL = 46;

// The pills themselves. Memoized because the header they sit in is inside the
// sticky block that survives every scroll frame, and rebuilding this list on
// each one would be pure waste.
const SprintMarkers = React.memo(function SprintMarkers({ items }) {
  return items.map((sprint) => (
    <TooltipWrapper
      key={sprint._id}
      direction="bottom"
      content={`${sprint.name} · ${format(sprint.start, "d MMM")} – ${format(sprint.end, "d MMM yyyy")}`}
    >
      <div
        className={cn(
          "absolute flex items-center overflow-hidden border px-1.5",
          "text-[10px] font-semibold leading-none",
          sprint.isRunning
            ? "border-emerald-300 bg-emerald-100 text-emerald-800"
            : "border-neutral-200 bg-neutral-100 text-neutral-500",
          // Rounded on the sides that really are the sprint's own start and end.
          sprint.startsBefore ? "rounded-l-none border-l-0" : "rounded-l-full",
          sprint.endsAfter ? "rounded-r-none border-r-0" : "rounded-r-full"
        )}
        style={{
          left: sprint.left,
          width: sprint.width,
          top: sprint.lane * SPRINT_LANE_HEIGHT + 3,
          height: SPRINT_LANE_HEIGHT - 6,
        }}
      >
        {sprint.width >= MIN_WIDTH_FOR_LABEL && (
          <span className="truncate">{sprint.name}</span>
        )}
      </div>
    </TooltipWrapper>
  ));
});

// The faint vertical lines dropped down the rows at each sprint boundary. This
// is what turns the band above into something you can read a bar against:
// without them, telling whether an epic ends inside this sprint or the next
// one means holding a finger on the screen.
//
// Drawn once for the whole chart, never per row, and only for boundaries that
// fall inside the visible range.
export const SprintBoundaries = React.memo(function SprintBoundaries({ items, height }) {
  return items.map((sprint) => (
    <React.Fragment key={sprint._id}>
      {!sprint.startsBefore && (
        <div
          className="absolute top-0 w-px bg-neutral-200/90"
          style={{ left: sprint.left, height }}
        />
      )}
      {!sprint.endsAfter && (
        <div
          className="absolute top-0 w-px bg-neutral-200/90"
          style={{ left: sprint.left + sprint.width, height }}
        />
      )}
    </React.Fragment>
  ));
});

export default SprintMarkers;
