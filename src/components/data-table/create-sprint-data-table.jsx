import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronRight, ClipboardX, GripVertical, MoreHorizontal, PencilLine } from "lucide-react";
import { useGetSprintDetailsWithTasksQuery, useReorderSprintMutation } from "@/redux/graphql_api/sprint";
import useDateFormatter from "@/hooks/useDateFormatter";
import TooltipWrapper from "../common/TooltipWrapper";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useProjectData } from "@/hooks/useProjectData";
import CreateSprint from "@/layout/backlog-layout/common-component/CreateSprint";

// ✨ 1. CREATE A NEW COMPONENT FOR THE LIST ITEM
const SprintItem = ({ sprint, expanded, onToggleExpand, onEditSprint, onDragEnd, onDragStart }) => {
  // ✅ CORRECT: The hook is now called at the top level of its own component.
  const controls = useDragControls();
  const hasDate = sprint.date !== null;

  return (
    <Reorder.Item
      key={sprint.id}
      value={sprint}
      dragListener={false}
      dragControls={controls}
      layout
      onDragStart={onDragStart}
      onDragEnd={onDragEnd} // ✅ new prop passed down
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border bg-white overflow-hidden cursor-default"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              controls.start(e);
            }}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleExpand}>
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Button>
          <span className="font-medium text-neutral-500 text-lg">{sprint.sprintName}</span>
          {hasDate ? (
            <span className="text-sm text-gray-500">{sprint.date}</span>
          ) : (
            <Button
              size="xs"
              variant="advanceMuted"
              onClick={() => alert(`Add date for ${sprint.sprintName}`)}
            >
              Add date <PencilLine size={13} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="advanceMuted" onClick={() => alert(`Completed ${sprint.sprintName}`)}>
            Complete sprint
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <TooltipWrapper content={"More actions"} disableFocusListener>
                  <MoreHorizontal className="w-4 h-4" />
                </TooltipWrapper>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-30 rounded-sm"
              align="end"
              sideOffset={13}
            >
              <DropdownMenuItem
                className="gap-2 py-3 px-3 cursor-pointer"
                onSelect={onEditSprint}
              >
                <span className="text-neutral-500 font-medium">Edit sprint</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 py-3 px-3 cursor-pointer"
                onSelect={onEditSprint}
              >
                <span className="text-neutral-500 font-medium">Delete sprint</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 py-3 px-3 cursor-pointer"
                onSelect={onEditSprint}
              >
                <span className="text-neutral-500 font-medium">Reorder sprint</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {sprint.tasks && sprint.tasks.length > 0 ? (
            <Table>
              <TableBody>
                {sprint.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{/* Task details */}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </Reorder.Item>
  );
};

// ✨ 2. UPDATE THE PARENT COMPONENT
export default function SprintTable() {
  const [expanded, setExpanded] = useState({});
  const { data: getSprint } = useGetSprintDetailsWithTasksQuery();
  const [reorderSprint] = useReorderSprintMutation();
  const formattedDate = useDateFormatter("dd MMM");
  const [openSprint, setOpenSprint] = useState(false);
  const [sprintId, setSprintId] = useState(null);
  const originalOrderRef = useRef(null);
  const initialSprints = useMemo(() => {
    if (!getSprint?.data?.getAllsprintWithTask?.sprint) {
      return [];
    }
    return getSprint.data.getAllsprintWithTask.sprint.map((sprint) => ({
      id: sprint._id,
      sprintName: sprint.name,
      date: sprint.startDate && sprint.endDate ? `${formattedDate(sprint.startDate)} - ${formattedDate(sprint.endDate)}` : null,
      status: sprint.status,
      tasks: sprint.tasks?.map((task) => ({
        id: task._id,
        title: task.name,
        status: task.status,
        assignee: task.assignee,
      })),
    }));
  }, [getSprint, formattedDate]);

  const [sprints, setSprints] = useState(() => initialSprints);

  useEffect(() => {
    if (initialSprints.length > 0) {
      setSprints(initialSprints);
    }
  }, [initialSprints]);

  useEffect(() => {
    const expandedState = initialSprints.reduce((acc, s) => {
      acc[s.id] = true;
      return acc;
    }, {});
    setExpanded(expandedState);
  }, [initialSprints]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditSprint = (id) => {
    setOpenSprint(true);
    console.log("openSprint", openSprint)
    setSprintId(id);
  };

  const handleDragEnd = () => {
    const originalSprints = originalOrderRef.current;
    if (!originalSprints) return;

    const newSprintsOrder = sprints;

    // Check if order actually changed
    const hasOrderChanged = originalSprints.some(
      (s, i) => s.id !== newSprintsOrder[i]?.id
    );
    if (!hasOrderChanged) return; // 🧠 Only fire if the sprint actually moved

    // Find the moved sprint
    const movedSprint = newSprintsOrder.find(
      (s, i) => s.id !== originalSprints[i]?.id
    );
    if (!movedSprint) return;

    const targetIndex = newSprintsOrder.findIndex((s) => s.id === movedSprint.id);
    const afterId = targetIndex > 0 ? newSprintsOrder[targetIndex - 1]?.id : null;
    const beforeId =
      targetIndex < newSprintsOrder.length - 1
        ? newSprintsOrder[targetIndex + 1]?.id
        : null;

    // ✅ Call API only once at drop
    reorderSprint({
      operationName: "reorderSprint",
      variables: { sprintId: movedSprint.id, beforeId, afterId },
    })
      .unwrap()
      .catch(() => setSprints(originalSprints));
  };

  return (
    <div className="flex flex-col gap-y-8">
      <AnimatePresence>
        {/* ✨ 3. onReorder now ONLY updates the UI state. No API call here. */}
        <Reorder.Group
          axis="y"
          values={sprints}
          onReorder={(newOrder) => setSprints(newOrder)}
          className="space-y-8"
        >

          {sprints.map((sprint) => (
            <SprintItem
              key={sprint.id}
              sprint={sprint}
              expanded={expanded[sprint.id]}
              onToggleExpand={() => toggleExpand(sprint.id)}
              onEditSprint={() => handleEditSprint(sprint.id)}
              onDragStart={() => (originalOrderRef.current = [...sprints])}
              onDragEnd={() => handleDragEnd()}
            />
          ))}
        </Reorder.Group>
        <CreateSprint isOpen={openSprint} onClose={() => setOpenSprint(false)} sprintId={sprintId} />
      </AnimatePresence>
    </div>
  );
}