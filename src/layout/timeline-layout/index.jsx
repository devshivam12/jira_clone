import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import EditIssue from "@/layout/backlog-layout/[id]/EditIssue";
import { useGetTimelineDataQuery, useUpdateTaskDatesMutation } from "@/redux/graphql_api/timeline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ShowToast from "@/components/common/ShowToast";
import TimelineChart from "./TimelineChart";
import RunningNowStrip from "./RunningNowStrip";
import {
  ZOOM_LEVELS,
  getTimelineRange,
  PERIOD_OPTIONS,
  getPeriodRange,
  shiftPeriod,
  quarterKey,
  quarterStartOfYear,
} from "./timelineDate";

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "assignee", label: "Assignee" },
  { value: "team", label: "Team" },
  { value: "status", label: "Status" },
];

// How many epics to pull per page within the selected period. Sent
// explicitly (rather than relying on a server default) so the range stays
// stable while the user scrolls and pages in more epics.
const PAGE_SIZE = 30;

// Shared frozen fallbacks. Writing `data?.x || []` inline would hand a brand
// new array to the memos on every render, so they would recompute (and the
// whole chart would re-render) even when nothing actually changed.
const EMPTY_LIST = Object.freeze([]);

const groupKey = (epic, groupBy) => {
  if (groupBy === "assignee") return epic.assigneeDetail?.name || "Unassigned";
  if (groupBy === "team") return epic.teamDetail?.team_name || "No team";
  if (groupBy === "status") return epic.task_status || "";
  return "";
};

