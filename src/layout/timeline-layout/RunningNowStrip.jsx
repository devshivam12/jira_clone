import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Radio } from "lucide-react";
import ManageAvatar from "@/components/common/ManageAvatar";
import { cn } from "@/lib/utils";
import { getEpicTheme } from "./epicColors";
import { daysFromToday, getEpicProgress } from "./timelineDate";

// The list comes from the server as "epics whose dates cover today", so it
// does not depend on which page of the roadmap has been scrolled into view.
const EMPTY_LIST = Object.freeze([]);

const dueLabel = (days) => {
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
};

const RunningEpicCard = React.memo(function RunningEpicCard({ epic, onSelect }) {
  const theme = getEpicTheme(epic.color);
  const { total, done, workPct, timePct } = getEpicProgress(epic);
  const daysLeft = daysFromToday(epic.dueDate);

  // Work more than 15 points behind the calendar is the signal worth
  // surfacing. Below that the two bars are close enough that calling it out
  // would just be noise on every card.
  const behind = timePct !== null && timePct - workPct > 15;
  const taskKey = epic.project_key && epic.taskNumber ? `${epic.project_key}-${epic.taskNumber}` : "";

  const [firstName, lastName] = useMemo(
    () => (epic.assigneeDetail?.name || "").split(" "),
    [epic.assigneeDetail?.name]
  );

  return (
    <button
      type="button"
      onClick={() => onSelect?.(epic._id)}
      className={cn(
        "group relative shrink-0 w-[236px] text-left rounded-xl border bg-white p-3 transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        theme.border
      )}
    >
      <span className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", theme.bar)} />

      <div className="pl-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-[10px] font-bold tracking-wide", theme.text)}>{taskKey}</span>
          <span
            className={cn(
              "text-[10px] font-semibold",
              daysLeft !== null && daysLeft < 0 ? "text-rose-600" : "text-neutral-400"
            )}
          >
            {dueLabel(daysLeft)}
          </span>
        </div>

        <p className="mt-1 text-[13px] font-semibold text-neutral-800 leading-snug line-clamp-2 min-h-[34px]">
          {epic.summary}
        </p>

        <div className="mt-2.5 relative h-1.5 w-full rounded-full bg-neutral-100">
          <span
            className={cn("absolute inset-y-0 left-0 rounded-full", theme.bar)}
            style={{ width: `${workPct}%` }}
          />
          {/* Where the calendar says the epic should be by now. */}
          {timePct !== null && (
            <span
              className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-neutral-400"
              style={{ left: `${timePct}%` }}
              title="Expected progress by today"
            />
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-neutral-500">
            {total > 0 ? `${done}/${total} tasks` : "No tasks yet"}
          </span>
          <div className="flex items-center gap-1.5">
            {behind && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Behind
              </span>
            )}
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
        </div>
      </div>
    </button>
  );
});

// The horizontal band above the chart listing what is in flight today.
// Collapsible, because on a busy project it is the chart itself people scroll
// to, and a permanently open strip would eat a third of the viewport.
const RunningNowStrip = ({ epics = EMPTY_LIST, onSelect }) => {
  const [open, setOpen] = useState(true);

  if (!epics.length) return null;

  return (
    <div className="flex-none shrink-0 border-b border-neutral-200 bg-neutral-50/70 px-6 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-700"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Radio size={13} />
        Running now
        <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
          {epics.length}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300">
          {epics.map((epic) => (
            <RunningEpicCard key={epic._id} epic={epic} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(RunningNowStrip);
