import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, ClipboardX, GripVertical, MoreHorizontal, PencilLine } from "lucide-react";
import IssueRow from "./IssueRow";
import { useVirtualizer } from "@tanstack/react-virtual";
import IssueRowSkeleton from "./IssueRowSkeleton";
import { useSearchParams } from "react-router-dom";
import { useUpdateIssueMutation } from "@/redux/graphql_api/task";

const ROW_HEIGHT = 56

const BacklogTable = ({ issue, expanded, onToggleExpand, onEditSprint, userData, projectData }) => {
    console.log("issue------------", issue)
    const [updateTask, { isLoading }] = useUpdateIssueMutation()
    const [searchParams, setSearchParams] = useSearchParams()

    const parentRef = useRef(null)
    const rowVirtualizer = useVirtualizer({
        count: issue?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 15,
    })

    const handleUpdateTask = useCallback(async (key, value, id) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: id,
                    key: key,
                    value: value,
                    changeBy: userData?.member_id
                }
            }
            const response = await updateTask(payload).unwrap()
            console.log("response", response)
            return response;
        } catch (error) {
            console.log("error", error)
            throw error;
        }
    }, [updateTask, userData?.member_id]);

    const handleRowClick = useCallback((e, id) => {
        if (e.target.closest('[data-no-row-click]')) return;
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("issueId", id);
            return newParams;
        });
    }, [setSearchParams]);

    return (
        <div
            className="rounded-xl border bg-white overflow-hidden cursor-default"
        >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onToggleExpand}>
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <Button size="sm" variant="advanceMuted">
                        Create task
                    </Button>
                </div>
            </div>
            {expanded && (
                <div className="w-full">
                    {issue && issue?.length > 0 ? (
                        <div
                            ref={parentRef}
                            className="h-[600px] overflow-auto"
                        >
                            <div className="min-w-[1200px]">
                                <table className="w-full table-fixed">
                                    <tbody
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            position: 'relative',
                                            display: 'block',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const task = issue[virtualRow?.index];
                                            return (
                                                <tr
                                                    key={task._id}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: `${ROW_HEIGHT}px`,
                                                        transform: `translateY(${virtualRow.start}px)`,
                                                        display: 'table',
                                                        tableLayout: 'fixed',
                                                    }}
                                                >

                                                    {
                                                        task ?
                                                            (
                                                                <IssueRow
                                                                    issue={task}
                                                                    projectData={projectData}
                                                                    onUpdateTask={handleUpdateTask}
                                                                    rowClick={handleRowClick}
                                                                />
                                                            ) : (
                                                                <IssueRowSkeleton />
                                                            )
                                                    }


                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center flex-col gap-2">
                            <ClipboardX size={60} className="text-neutral-400" />
                            <span className="text-center text-sm text-gray-500">
                                No tasks have been added to this backlog.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BacklogTable