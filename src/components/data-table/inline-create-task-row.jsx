import React, { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, X } from "lucide-react";
import WorkSelector from "../common/WorkSelector";
import DynamicDropdownSelector from "../common/DynamicDropdownSelector";
import ManageAvatar from "../common/ManageAvatar";
import ShowToast from "../common/ShowToast";
import { useQuickCreateTaskMutation } from "@/redux/graphql_api/task";

// Inline "create task" row shown at the end of a list. Only summary, status
// and importance are required. Assignee is optional. Pressing Enter (or the
// Create button) submits and keeps the row open so several items can be added
// in a row.
const InlineCreateTaskRow = ({
    projectId,
    workType = "task",
    sprintId = null,
    statusOptions = [],
    importanceOptions = [],
    onClose,
    onCreated,
}) => {
    const [quickCreateTask, { isLoading }] = useQuickCreateTaskMutation();

    const [summary, setSummary] = useState("");
    const [status, setStatus] = useState(() => statusOptions[0]?.value || "");
    const [importance, setImportance] = useState(() => importanceOptions[0]?.value || "");
    const [assignee, setAssignee] = useState(null);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    // Only one of the status / importance dropdowns can be open at a time.
    const [openDropdown, setOpenDropdown] = useState(null);

    const inputRef = useRef(null);

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
                    work_type: workType,
                    task_status: status,
                    importance,
                    assigneeId: assignee?._id || null,
                    ...(sprintId ? { sprintId } : {}),
                },
            };

            const result = await quickCreateTask(payload).unwrap();
            const response = result?.data?.quickCreateTask;

            if (response?.status === 201) {
                ShowToast.success(response?.message || "Task created");
                setSummary("");
                setAssignee(null);
                onCreated?.(response?.data);
                // Close the input bar after a successful create.
                onClose?.();
            } else {
                ShowToast.error(response?.message || "Could not create the task");
            }
        } catch (error) {
            ShowToast.error(error?.message || "Could not create the task");
        }
    }, [summary, status, importance, assignee, projectId, workType, sprintId, quickCreateTask, onCreated]);

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

    return (
        <div className="flex flex-wrap items-center gap-2 border-t bg-neutral-50 px-3 py-2 sm:px-4">
            <Input
                ref={inputRef}
                autoFocus
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                disabled={isLoading}
                className="h-9 flex-1 min-w-[180px] text-sm"
            />

            <div className="shrink-0">
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
            </div>

            <div className="shrink-0">
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
            </div>

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

            <Button
                type="button"
                size="sm"
                variant="teritary"
                onClick={handleSubmit}
                disabled={isLoading}
                className="h-9 shrink-0"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>

            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-9 w-9 shrink-0"
                title="Close"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default InlineCreateTaskRow;
