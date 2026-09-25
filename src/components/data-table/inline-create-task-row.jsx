import React, { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Loader2, X } from "lucide-react";
import WorkSelector from "../common/WorkSelector";
import DynamicDropdownSelector from "../common/DynamicDropdownSelector";
import ManageAvatar from "../common/ManageAvatar";
import ShowToast from "../common/ShowToast";
import { useQuickCreateTaskMutation } from "@/redux/graphql_api/task";

// Which controls the row shows, and in which order. Every list that had this
// row before asks for these four, so nothing about those lists changed. The
// List view asks for a different set: a work type dropdown instead of the
// status and priority ones, plus a due date.
const DEFAULT_FIELDS = ["summary", "status", "importance", "assignee"];

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const shortDate = (date) => date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });

// Inline "create task" row shown at the end of a list. Only summary, status
// and importance are required. Assignee is optional. Pressing Enter (or the
// Create button) submits and keeps the row open so several items can be added
// in a row.
//
// A control the row does not show still sends a value: the status and the
// priority fall back to the first option the project has, which is what the
// List view relies on when it shows the work type and the due date instead.
const InlineCreateTaskRow = ({
    projectId,
    workType = "task",
    sprintId = null,
    statusOptions = [],
    importanceOptions = [],
    // Given a list of work types, the row shows a dropdown to pick one and
    // `workType` is only the starting choice.
    workTypeOptions = null,
    fields = DEFAULT_FIELDS,
    onClose,
    onCreated,
    // Extra fields merged into the create payload (e.g. startDate/dueDate/color
    // when this row is used to create an epic bar from the Timeline view).
    extraVariables = {},
    // A narrow column, such as the epic side panel, cannot hold every field on
    // one line. With this on the same fields are stacked over three short rows
    // instead of being squeezed until they are unreadable.
    compact = false,
    // By default the bar is a full width strip at the end of a list, which is
    // what the backlog and the sprint tables want. With this on it is only as
    // wide as its own controls and sits as a small card, which is what the
    // List view wants - a bar stretched across twenty columns of a wide table
    // reads as an empty band with a few controls lost at one end.
    fitContent = false,
}) => {
    const [quickCreateTask, { isLoading }] = useQuickCreateTaskMutation();

    const [summary, setSummary] = useState("");
    const [status, setStatus] = useState(() => statusOptions[0]?.value || "");
    const [importance, setImportance] = useState(() => importanceOptions[0]?.value || "");
    const [selectedWorkType, setSelectedWorkType] = useState(workType);
    const [dueDate, setDueDate] = useState(null);
    const [assignee, setAssignee] = useState(null);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    // Only one of the status / importance / work type dropdowns can be open at
    // a time.
    const [openDropdown, setOpenDropdown] = useState(null);

    const inputRef = useRef(null);

    const shows = useCallback((field) => fields.includes(field), [fields]);

    const handleAssigneeChange = useCallback((member) => {
        setAssignee(member || null);
        setIsAssigneeOpen(false);
    }, []);

    const handleSubmit = useCallback(async () => {
        const trimmed = summary.trim();
        if (!trimmed) {
            ShowToast.error("Summary is required");
            inputRef.current?.focus();
            return;
        }
        if (!status) {
            ShowToast.error("Status is required");
            return;
        }
        if (!importance) {
            ShowToast.error("Importance is required");
            return;
        }

        try {
            const payload = {
                operationName: "quickCreateTask",
                variables: {
                    projectId,
                    summary: trimmed,
                    work_type: selectedWorkType,
                    task_status: status,
                    importance,
                    assigneeId: assignee?._id || null,
                    ...(sprintId ? { sprintId } : {}),
                    ...(dueDate ? { dueDate } : {}),
                    ...extraVariables,
                },
            };

            const result = await quickCreateTask(payload).unwrap();
            const response = result?.data?.quickCreateTask;

            if (response?.status === 201) {
                ShowToast.success(response?.message || "Task created");
                setSummary("");
                setAssignee(null);
                setDueDate(null);
                onCreated?.(response?.data);
                // Close the input bar after a successful create.
                onClose?.();
            } else {
                ShowToast.error(response?.message || "Could not create the task");
            }
        } catch (error) {
            ShowToast.error(error?.message || "Could not create the task");
        }
    }, [summary, status, importance, selectedWorkType, dueDate, assignee, projectId, sprintId, extraVariables, quickCreateTask, onCreated, onClose]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!isLoading) handleSubmit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose?.();
        }
    }, [handleSubmit, isLoading, onClose]);

    const hasAssignee = Boolean(assignee && assignee._id);
    const dueDateValue = toDate(dueDate);

    // The fields are written once and then placed by whichever layout is in
    // use, so the wide row and the narrow one always behave the same way.
    const summaryField = (className) => (
        <Input
            ref={inputRef}
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            disabled={isLoading}
            className={className}
        />
    );

    const workTypeField = (
        <WorkSelector
            value={selectedWorkType}
            workTypes={workTypeOptions || []}
            onChange={(value) => value && setSelectedWorkType(value)}
            open={openDropdown === "workType"}
            onOpenChange={(open) => {
                setOpenDropdown(open ? "workType" : null);
                if (open) setIsAssigneeOpen(false);
            }}
            disabled={isLoading}
        />
    );

    const statusField = (
        <WorkSelector
            value={status}
            workTypes={statusOptions}
            onChange={setStatus}
            open={openDropdown === "status"}
            onOpenChange={(open) => {
                setOpenDropdown(open ? "status" : null);
                if (open) setIsAssigneeOpen(false);
            }}
            disabled={isLoading}
        />
    );

    const importanceField = (
        <WorkSelector
            value={importance}
            workTypes={importanceOptions}
            onChange={setImportance}
            open={openDropdown === "importance"}
            onOpenChange={(open) => {
                setOpenDropdown(open ? "importance" : null);
                if (open) setIsAssigneeOpen(false);
            }}
            disabled={isLoading}
        />
    );

    const dueDateField = (
        <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={isLoading}
                    title={dueDateValue ? "Change the due date" : "Set a due date"}
                    className="flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 text-sm"
                >
                    <CalendarDays size={15} className="shrink-0 text-neutral-400" />
                    <span className={dueDateValue ? "text-neutral-700" : "text-neutral-400"}>
                        {dueDateValue ? shortDate(dueDateValue) : "Due date"}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={dueDateValue || undefined}
                    defaultMonth={dueDateValue || undefined}
                    onSelect={(date) => {
                        if (!date) return;
                        setDueDate(date.toISOString());
                        setIsDueDateOpen(false);
                    }}
                />
                {dueDateValue && (
                    <div className="border-t p-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-full text-xs"
                            onClick={() => {
                                setDueDate(null);
                                setIsDueDateOpen(false);
                            }}
                        >
                            <X size={13} className="mr-1" />
                            Clear date
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );

    const assigneeField = (
        <DropdownMenu
            open={isAssigneeOpen}
            onOpenChange={(open) => {
                setIsAssigneeOpen(open);
                if (open) setOpenDropdown(null);
            }}
        >
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={isLoading}
                    className="shrink-0 rounded-full outline-none"
                    title={hasAssignee ? `${assignee.first_name} ${assignee.last_name}` : "Assignee (optional)"}
                >
                    {hasAssignee ? (
                        <ManageAvatar
                            firstName={assignee.first_name}
                            lastName={assignee.last_name}
                            image={assignee.image}
                            size="sm"
                            showTooltip={false}
                        />
                    ) : (
                        <ManageAvatar fallbackIcon={true} size="sm" showTooltip={false} />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-0" align="end" onClick={(e) => e.stopPropagation()}>
                <DynamicDropdownSelector
                    slug={"member"}
                    onChange={handleAssigneeChange}
                    label={"Select assignee"}
                    projectId={projectId}
                    showDropdown={true}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );

    // Every control the row can show, so the two layouts below can place them
    // by name without repeating how any of them is built.
    const fieldByName = {
        workType: workTypeOptions?.length ? workTypeField : null,
        status: statusField,
        importance: importanceField,
        dueDate: dueDateField,
        assignee: assigneeField,
    };

    const createButton = (className) => (
        <Button
            type="button"
            size="sm"
            variant="teritary"
            onClick={handleSubmit}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
        </Button>
    );

    const closeButton = (className) => (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className={className}
            title="Close"
        >
            <X className="h-4 w-4" />
        </Button>
    );

    // Narrow column: the summary gets its own line, the other controls share
    // the next one, and the actions sit at the end. Nothing has to fit next to
    // the summary box, so every control keeps a usable size.
    if (compact) {
        // The dropdowns share the middle line, the small controls sit with the
        // buttons on the last one.
        const wideFields = fields.filter((name) => ["workType", "status", "importance"].includes(name) && fieldByName[name]);
        const smallFields = fields.filter((name) => ["dueDate", "assignee"].includes(name) && fieldByName[name]);

        return (
            <div className="flex flex-col gap-2 bg-white px-2 py-2">
                {shows("summary") && summaryField("h-8 w-full text-sm")}

                {wideFields.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        {wideFields.map((name) => (
                            <div key={name} className="min-w-0 flex-1">
                                {fieldByName[name]}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    {smallFields.map((name) => (
                        <div key={name} className="shrink-0">
                            {fieldByName[name]}
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1">
                        {createButton("h-8 shrink-0 px-3")}
                        {closeButton("h-8 w-8 shrink-0")}
                    </div>
                </div>
            </div>
        );
    }

    const rowClassName = fitContent
        ? "inline-flex w-max max-w-full flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-2 shadow-sm"
        : "flex flex-wrap items-center gap-2 border-t bg-neutral-50 px-3 py-2 sm:px-4";

    // Growing to fill the line is right for a full width strip. In the small
    // card the box keeps a fixed, comfortable size instead, so the card ends
    // where its controls end.
    const summaryClassName = fitContent
        ? "h-9 w-[280px] max-w-full text-sm"
        : "h-9 flex-1 min-w-[180px] text-sm";

    return (
        <div className={rowClassName}>
            {fields.map((name) => {
                if (name === "summary") {
                    return (
                        <React.Fragment key={name}>
                            {summaryField(summaryClassName)}
                        </React.Fragment>
                    );
                }
                const field = fieldByName[name];
                if (!field) return null;
                return (
                    <div key={name} className="shrink-0">
                        {field}
                    </div>
                );
            })}

            {createButton("h-9 shrink-0")}

            {closeButton("h-9 w-9 shrink-0")}
        </div>
    );
};

export default InlineCreateTaskRow;
