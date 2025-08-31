import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";

// Dummy Data
const sprints = [
  {
    id: 1,
    sprintName: "Authentication Sprint",
    date: "2025-08-20",
    status: "In Progress",
    tasks: [
      { id: "t1", title: "Login Page", status: "Done", assignee: "Alice" },
      { id: "t2", title: "JWT Auth Setup", status: "In Progress", assignee: "Bob" },
    ],
  },
  {
    id: 2,
    sprintName: "Dashboard Sprint",
    date: "2025-09-01",
    status: "Pending",
    tasks: [
      { id: "t3", title: "Dashboard API", status: "Pending", assignee: "Charlie" },
      { id: "t4", title: "UI Components", status: "Pending", assignee: "David" },
    ],
  },
];

export default function SprintTable() {
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {sprints.map((sprint) => (
        <div
          key={sprint.id}
          className="rounded-xl border shadow-sm bg-white overflow-hidden"
        >
          {/* Sprint Header Row */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => toggleExpand(sprint.id)}>
                {expanded[sprint.id] ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              <span className="font-semibold">{sprint.sprintName}</span>
              <span className="text-sm text-gray-500">{sprint.date}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Status */}
              <span
                className={`px-2 py-1 rounded text-xs ${sprint.status === "In Progress"
                  ? "bg-blue-100 text-blue-700"
                  : sprint.status === "Done"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                  }`}
              >
                {sprint.status}
              </span>

              {/* Complete Sprint */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => alert(`Completed ${sprint.sprintName}`)}
              >
                Complete Sprint
              </Button>

              {/* Actions */}
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expandable Task Table */}
          {expanded[sprint.id] && (
            <div>
              <Table>
                <TableBody >
                  {sprint.tasks.map((task) => (

                    // <div  className="p-2">
                    <TableRow key={task.id}>
                      {/* Task Name */}
                      <TableCell className="w-1/2 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500 font-normal text-base hover:text-blue-600 hover:underline">
                            SCRUM - 1
                          </span>

                          <span className="text-neutral-500 font-semibold text-sm">
                            {task.title}
                          </span>
                        </div>
                      </TableCell>

                      {/* Task Status */}
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs ${task.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : task.status === "Done"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {task.status}
                        </span>
                      </TableCell>

                      {/* Assignee */}
                      <TableCell className="text-right text-gray-600">
                        {task.assignee}
                      </TableCell>
                    </TableRow>

                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
