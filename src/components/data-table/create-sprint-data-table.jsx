import React, { useState, useMemo } from 'react';
import { useReactTable, flexRender, getCoreRowModel } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";

const SprintManagement = () => {
  // Sample data
  const [data, setData] = useState([
    {
      id: '1',
      name: 'Sprint 1',
      startDate: '2023-10-01',
      tasks: [
        {
          id: '101',
          name: 'Implement auth system',
          type: 'story',
          status: 'inProgress',
          assignee: 'user1'
        },
        {
          id: '102',
          name: 'Fix login bug',
          type: 'bug',
          status: 'todo',
          assignee: null
        }
      ]
    },
    {
      id: '2',
      name: 'Sprint 2',
      startDate: '2023-10-15',
      tasks: [
        {
          id: '201',
          name: 'Dashboard UI',
          type: 'task',
          status: 'done',
          assignee: 'user2'
        }
      ]
    }
  ]);

  const [users] = useState([
    { id: 'user1', name: 'John Doe', avatar: '' },
    { id: 'user2', name: 'Jane Smith', avatar: '' },
    { id: 'user3', name: 'Mike Johnson', avatar: '' }
  ]);

  const [newSprintName, setNewSprintName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskNameEdit, setTaskNameEdit] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState({});

  // Calculate task stats for a sprint
  const getTaskStats = (tasks) => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'inProgress').length,
      done: tasks.filter(t => t.status === 'done').length,
      bugs: tasks.filter(t => t.type === 'bug').length,
      stories: tasks.filter(t => t.type === 'story').length,
      tasks: tasks.filter(t => t.type === 'task').length
    };
  };

  // Toggle date picker for a sprint
  const toggleDatePicker = (sprintId) => {
    setDatePickerOpen(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  // Add a new sprint
  const addSprint = () => {
    if (newSprintName.trim()) {
      const newSprint = {
        id: Date.now().toString(),
        name: newSprintName,
        startDate: '',
        tasks: []
      };
      setData([...data, newSprint]);
      setNewSprintName('');
    }
  };

  // Complete a sprint
  const completeSprint = (sprintId) => {
    setData(data.map(sprint => 
      sprint.id === sprintId 
        ? { ...sprint, status: 'completed', endDate: new Date().toISOString() } 
        : sprint
    ));
  };

  // Add a task to a sprint
  const addTask = (sprintId) => {
    const newTask = {
      id: Date.now().toString(),
      name: 'New Task',
      type: 'task',
      status: 'todo',
      assignee: null
    };
    setData(data.map(sprint => 
      sprint.id === sprintId 
        ? { ...sprint, tasks: [...sprint.tasks, newTask] } 
        : sprint
    ));
  };

  // Update a task
  const updateTask = (sprintId, taskId, updates) => {
    setData(data.map(sprint => 
      sprint.id === sprintId 
        ? { 
            ...sprint, 
            tasks: sprint.tasks.map(task => 
              task.id === taskId 
                ? { ...task, ...updates } 
                : task
            ) 
          } 
        : sprint
    ));
  };

  // Define columns for TanStack Table
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Sprint Name',
      cell: ({ row }) => (
        <div className="font-bold">{row.original.name}</div>
      )
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => {
        const stats = getTaskStats(row.original.tasks);
        return (
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              Tasks: {stats.tasks}
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Stories: {stats.stories}
            </span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
              Bugs: {stats.bugs}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'date',
      header: 'Start Date',
      cell: ({ row }) => {
        const sprint = row.original;
        return (
          <div className="flex items-center gap-2">
            {sprint.startDate ? (
              <span>{sprint.startDate}</span>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleDatePicker(sprint.id)}
                >
                  Add Date
                </Button>
                {datePickerOpen[sprint.id] && (
                  <Calendar
                    mode="single"
                    selected={sprint.startDate ? new Date(sprint.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        setData(data.map(s => 
                          s.id === sprint.id 
                            ? { ...s, startDate: formattedDate } 
                            : s
                        ));
                        toggleDatePicker(sprint.id);
                      }
                    }}
                    className="absolute z-10 bg-white border rounded-md shadow-lg"
                  />
                )}
              </>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const sprint = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => completeSprint(sprint.id)}>
                Complete Sprint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addTask(sprint.id)}>
                Add Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ], [datePickerOpen, data]);

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sprint Management</h1>
      
      {/* Main table for sprints using ShadCN Table wrapper */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => {
              const sprint = row.original;
              return (
                <React.Fragment key={row.id}>
                  {/* Sprint row */}
                  <TableRow>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Tasks for this sprint */}
                  {sprint.tasks.map(task => (
                    <TableRow key={task.id} className="bg-gray-50">
                      <TableCell>
                        <Select 
                          value={task.type}
                          onValueChange={(value) => updateTask(sprint.id, task.id, { type: value })}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="story">Story</SelectItem>
                            <SelectItem value="bug">Bug</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {editingTaskId === task.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={taskNameEdit}
                              onChange={(e) => setTaskNameEdit(e.target.value)}
                              className="h-8"
                            />
                            <Button 
                              size="sm"
                              onClick={() => {
                                updateTask(sprint.id, task.id, { name: taskNameEdit });
                                setEditingTaskId(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-blue-500"
                            onClick={() => {
                              setTaskNameEdit(task.name);
                              setEditingTaskId(task.id);
                            }}
                          >
                            {task.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={task.status}
                          onValueChange={(value) => updateTask(sprint.id, task.id, { status: value })}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0">
                              {task.assignee ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={users.find(u => u.id === task.assignee)?.avatar} />
                                  <AvatarFallback>
                                    {users.find(u => u.id === task.assignee)?.name.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  +
                                </div>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {users.map(user => (
                              <DropdownMenuItem 
                                key={user.id}
                                onClick={() => updateTask(sprint.id, task.id, { assignee: user.id })}
                              >
                                {user.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Add new sprint form */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Create New Sprint</h2>
        <div className="flex gap-4">
          <Input
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            placeholder="Sprint name"
          />
          <Button onClick={addSprint}>
            Create Sprint
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SprintManagement;