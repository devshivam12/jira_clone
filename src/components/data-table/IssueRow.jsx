import React, { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Pencil, MoreHorizontal } from "lucide-react";
import WorkSelector from "../common/WorkSelector";
import ManageAvatar from "../common/ManageAvatar";
import CommonDropdownMenu from "../common/CommonDropdownMenu";

const TaskRow = ({
    task,
    top,
    height,
    workType,
    taskTypes,
    importanceTypes,
    projectId,
    onRowClick,
    onUpdateTask
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState(task.summary);
    const [menuOpen, setMenuOpen] = useState(false);

    const saveSummary = async () => {
        if (summary.trim() !== task.summary) {
            await onUpdateTask("summary", summary.trim(), task._id);
        }
        setIsEditing(false);
    };

    return (
        <div
            className="flex items-center border-b hover:bg-gray-50"
            style={{
                position: "absolute",
                top,
                height,
                width: "100%"
            }}
            onClick={() => onRowClick(task._id)}
        >
            {/* ID */}
            <div className="w-[160px] px-2 flex items-center gap-2">
                <div className={`w-6 h-6 rounded ${workType?.color}`} />
                <span className="font-semibold">
                    {task.project_key}-{task.taskNumber}
                </span>
            </div>

            {/* Summary */}
            <div className="flex-1 px-2">
                {isEditing ? (
                    <Input
                        autoFocus
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        onBlur={saveSummary}
                        onKeyDown={e => e.key === "Enter" && saveSummary()}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="truncate">{task.summary}</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={e => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                        >
                            <Pencil size={14} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="w-[160px] px-2" onClick={e => e.stopPropagation()}>
                <WorkSelector
                    initialValue={task.task_status}
                    workTypes={taskTypes}
                    onChange={v => onUpdateTask("task_status", v, task._id)}
                />
            </div>

            {/* Importance */}
            <div className="w-[160px] px-2" onClick={e => e.stopPropagation()}>
                <WorkSelector
                    initialValue={task.importance}
                    workTypes={importanceTypes}
                    onChange={v => onUpdateTask("importance", v, task._id)}
                />
            </div>

            {/* Flag */}
            <div className="w-[60px] text-center">
                {task.isFlagged && <Flag size={14} className="text-red-500" />}
            </div>

            {/* Actions */}
            <div className="w-[56px]" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" onClick={() => setMenuOpen(true)}>
                    <MoreHorizontal size={16} />
                </Button>

                {menuOpen && (
                    <CommonDropdownMenu
                        onOpenChange={setMenuOpen}
                        items={[
                            {
                                label: task.isFlagged ? "Remove flag" : "Add flag",
                                onSelect: () =>
                                    onUpdateTask("isFlagged", !task.isFlagged, task._id)
                            }
                        ]}
                    />
                )}
            </div>
        </div>
    );
};

export default memo(TaskRow);
