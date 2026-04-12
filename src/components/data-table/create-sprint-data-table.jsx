import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronRight, ClipboardX, GripVertical, MoreHorizontal, PencilLine } from "lucide-react";
import { useGetSprintDetailsWithTasksQuery, useReorderSprintMutation } from "@/redux/graphql_api/sprint";
import { useUpdateIssueMutation } from "@/redux/graphql_api/task";
import useDateFormatter from "@/hooks/useDateFormatter";
import TooltipWrapper from "../common/TooltipWrapper";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useProjectData } from "@/hooks/useProjectData";
import CreateSprint from "@/layout/backlog-layout/common-component/CreateSprint";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TaskRow from './task-row';
import ShowToast from "../common/ShowToast";
import AddFlag from "../common/AddFlag";
import StatusBar from "../common/StatusBar";

// ✨ 1. CREATE A NEW COMPONENT FOR THE LIST ITEM
const SprintItem = ({
  sprint, expanded, onToggleExpand, onEditSprint, onDragEnd, onDragStart,
  currentProjectId, workTypeMap, taskTypes, importanceTypes,
  editingTaskId, summaryValues, assigneeStates, addFlagRef,
  onRowClick, onSummaryClick, onSummaryChange, onSummaryKeyDown, onSummaryBlur,
  onAvatarClick, onAssigneeChange, toggleAssigneeOpen, changeTaskStatus,
  changeImportance, getWorkItemMenuItems, searchQuery
}) => {
  // ✅ CORRECT: The hook is now called at the top level of its own component.
  const controls = useDragControls();
  const hasDate = sprint.date !== null;

  const ROW_HEIGHT = 56;
  const parentRef = useRef(null);

  const [groupByStatus, setGroupByStatus] = useState(() => {
    const saved = localStorage.getItem(`sprint_groupby_status_${sprint.id}`);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(`sprint_groupby_status_${sprint.id}`, JSON.stringify(groupByStatus));
  }, [groupByStatus, sprint.id]);

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroupExpand = useCallback((statusValue) => {
    setExpandedGroups(prev => ({
      ...prev,
      [statusValue]: prev[statusValue] === false ? true : false
    }));
  }, []);

  const flattenedItems = useMemo(() => {
    const issue = sprint.tasks?.data || [];
    if (!groupByStatus || issue.length === 0) return issue;

    const grouped = {};
    for (let i = 0; i < taskTypes.length; i++) {
      grouped[taskTypes[i].value] = [];
    }

    const unmapped = [];

    for (let i = 0; i < issue.length; i++) {
      const task = issue[i];
      if (task.task_status && grouped[task.task_status] !== undefined) {
        grouped[task.task_status].push(task);
      } else {
        unmapped.push(task);
      }
    }

    const flatList = [];
    for (let i = 0; i < taskTypes.length; i++) {
      const type = taskTypes[i];
      const tasksOfThisType = grouped[type.value];
      if (tasksOfThisType && tasksOfThisType.length > 0) {
        const isExpanded = expandedGroups[type.value] !== false;
        flatList.push({ isHeader: true, statusValue: type.value, statusName: type.name, statusColor: type.color, count: tasksOfThisType.length, isExpanded });
        if (isExpanded) {
          for (let j = 0; j < tasksOfThisType.length; j++) {
            flatList.push(tasksOfThisType[j]);
          }
        }
      }
    }

    if (unmapped.length > 0) {
      const isExpanded = expandedGroups['Unmapped'] !== false;
      flatList.push({ isHeader: true, statusValue: 'Unmapped', statusName: 'Unmapped', statusColor: 'bg-gray-200', count: unmapped.length, isExpanded });
      if (isExpanded) {
        for (let j = 0; j < unmapped.length; j++) {
          flatList.push(unmapped[j]);
        }
      }
    }

    return flatList;
  }, [sprint.tasks, groupByStatus, taskTypes, expandedGroups]);

  const itemsToRender = groupByStatus ? flattenedItems : (sprint.tasks?.data || []);

  const rowVirtualizer = useVirtualizer({
    count: itemsToRender.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

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
      <div className="flex flex-col bg-gray-50 border-b">
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-3 gap-y-3 gap-x-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] overflow-hidden">
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                controls.start(e);
              }}
              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0"
            >
              <GripVertical size={18} />
            </div>
            <Button variant="ghost" size="icon" onClick={onToggleExpand} className="shrink-0 h-8 w-8">
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </Button>
            <span className="font-medium text-neutral-600 text-[15px] sm:text-lg truncate">{sprint.sprintName}</span>

            {hasDate ? (
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap hidden md:inline-block ml-2 shrink-0">{sprint.date}</span>
            ) : (
              <Button
                size="xs"
                variant="advanceMuted"
                onClick={() => alert(`Add date for ${sprint.sprintName}`)}
                className="hidden md:flex ml-2 shrink-0"
              >
                Add date <PencilLine size={13} />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 overflow-x-auto min-w-0">
            <div className="shrink-0 flex items-center pr-1 lg:pr-2">
              <StatusBar statusCount={sprint.statusCount} taskTypes={taskTypes} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="advanceMuted" onClick={() => alert(`Completed ${sprint.sprintName}`)} className="shrink-0 h-8 px-3 text-xs sm:text-sm">
                Complete sprint
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <TooltipWrapper content={"More actions"} disableFocusListener>
                      <MoreHorizontal className="w-4 h-4" />
                    </TooltipWrapper>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-sm"
                  align="end"
                  sideOffset={13}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`group-by-status-${sprint.id}`} className="text-sm font-medium text-neutral-700 cursor-pointer">
                        Group by Status
                      </Label>
                      <Switch
                        id={`group-by-status-${sprint.id}`}
                        checked={groupByStatus}
                        onCheckedChange={setGroupByStatus}
                      />
                    </div>
                  </div>
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
        </div>

        {/* Date on mobile */}
        <div className="md:hidden flex items-center px-[42px] pb-3 -mt-3">
          {hasDate ? (
            <span className="text-xs text-gray-400">{sprint.date}</span>
          ) : (
            <span
              className="text-[11px] text-blue-500 cursor-pointer hover:underline flex items-center gap-1"
              onClick={() => alert(`Add date for ${sprint.sprintName}`)}
            >
              Add date <PencilLine size={10} />
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {sprint.tasks && sprint?.tasks?.data?.length > 0 ? (
            <div
              ref={parentRef}
              className="max-h-[300px] overflow-auto border-t"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  minWidth: '950px',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const task = itemsToRender[virtualRow.index];
                  if (!task) return null;

                  if (task.isHeader) {
                    return (
                      <div
                        key={`header-${sprint.id}-${task.statusName}-${virtualRow.index}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${ROW_HEIGHT}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="flex items-center px-4 py-2 bg-transparent cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => toggleGroupExpand(task.statusValue)}
                      >
                        <div className="flex items-center gap-2 pt-4">
                          {task.isExpanded ? (
                            <ChevronDown size={18} className="text-neutral-500 hover:text-neutral-700" />
                          ) : (
                            <ChevronRight size={18} className="text-neutral-500 hover:text-neutral-700" />
                          )}
                          <span className="text-[13px] font-semibold text-neutral-700 uppercase">
                            {task.statusName}
                          </span>
                          <span className="px-[6px] py-[2px] rounded-full text-[11px] font-semibold bg-neutral-200 text-neutral-600 leading-none flex items-center justify-center">
                            {task.count}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <TaskRow
                      key={task._id}
                      task={task}
                      virtualRow={virtualRow}
                      workTypeMap={workTypeMap}
                      editingTaskId={editingTaskId}
                      summaryValue={summaryValues[task._id]}
                      assigneeState={assigneeStates[task._id]}
                      taskTypes={taskTypes}
                      importanceTypes={importanceTypes}
                      currentProjectId={currentProjectId}
                      addFlagRefs={addFlagRef}
                      onRowClick={onRowClick}
                      onSummaryClick={onSummaryClick}
                      onSummaryChange={onSummaryChange}
                      onSummaryKeyDown={onSummaryKeyDown}
                      onSummaryBlur={onSummaryBlur}
                      onAvatarClick={onAvatarClick}
                      onAssigneeChange={onAssigneeChange}
                      toggleAssigneeOpen={toggleAssigneeOpen}
                      changeTaskStatus={changeTaskStatus}
                      changeImportance={changeImportance}
                      getWorkItemMenuItems={getWorkItemMenuItems}
                      searchQuery={searchQuery}
                    />
                  );
                })}
              </div>
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
    </Reorder.Item>
  );
};

// ✨ 2. UPDATE THE PARENT COMPONENT
export default function SprintTable({ projectData, searchQuery, filteredSprints }) {
  const [expanded, setExpanded] = useState({});
  const { data: getSprint } = useGetSprintDetailsWithTasksQuery();
  const [reorderSprint] = useReorderSprintMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateIssueMutation();
  const formattedDate = useDateFormatter("dd MMM");
  const [openSprint, setOpenSprint] = useState(false);
  const [sprintId, setSprintId] = useState(null);
  const originalOrderRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [summaryValues, setSummaryValues] = useState({});
  const [assigneeStates, setAssigneeStates] = useState({});
  const [currentFlagTask, setCurrentFlagTask] = useState(null);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const addFlagRef = useRef(null);

  const handleUpdateTask = useCallback(async (key, value, id, fullDetail) => {
    try {
      const payload = {
        operationName: "updateTask",
        variables: {
          taskId: id,
          key: key,
          value: value,
          ...(fullDetail !== undefined && { fullDetail })
        }
      };
      const response = await updateTask(payload).unwrap();
      return response;
    } catch (error) {
      throw error;
    }
  }, [updateTask]);

  const { currentProject, workType, importance, workFlow } = projectData || {};
  const currentProjectId = currentProject?._id;

  const workTypeMap = useMemo(() => {
    return new Map((workType || []).map((status, index) => [
      status.slug,
      { id: index + 1, name: status.name, value: status.slug, color: status.color, icon: status.icon }
    ]));
  }, [workType]);

  const taskTypes = useMemo(() =>
    (workFlow || []).map((status, index) => ({
      id: index + 1,
      name: status.name,
      value: status.slug,
      color: status.color
    })),
    [workFlow]
  );

  const importanceTypes = useMemo(() =>
    (importance || []).map((imp, index) => ({
      id: index + 1,
      name: imp.name,
      value: imp.slug,
      color: imp.color
    })),
    [importance]
  );

  const handleRowClick = useCallback((e, id) => {
    if (e.target.closest('[data-no-row-click]')) return;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("issueId", id);
      return newParams;
    });
  }, [setSearchParams]);

  const handleSummaryClick = useCallback((e, taskId) => {
    e.stopPropagation();
    setEditingTaskId(taskId);
  }, [setEditingTaskId]);

  const handleSummaryChange = useCallback((e, taskId) => {
    setSummaryValues(prev => ({
      ...prev,
      [taskId]: e.target.value
    }));
  }, [setSummaryValues]);

  const saveSummaryAndClose = useCallback(async (task) => {
    const trimmedSummary = summaryValues[task._id]?.trim();

    if (!trimmedSummary || trimmedSummary === task.summary) {
      setSummaryValues(prev => ({
        ...prev,
        [task._id]: task.summary
      }));
      setEditingTaskId(null);
      return;
    }

    try {
      await handleUpdateTask('summary', trimmedSummary, task._id);
    } catch (error) {
      setSummaryValues(prev => ({
        ...prev,
        [task._id]: task.summary
      }));
      ShowToast.error("Failed to update summary.");
    } finally {
      setEditingTaskId(null);
    }
  }, [summaryValues, handleUpdateTask, setSummaryValues, setEditingTaskId]);

  const handleSummaryKeyDown = useCallback((e, task) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSummaryAndClose(task);
    }
  }, [saveSummaryAndClose]);

  const handleSummaryBlur = useCallback((e, task) => {
    e.stopPropagation();
    saveSummaryAndClose(task);
  }, [saveSummaryAndClose]);

  const handleAvatarClick = useCallback((e, taskId) => {
    e.stopPropagation();
    setAssigneeStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isOpen: !prev[taskId]?.isOpen
      }
    }));
  }, [setAssigneeStates]);

  const handleAssigneeChange = useCallback((selectedMember, task) => {
    setAssigneeStates(prev => ({
      ...prev,
      [task._id]: {
        isOpen: false,
        assignee: selectedMember
      }
    }));

    const assignee = selectedMember?._id;
    if (assignee !== task?.assigneeDetail?._id) {
      handleUpdateTask('assigneeId', assignee, task._id);
    }
  }, [handleUpdateTask, setAssigneeStates]);

  const toggleAssigneeOpen = useCallback((taskId, isOpen) => {
    setAssigneeStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isOpen
      }
    }));
  }, [setAssigneeStates]);

  const changeTaskStatus = useCallback((status, taskId) => {
    handleUpdateTask("task_status", status, taskId);
  }, [handleUpdateTask]);

  const changeImportance = useCallback((imp, taskId) => {
    handleUpdateTask("importance", imp, taskId);
  }, [handleUpdateTask]);

  const getWorkItemMenuItems = useCallback((task) => [
    {
      id: task.isFlagged ? 'remove-flag' : 'add-flag',
      label: task.isFlagged ? 'Remove flag' : 'Add flag',
      onSelect: (e) => {
        e?.stopPropagation?.();

        if (task.isFlagged) {
          handleUpdateTask('isFlagged', "false", task._id);
        } else {
          setCurrentFlagTask({
            _id: task._id,
            workType: task.work_type,
            project_key: task.project_key,
            taskNumber: task.taskNumber,
            summary: task.summary
          });
          setIsFlagDialogOpen(true);
        }
      }
    }
  ], [handleUpdateTask, setCurrentFlagTask, setIsFlagDialogOpen]);



  const initialSprints = useMemo(() => {
    if (!getSprint?.data?.getAllsprintWithTask?.sprint) {
      return [];
    }
    return getSprint.data.getAllsprintWithTask.sprint.map((sprint) => ({
      id: sprint._id,
      sprintName: sprint.name,
      date: sprint.startDate && sprint.endDate ? `${formattedDate(sprint.startDate)} - ${formattedDate(sprint.endDate)}` : null,
      status: sprint.status,
      tasks: sprint.tasks || [],
      statusCount: sprint.tasks?.statusCount || []
    }));
  }, [getSprint, formattedDate]);

  const [sprints, setSprints] = useState(() => initialSprints);

  useEffect(() => {
    if (searchQuery) {
      const fdMap = new Map((filteredSprints || []).map(fs => [fs.sprintId, fs.tasks]));
      const updated = initialSprints.map(s => {
        const fTasks = fdMap.get(s.id) || [];
        return {
          ...s,
          tasks: { data: fTasks }
        }
      });
      setSprints(updated);
    } else {
      if (initialSprints.length > 0) {
        setSprints(initialSprints);
      }
    }
  }, [searchQuery, filteredSprints, initialSprints]);

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
          className="space-y-4"
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
              currentProjectId={currentProjectId}
              workTypeMap={workTypeMap}
              taskTypes={taskTypes}
              importanceTypes={importanceTypes}
              editingTaskId={editingTaskId}
              summaryValues={summaryValues}
              assigneeStates={assigneeStates}
              addFlagRef={addFlagRef}
              onRowClick={handleRowClick}
              onSummaryClick={handleSummaryClick}
              onSummaryChange={handleSummaryChange}
              onSummaryKeyDown={handleSummaryKeyDown}
              onSummaryBlur={handleSummaryBlur}
              onAvatarClick={handleAvatarClick}
              onAssigneeChange={handleAssigneeChange}
              toggleAssigneeOpen={toggleAssigneeOpen}
              changeTaskStatus={changeTaskStatus}
              changeImportance={changeImportance}
              getWorkItemMenuItems={getWorkItemMenuItems}
              searchQuery={searchQuery}
            />
          ))}
        </Reorder.Group>
        <CreateSprint isOpen={openSprint} onClose={() => setOpenSprint(false)} sprintId={sprintId} />
        {
          currentFlagTask && (
            <AddFlag
              isOpen={isFlagDialogOpen}
              setIsOpen={setIsFlagDialogOpen}
              taskInfo={currentFlagTask}
              isFlagged={true}
              onConfirm={(reason) => {
                handleUpdateTask('isFlagged', true, currentFlagTask._id);
                setIsFlagDialogOpen(false);
                setCurrentFlagTask(null);
              }}
              onCancel={() => {
                setIsFlagDialogOpen(false);
                setCurrentFlagTask(null);
              }}
            />
          )
        }
      </AnimatePresence>
    </div>
  );
}