import {
  addDays,
  addMonths,
  addYears,
  addQuarters,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  format,
} from "date-fns";

// pxPerDay per zoom level. Quarter is the widest view (fits ~a year on
// screen), week is the narrowest (each day gets real width for dragging).
//
// `unit` is what one header column stands for. Weeks and months both read as
// month columns; quarters merge each group of three months into a single
// column (Q1 = Jan-Mar, Q2 = Apr-Jun, and so on), so a year shows as four
// columns instead of twelve.
export const ZOOM_LEVELS = {
  week: { label: "Weeks", pxPerDay: 34, unit: "month" },
  month: { label: "Months", pxPerDay: 12, unit: "month" },
  quarter: { label: "Quarters", pxPerDay: 4, unit: "quarter" },
};

// Bounds for manually dragging a month column wider/narrower. A bit past
// both ends of ZOOM_LEVELS so the drag handle still has room to move past
// whichever preset is active.
export const MIN_PX_PER_DAY = 2;
export const MAX_PX_PER_DAY = 60;

// Calendar-aligned periods for the toolbar's period switcher. Quarters here
// are the standard calendar split (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec), not
// a fiscal year, since that's what the month columns already show.
export const PERIOD_OPTIONS = [
  { value: "quarter", label: "Quarterly" },
  { value: "half", label: "Half-Yearly" },
  { value: "year", label: "Yearly" },
];

// date-fns has no half-year helpers, so the two calendar halves (Jan-Jun,
// Jul-Dec) are worked out from the month the anchor date falls in.
function startOfHalfYear(date) {
  return new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
}
function endOfHalfYear(date) {
  return endOfMonth(addMonths(startOfHalfYear(date), 5));
}

// "Q3 2026" for any date in that quarter. Shared by the period switcher's
// label and the quarter columns on the axis, so both read the same way.
export function quarterLabel(date) {
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

// The identity of the quarter a date belongs to ("2026-Q3"). A plain string
// rather than a Date, so "which quarter is selected" and "which quarter is
// running" can be compared, and passed to memoized components, without two
// equal quarters counting as different because they are different objects.
export function quarterKey(date) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

// Which quarter of `year` a quarter index (0-3) is, as a date on its first day.
// The quarter view keeps only the index in state, so stepping to another year
// keeps the same quarter selected instead of jumping back to Q1.
export function quarterStartOfYear(year, quarterIndex) {
  return new Date(year, quarterIndex * 3, 1);
}

// The [start, end] of whichever quarter/half-year/year `anchor` falls in,
// plus a short label ("Q3 2026", "H2 2026", "2026") for the period switcher.
export function getPeriodRange(period, anchor) {
  if (period === "half") {
    const start = startOfHalfYear(anchor);
    return { start, end: endOfHalfYear(anchor), label: `H${start.getMonth() === 0 ? 1 : 2} ${start.getFullYear()}` };
  }
  if (period === "year") {
    const start = startOfYear(anchor);
    return { start, end: endOfYear(anchor), label: `${start.getFullYear()}` };
  }
  const start = startOfQuarter(anchor);
  return { start, end: endOfQuarter(anchor), label: quarterLabel(start) };
}

// Moves the anchor date one period forward (direction 1) or back (-1), so
// the toolbar's prev/next arrows can step through quarters/halves/years.
export function shiftPeriod(period, anchor, direction) {
  if (period === "half") return addMonths(anchor, 6 * direction);
  if (period === "year") return addYears(anchor, direction);
  return addQuarters(anchor, direction);
}

// The axis range for the chart.
//
// When the caller has an explicit window (the period switcher's quarter /
// half-year / year), that window IS the axis: exactly those months, nothing
// added. It must not be widened to fit the epics that happen to overlap it,
// and it must not be stretched to reach today. Doing either meant that
// stepping back to an earlier quarter kept the axis anchored to today, so the
// chart grew a month longer for every step back and the quarter you actually
// picked ended up squeezed into the left edge.
//
// Only without a window (no period selected yet) does it fall back to
// deriving a range from the data, padded a month each side so bars don't sit
// flush against the edge.
export function getTimelineRange(epics, sprints, windowStart, windowEnd) {
  if (windowStart && windowEnd) {
    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      // Month-aligned so buildAxisColumns produces whole columns. Quarters,
      // halves and years already fall on month boundaries, so this is a
      // no-op for them and a safety net for any other window.
      return { start: startOfMonth(start), end: endOfMonth(end) };
    }
  }

  // Tracked as raw timestamps in a single pass. Building a Date[] and then
  // doing Math.min(...arr) allocated three arrays per call and would throw
  // "too many arguments" once a project had enough dated epics.
  let minTime = Infinity;
  let maxTime = -Infinity;

  const consider = (value) => {
    if (!value) return;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return;
    if (time < minTime) minTime = time;
    if (time > maxTime) maxTime = time;
  };

  (epics || []).forEach((e) => {
    consider(e.startDate);
    consider(e.dueDate);
  });
  (sprints || []).forEach((s) => {
    consider(s.startDate);
    consider(s.endDate);
  });

  const today = new Date();
  if (minTime === Infinity) {
    return { start: startOfMonth(addMonths(today, -1)), end: endOfMonth(addMonths(today, 2)) };
  }

  const min = new Date(minTime);
  const max = new Date(maxTime);
  const start = startOfMonth(addMonths(min, -1));
  const end = endOfMonth(addMonths(max < today ? today : max, 1));
  return { start, end };
}

