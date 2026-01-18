import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronRight, ClipboardX, GripVertical, MoreHorizontal, PencilLine } from "lucide-react";
import { useGetSprintDetailsWithTasksQuery, useReorderSprintMutation } from "@/redux/graphql_api/sprint";
import useDateFormatter from "@/hooks/useDateFormatter";
import TooltipWrapper from "../common/TooltipWrapper";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import IssueRow from "./IssueRow";

const BacklogTable = ({ issue, expanded, onToggleExpand, onEditSprint }) => {
    console.log("issue------------", issue)
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
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {issue && issue?.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-[1100px] table-fixed">
                                <TableBody>
                                    {issue?.map((task) => (
                                        <TableRow key={task?._id}>
                                            <IssueRow issue={task} />
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="space-y-2 my-4 flex items-center justify-center flex-col">
                            <ClipboardX size={60} className="text-neutral-400 " />
                            <span className="text-center text-sm text-gray-500">
                                No tasks have been added to this sprint.
                            </span>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default BacklogTable