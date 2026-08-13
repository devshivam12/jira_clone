import React, { useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";

// SVG overlay drawing a curved connector from the end of each dependency
// epic's bar to the start of the epic that depends on it. Positions are
// derived purely from the epics array (dates) plus the row centre each epic
// was laid out at, not measured from the DOM, so it stays correct across
// scroll/resize without a ResizeObserver.
//
// Row centres are passed in rather than computed as index * rowHeight,
// because expanding an epic inserts child rows and pushes every lane below
// it down by a variable amount.
//
// `visibleFrom`/`visibleTo` are the row indexes the virtualizer currently has
// mounted. Connectors whose both endpoints sit outside that window are
// skipped, so scrolling a long roadmap doesn't keep thousands of <path>
// nodes alive just because they exist somewhere in the list.
const DependencyLines = ({
  epics,
  rangeStart,
  pxPerDay,
  epicRowById,
  totalHeight,
  visibleFrom = 0,
  visibleTo = Infinity,
}) => {
  const paths = useMemo(() => {
    const result = [];

    epics.forEach((epic) => {
      const dependsOn = epic.dependsOn;
      if (!dependsOn || dependsOn.length === 0) return;

      const target = epicRowById.get(epic._id);
      if (!target) return;

      dependsOn.forEach((dep) => {
        const source = epicRowById.get(dep._id);
        if (!source) return; // dependency isn't in the current filtered/grouped view

        const depEndDate = source.epic.dueDate || source.epic.startDate;
        const thisStartDate = epic.startDate || epic.dueDate;
        if (!depEndDate || !thisStartDate) return;

        const x1 = differenceInCalendarDays(new Date(depEndDate), rangeStart) * pxPerDay + pxPerDay;
        const x2 = differenceInCalendarDays(new Date(thisStartDate), rangeStart) * pxPerDay;
        const midX = (x1 + x2) / 2;

        result.push({
          key: `${dep._id}-${epic._id}`,
          d: `M ${x1} ${source.centerY} C ${midX} ${source.centerY}, ${midX} ${target.centerY}, ${x2} ${target.centerY}`,
          // The curve's control points share both y values, so by the convex
          // hull property it never leaves the band between the two rows.
          // Safe to cull on, and safe to size the SVG to.
          lowest: Math.min(source.index, target.index),
          highest: Math.max(source.index, target.index),
          topY: Math.min(source.centerY, target.centerY),
          bottomY: Math.max(source.centerY, target.centerY),
        });
      });
    });

    return result;
  }, [epics, epicRowById, rangeStart, pxPerDay]);

  // Kept together with the band the surviving paths span. The SVG used to be
  // sized to the whole list (totalWidth x rowsHeight), which on a wide zoom is
  // a raster layer of tens of millions of pixels the browser has to keep and
  // repaint - it undid the virtualization the rows below it work for. Now the
  // element only covers the rows the connectors actually cross.
  const { visiblePaths, bandTop, bandHeight } = useMemo(() => {
    const kept = [];
    let min = Infinity;
    let max = -Infinity;

    for (const p of paths) {
      if (p.highest < visibleFrom || p.lowest > visibleTo) continue;
      kept.push(p);
      if (p.topY < min) min = p.topY;
      if (p.bottomY > max) max = p.bottomY;
    }

    if (!kept.length) return { visiblePaths: kept, bandTop: 0, bandHeight: 0 };

    // A little slack so the arrow head and the stroke width are not clipped
    // by the band's own edge.
    const top = Math.max(0, min - 8);
    const bottom = Math.min(totalHeight, max + 8);
    return { visiblePaths: kept, bandTop: top, bandHeight: Math.max(bottom - top, 1) };
  }, [paths, visibleFrom, visibleTo, totalHeight]);

  // Most projects have no dependencies at all, so the usual case now costs no
  // element rather than a full-canvas one.
  if (!visiblePaths.length) return null;

  return (
    <svg
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top: bandTop, height: bandHeight }}
    >
      <defs>
        <marker id="timeline-dep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="fill-neutral-400" />
        </marker>
      </defs>
      {/* The `d` strings hold absolute positions in the list, so one translate
          moves them into the band's own coordinate space and the memo above
          never has to rebuild them when the band moves. */}
      <g transform={`translate(0 ${-bandTop})`}>
        {visiblePaths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="currentColor"
            className="text-neutral-400"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            markerEnd="url(#timeline-dep-arrow)"
          />
        ))}
      </g>
    </svg>
  );
};

export default React.memo(DependencyLines);