// Where an epic's bar sits on the axis. Shared by EpicBar (to draw itself)
// and TimelineChart (to anchor the details popover), so the popover can never
// drift away from the bar after a zoom change.
export function getBarGeometry(epic, rangeStart, pxPerDay) {
  const start = epic.startDate ? new Date(epic.startDate) : (epic.dueDate ? new Date(epic.dueDate) : null);
  const due = epic.dueDate ? new Date(epic.dueDate) : (epic.startDate ? new Date(epic.startDate) : null);
  if (!start || !due) return null;

  const left = differenceInCalendarDays(start, rangeStart) * pxPerDay;
  const width = Math.max(pxPerDay, (differenceInCalendarDays(due, start) + 1) * pxPerDay);
  return { start, due, left, width };
}

// An epic counts as running when today falls inside its dates. Both ends are
// inclusive and compared by calendar day, so an epic due today still reads as
// running rather than flipping to finished at midnight of its own due date.
export function isRunningNow(epic, today = new Date()) {
  if (!epic?.startDate || !epic?.dueDate) return false;
  return (
    differenceInCalendarDays(new Date(epic.startDate), today) <= 0 &&
    differenceInCalendarDays(new Date(epic.dueDate), today) >= 0
  );
}

// Whole days from today to `date`. Negative once the date has passed.
export function daysFromToday(date, today = new Date()) {
  if (!date) return null;
  return differenceInCalendarDays(new Date(date), today);
}

// Two numbers the UI reads side by side: how much of the epic's work is
// finished, and how much of its calendar has gone by. Work well behind
// calendar is what "at risk" means here.
export function getEpicProgress(epic, today = new Date()) {
  const total = epic?.totalChildren || 0;
  const done = epic?.doneChildren || 0;
  const workPct = total > 0 ? Math.round((done / total) * 100) : 0;

  let timePct = null;
  if (epic?.startDate && epic?.dueDate) {
    const span = differenceInCalendarDays(new Date(epic.dueDate), new Date(epic.startDate)) + 1;
    const gone = differenceInCalendarDays(today, new Date(epic.startDate)) + 1;
    if (span > 0) timePct = Math.min(100, Math.max(0, Math.round((gone / span) * 100)));
  }

  return { total, done, workPct, timePct };
}

export function dateToX(date, rangeStart, pxPerDay) {
  if (!date) return 0;
  return differenceInCalendarDays(new Date(date), rangeStart) * pxPerDay;
}

export function xToDate(x, rangeStart, pxPerDay) {
  const days = Math.round(x / pxPerDay);
  return addDays(rangeStart, days);
}

// One column per calendar month or per calendar quarter (see ZOOM_LEVELS),
// clipped to the visible range, for the timeline's header row and the
// vertical gridlines behind the bars.
//
// A quarter column is simply its three months measured as one span, so the
// axis maths below stays the same for both units: pxPerDay never changes, only
// how many days one column covers.
export function buildAxisColumns(rangeStart, rangeEnd, pxPerDay, unit = "month") {
  const isQuarter = unit === "quarter";
  // Started from the enclosing quarter, not from rangeStart, so a range that
  // begins mid-quarter still produces one whole quarter column (clipped
  // below) instead of shifting every quarter boundary along with it.
  const starts = isQuarter
    ? eachQuarterOfInterval({ start: startOfQuarter(rangeStart), end: rangeEnd })
    : eachMonthOfInterval({ start: rangeStart, end: rangeEnd });

  return starts.map((unitStart) => {
    const unitEnd = isQuarter ? endOfQuarter(unitStart) : endOfMonth(unitStart);
    const clippedStart = unitStart < rangeStart ? rangeStart : unitStart;
    const clippedEnd = unitEnd > rangeEnd ? rangeEnd : unitEnd;
    const days = differenceInCalendarDays(clippedEnd, clippedStart) + 1;
    const x = dateToX(clippedStart, rangeStart, pxPerDay);
    const width = days * pxPerDay;
    // `days` is kept on the column so a column-width drag (which changes
    // pxPerDay for every column at once) can turn "resize this column by
    // this many pixels" back into "how many px per day does that imply".
    //
    // `start` is the unclipped unit start, so clicking a quarter column can
    // ask for that whole quarter even when only part of it is on screen.
    return {
      key: isQuarter ? quarterKey(unitStart) : format(unitStart, "yyyy-MM"),
      label: isQuarter ? quarterLabel(unitStart) : format(unitStart, "MMM yyyy"),
      sublabel: isQuarter ? `${format(unitStart, "MMM")} – ${format(unitEnd, "MMM")}` : null,
      unit,
      start: unitStart,
      end: unitEnd,
      x,
      width,
      days,
    };
  });
}
