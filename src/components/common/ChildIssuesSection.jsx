import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChevronDown, ChevronUp, Loader2, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProjectData } from "@/hooks/useProjectData";
import { timelineApi, useGetEpicChildrenQuery } from "@/redux/graphql_api/timeline";
import { useQuickCreateTaskMutation } from "@/redux/graphql_api/task";
import ShowToast from "./ShowToast";

const CHILD_LIMIT = 50;

const EMPTY_LIST = Object.freeze([]);

const ChildIssuesSection = ({ taskId, projectId, onOpenChild }) => {
    const { workFlow, importance } = useProjectData();
    const dispatch = useDispatch();

    const [isOpen, setIsOpen] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [summary, setSummary] = useState("");

    const { data, isFetching, refetch } = useGetEpicChildrenQuery(
        {
            operationName: "getEpicChildren",
            variables: { epicId: taskId, limit: CHILD_LIMIT, offset: 0 },
        },
        { skip: !taskId }
    );

    const payload = data?.data?.getEpicChildren;
    const children = payload?.children || EMPTY_LIST;
    const totalCount = payload?.totalCount ?? children.length;

    const statusBySlug = useMemo(() => {
        const map = new Map();
        (workFlow || []).forEach((s) => map.set(s.slug, s));
        return map;
    }, [workFlow]);

    const [quickCreateTask, { isLoading: isCreating }] = useQuickCreateTaskMutation();

    const handleCreate = useCallback(async () => {
        const trimmed = summary.trim();
        if (!trimmed) {
            ShowToast.error("Summary is required");
            return;
        }
        const firstStatus = workFlow?.[0]?.slug;
        const firstImportance = importance?.[0]?.slug;
        if (!projectId || !firstStatus || !firstImportance) {
            ShowToast.error("Project settings are still loading. Please try again");
            return;
        }

        try {
            const result = await quickCreateTask({
                operationName: "quickCreateTask",
                variables: {
                    projectId,
                    summary: trimmed,
                    work_type: "task",
                    task_status: firstStatus,
                    importance: firstImportance,
                    parentId: taskId,
                },
            }).unwrap();

            const response = result?.data?.quickCreateTask;
            if (response?.status === 201) {
                ShowToast.success(response?.message || "Child work item created");
                setSummary("");
                refetch();
                dispatch(timelineApi.util.invalidateTags(["Timeline"]));
            } else {
                ShowToast.error(response?.message || "Could not create the child work item");
            }
        } catch (error) {
            ShowToast.error(error?.message || "Could not create the child work item");
        }
    }, [summary, workFlow, importance, projectId, taskId, quickCreateTask, refetch, dispatch]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!isCreating) handleCreate();
        } else if (e.key === "Escape") {
            e.preventDefault();
            setShowForm(false);
            setSummary("");
        }
    }, [handleCreate, isCreating]);

    if (!taskId) return null;

    return (
        <Card className="mt-6 shadow-sm border-neutral-200 rounded-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-neutral-100/80 border-b border-neutral-200">
                <button
                    type="button"
                    className="flex items-center gap-2 text-neutral-700 font-medium text-base"
                    onClick={() => setIsOpen((prev) => !prev)}
                >
                    <span>Child work items</span>
                    {totalCount > 0 && (
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-neutral-500 border border-neutral-200">
                            {totalCount}
                        </span>
                    )}
                    {isFetching && <Loader2 size={13} className="animate-spin text-neutral-400" />}
                </button>

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-neutral-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Add a child work item"
                        onClick={() => {
                            setIsOpen(true);
                            setShowForm(true);
                        }}
                    >
                        <Plus size={16} />
                    </Button>
                    <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
                        {isOpen
                            ? <ChevronDown className="text-neutral-500 h-5 w-5" />
                            : <ChevronUp className="text-neutral-500 h-5 w-5" />}
                    </button>
                </div>
            </CardHeader>

            {isOpen && (
                <CardContent className="bg-neutral-200/10 py-3 px-2 flex flex-col gap-1 rounded-b-md">
                    {children.length === 0 && !isFetching && !showForm && (
                        <p className="px-2 py-3 text-sm text-neutral-400">
                            Nothing is under this work item yet.
                        </p>
                    )}

                    {children.map((child) => {
                        const status = statusBySlug.get(child.task_status);
                        const childKey = child.project_key && child.taskNumber
                            ? `${child.project_key}-${child.taskNumber}`
                            : null;
                        return (
                            <button
                                key={child._id}
                                type="button"
                                onClick={() => onOpenChild?.(child._id)}
                                className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-left hover:bg-neutral-100 transition-colors"
                            >
                                <span
                                    className={cn("h-2 w-2 shrink-0 rounded-full", status?.color || "bg-neutral-300")}
                                    title={status?.name}
                                />
                                {childKey && (
                                    <span className="shrink-0 text-[11px] font-semibold text-neutral-400">{childKey}</span>
                                )}
                                <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{child.summary}</span>
                                {status?.name && (
                                    <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                        {status.name}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {payload?.hasMore && (
                        <p className="px-2 pt-1 text-[11px] text-neutral-400">
                            Showing the first {children.length} of {totalCount}. Open the Timeline to see the rest.
                        </p>
                    )}

                    {showForm ? (
                        <div className="flex items-center gap-2 px-2 pt-2">
                            <Input
                                autoFocus
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What needs to be done?"
                                disabled={isCreating}
                                className="h-9 flex-1 text-sm"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="teritary"
                                className="h-9 shrink-0"
                                disabled={isCreating}
                                onClick={handleCreate}
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0"
                                disabled={isCreating}
                                onClick={() => {
                                    setShowForm(false);
                                    setSummary("");
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-neutral-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                        >
                            <Plus size={15} /> Add a child work item
                        </button>
                    )}
                </CardContent>
            )}
        </Card>
    );
};

export default React.memo(ChildIssuesSection);