const Timeline = () => {
  const { currentProject, workFlow, importance } = useProjectData();
  const projectId = currentProject?._id;

  // Opens on the quarter view: the axis is the running year split into its
  // four quarters, which is the roadmap people ask for first ("where does the
  // year stand"). Weeks and months are the drill-downs from there.
  const [zoom, setZoom] = useState("quarter");
  // Starts from the preset above, but can drift away from it once the user
  // drags a column border wider/narrower. Picking a preset from the dropdown
  // snaps it back. In the quarter view the chart ignores this and derives its
  // own day width, so all four quarters fit the screen without scrolling.
  const [pxPerDay, setPxPerDay] = useState(ZOOM_LEVELS.quarter.pxPerDay);
  const [groupBy, setGroupBy] = useState("none");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [highlightEpicId, setHighlightEpicId] = useState(null);

  // `period` picks the calendar span (quarter/half-year/year); `periodAnchor`
  // is a date inside whichever one is currently shown, so the prev/next
  // arrows can just step it by one period at a time. Both default to the
  // running year, because the quarter view above draws that year's four
  // quarters, and the arrows step a year at a time.
  const [period, setPeriod] = useState("year");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());

  const [searchParams, setSearchParams] = useSearchParams();
  const openIssueId = searchParams.get("issueId");

  // Which of the year's four quarters the quarter view is showing epics for,
  // held as an index (0-3) rather than a date. Stepping to another year keeps
  // the same quarter selected, and the axis year is the only thing that moves.
  // Starts on the quarter today falls in.
  const [selectedQuarterIndex, setSelectedQuarterIndex] = useState(
    () => Math.floor(new Date().getMonth() / 3)
  );

  // The Quarters zoom is a year view: the axis is always the four quarters of
  // one year, and one of them is selected. So the axis span is pinned to the
  // year while quarter columns are on, which is also what makes the prev/next
  // arrows step a year at a time.
  const isQuarterView = ZOOM_LEVELS[zoom].unit === "quarter";
  const handleZoomChange = useCallback((value) => {
    setZoom(value);
    setPxPerDay(ZOOM_LEVELS[value].pxPerDay);
    if (ZOOM_LEVELS[value].unit === "quarter") {
      setPeriod("year");
      // Keeps whichever quarter was on screen selected as the axis opens out
      // to its year, rather than jumping to the one selected some time ago.
      setSelectedQuarterIndex(Math.floor(periodAnchor.getMonth() / 3));
    }
  }, [periodAnchor]);

  // Switching the period type (e.g. Quarterly -> Yearly) re-centers on today
  // rather than keeping whatever quarter was being viewed, since "the 3rd
  // year" relative to a quarter you'd navigated to wouldn't mean anything.
  const handlePeriodChange = useCallback((value) => {
    setPeriod(value);
    setPeriodAnchor(new Date());
    // The period switcher picks a span of months, so choosing from it leaves
    // the year-wide quarter view for month columns. Quarterly here means the
    // three months of one quarter.
    if (isQuarterView) {
      setZoom("month");
      setPxPerDay(ZOOM_LEVELS.month.pxPerDay);
    }
  }, [isQuarterView]);

  // Clicking a quarter bar on the axis. The axis stays on the same year, with
  // all four quarters still on it; only which quarter's epics are fetched and
  // shown changes.
  const handleSelectQuarter = useCallback((quarterStart) => {
    setSelectedQuarterIndex(Math.floor(quarterStart.getMonth() / 3));
  }, []);
  const goToPreviousPeriod = useCallback(() => {
    setPeriodAnchor((prev) => shiftPeriod(period, prev, -1));
  }, [period]);
  const goToNextPeriod = useCallback(() => {
    setPeriodAnchor((prev) => shiftPeriod(period, prev, 1));
  }, [period]);
  // Clicking the period label goes back to now: this year, and in the quarter
  // view the quarter that is actually running.
  const goToCurrentPeriod = useCallback(() => {
    const now = new Date();
    setPeriodAnchor(now);
    setSelectedQuarterIndex(Math.floor(now.getMonth() / 3));
  }, []);

  // The span the axis draws. Kept as Date objects, so the chart draws exactly
  // this span instead of re-parsing the server's echo of it (which comes back
  // as UTC and can land on the previous month once a browser's offset is
  // applied). In the quarter view `period` is always "year", so this is the
  // year holding all four quarter bars.
  const { axisStart, axisEnd, periodLabel } = useMemo(() => {
    const { start, end, label } = getPeriodRange(period, periodAnchor);
    return { axisStart: start, axisEnd: end, periodLabel: label };
  }, [period, periodAnchor]);

  // The span the server is asked for, which is not always the span on screen.
  // In the quarter view the axis shows the whole year but only the selected
  // quarter's epics are fetched, so clicking a quarter bar is a new request for
  // that quarter's three months while the four bars stay put.
  //
  // Recomputed only when one of those inputs changes, so the query args stay
  // referentially stable and don't retrigger the request on every render.
  const { from, to, fetchPeriod, selectedQuarterKey, selectedQuarterLabel } = useMemo(() => {
    if (isQuarterView) {
      const quarter = getPeriodRange("quarter", quarterStartOfYear(axisStart.getFullYear(), selectedQuarterIndex));
      return {
        from: quarter.start.toISOString(),
        to: quarter.end.toISOString(),
        fetchPeriod: "quarter",
        selectedQuarterKey: quarterKey(quarter.start),
        selectedQuarterLabel: quarter.label,
      };
    }
    return {
      from: axisStart.toISOString(),
      to: axisEnd.toISOString(),
      fetchPeriod: period,
      selectedQuarterKey: null,
      selectedQuarterLabel: null,
    };
  }, [isQuarterView, axisStart, axisEnd, period, selectedQuarterIndex]);

  const { data, isLoading, isFetching, refetch } = useGetTimelineDataQuery(
    {
      operationName: "getTimelineData",
      // `period` tells the server which calendar unit from/to describe, so it
      // can snap the window to that unit's real boundaries before querying
      // instead of trusting whatever instant the browser sent.
      variables: { projectId, from, to, period: fetchPeriod, limit: PAGE_SIZE, offset },
    },
    { skip: !projectId }
  );

  const [updateTaskDates] = useUpdateTaskDatesMutation();

  // Typing re-filters every epic and re-renders the chart, so the input stays
  // instant while the actual filtering runs on a settled value.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const timeline = data?.data?.getTimelineData;
  const rawEpics = timeline?.epics || EMPTY_LIST;
  const sprints = timeline?.sprints || EMPTY_LIST;
  const runningEpics = timeline?.runningEpics || EMPTY_LIST;
  const totalCount = timeline?.totalCount ?? 0;
  const hasMore = timeline?.hasMore ?? false;

  // The highest offset already asked for. Without this the chart could page
  // through the whole project on its own: the "near the end of the list"
  // trigger stays true whenever the loaded rows do not fill the viewport
  // (a search that matches three epics, a short first page), and every
  // arriving page flipped isFetching back to false and fired it again. That
  // is a request storm, and merging page after page into one growing array is
  // what locks the tab up.
  const requestedOffsetRef = useRef(0);

  // A new window (or project) is a new list, so the guard starts over.
  useEffect(() => {
    requestedOffsetRef.current = 0;
    setOffset(0);
  }, [from, to, projectId]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore) return;
    // Search filters what is already loaded. Auto-paging while one is active
    // meant a term matching a handful of epics left the list too short to
    // fill the viewport, so the "near the end" trigger stayed on and the
    // chart walked the entire project one page at a time, merging every page
    // into the same array. Paging waits until the search is cleared.
    if (debouncedSearch.trim()) return;
    const nextOffset = rawEpics.length;
    // Nothing new arrived from the last page, so asking again would just
    // repeat the same request forever.
    if (nextOffset <= requestedOffsetRef.current) return;
    requestedOffsetRef.current = nextOffset;
    setOffset(nextOffset);
  }, [isFetching, hasMore, rawEpics.length, debouncedSearch]);

  // Grouping is a client-side reshape (sort by the chosen dimension so
  // like items sit together); it does not add collapsible section headers
  // in this version.
  const epics = useMemo(() => {
    let list = rawEpics;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter((e) => e.summary?.toLowerCase().includes(q));
    }
    if (groupBy !== "none") {
      list = [...list].sort((a, b) => groupKey(a, groupBy).localeCompare(groupKey(b, groupBy)));
    }
    return list;
  }, [rawEpics, debouncedSearch, groupBy]);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getTimelineRange(rawEpics, sprints, axisStart, axisEnd),
    [rawEpics, sprints, axisStart, axisEnd]
  );

  // Kept stable so the memoized rows/bars below don't all re-render whenever
  // this component re-renders for an unrelated reason (zoom, search, etc).
  const handleCommitDates = useCallback(async (taskId, { startDate, dueDate }) => {
    try {
      const result = await updateTaskDates({
        operationName: "updateTaskDates",
        variables: { taskId, startDate, dueDate },
      }).unwrap();
      const response = result?.data?.updateTaskDates;
      if (response?.status !== 200) {
        ShowToast.error(response?.message || "Could not reschedule epic");
        refetch();
      }
    } catch (error) {
      ShowToast.error(error?.message || "Could not reschedule epic");
      refetch();
    }
  }, [updateTaskDates, refetch]);

  const handleSelectRunning = useCallback((epicId) => {
    setHighlightEpicId(epicId);
  }, []);

  // Clicking an epic bar or a child task row opens the task editor in a side
  // panel. It is driven by the `issueId` search param, exactly like the one on
  // the Backlog page, so the same link opens the same item from either view.
  //
  // Read through a ref because react-router hands back a new setSearchParams
  // whenever the URL changes. As a plain dependency it would give this
  // callback a new identity on every navigation, which reaches every mounted
  // row through the chart's props and defeats their React.memo.
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  const handleOpenTask = useCallback((taskId) => {
    setSearchParamsRef.current((prev) => {
      const params = new URLSearchParams(prev);
      params.set("issueId", taskId);
      return params;
    });
  }, []);

  if (!projectId || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    // The chart and the task editor panel sit side by side. min-w-0 +
    // overflow-hidden pin the chart to whatever width is left. All horizontal
    // scrolling belongs to the chart's own container, so the header below
    // never slides out of view.
    <div className="flex h-full min-w-0 overflow-hidden bg-white">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-none shrink-0 px-6 pt-4 pb-3 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight">Timeline</h1>
              {/* In the quarter view the axis covers the year but the rows
                  below are one quarter's, so the quarter being listed is named
                  here as well as highlighted on its bar. */}
              {selectedQuarterLabel && (
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {selectedQuarterLabel}
                </span>
              )}
              {/* Makes it obvious the chart is a window over the project, not
                  the whole thing, so a missing epic isn't mistaken for a bug. */}
              {totalCount > 0 && (
                <span className="text-xs font-medium text-neutral-400">
                  {epics.length} of {totalCount} epics
                </span>
              )}
              {isFetching && <Loader2 size={13} className="animate-spin text-neutral-400" />}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search epics"
                  className="h-9 w-[190px] pl-8 text-sm rounded-lg"
                />
              </div>

              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="h-9 w-[140px] text-sm rounded-lg">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={zoom} onValueChange={handleZoomChange}>
                <SelectTrigger className="h-9 w-[110px] text-sm rounded-lg">
                  <SelectValue placeholder="Zoom" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ZOOM_LEVELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Steps through the calendar span picked below, one period at
                  a time. Clicking the label itself jumps back to today. */}
              <div className="flex items-center rounded-lg border border-neutral-200 h-9 bg-white">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-8 rounded-r-none"
                  onClick={goToPreviousPeriod}
                  title="Previous period"
                >
                  <ChevronLeft size={16} />
                </Button>
                <button
                  type="button"
                  onClick={goToCurrentPeriod}
                  className="min-w-[76px] px-1 text-center text-sm font-semibold text-neutral-700 hover:text-blue-600"
                  title="Jump to the current period"
                >
                  {periodLabel}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-8 rounded-l-none"
                  onClick={goToNextPeriod}
                  title="Next period"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>

              {/* Controls how much of the roadmap the server is asked for. */}
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-9 w-[130px] text-sm rounded-lg">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <RunningNowStrip epics={runningEpics} onSelect={handleSelectRunning} />

        <div className="flex-1 min-h-0">
          <TimelineChart
            epics={epics}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            pxPerDay={pxPerDay}
            onPxPerDayChange={setPxPerDay}
            axisUnit={ZOOM_LEVELS[zoom].unit}
            // The quarter view has to show the whole year at once, so the
            // chart sizes the day width to the space it has instead of using
            // the preset. Month/week views keep their fixed widths and scroll.
            fitToWidth={isQuarterView}
            onSelectQuarter={handleSelectQuarter}
            selectedQuarterKey={selectedQuarterKey}
            projectId={projectId}
            workFlow={workFlow}
            importance={importance}
            onCommitDates={handleCommitDates}
            onChanged={refetch}
            hasMore={hasMore}
            isFetchingMore={isFetching}
            onLoadMore={loadMore}
            highlightEpicId={highlightEpicId}
            onOpenTask={handleOpenTask}
          />
        </div>
      </div>

      {/* Same editor the Backlog opens, reading the same `issueId` param. It
          takes a fixed width beside the chart on a wide screen and covers the
          page on a narrow one, where there is no room for both. */}
      {openIssueId && (
        <div className="fixed inset-0 z-[60] w-full h-full overflow-hidden bg-white shadow-xl lg:static lg:z-auto lg:w-[480px] lg:h-full lg:shrink-0 lg:border-l lg:border-neutral-200 lg:shadow-none">
          <EditIssue issue={openIssueId} />
        </div>
      )}
    </div>
  );
};

export default Timeline;
