import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Plus, X, Check, BookMarked, BookMarkedIcon, Bookmark, Bug, Ellipsis, SquareArrowOutUpRight, Pencil, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DottedSeparator } from '@/components/dotted-separator';
import SprintManagement from '@/components/data-table/create-sprint-data-table';
import SprintManagementTwo from '@/components/data-table/create-sprint-data-table-1';



import { MoreHorizontal } from "lucide-react"
import { Checkbox } from '@/components/ui/checkbox';




const progressTask = [
  { title: "Progress", color: "bg-neutral-500", value: "0" },
  { title: "In progress", color: "bg-blue-500", value: "1" },
  { title: "Done", color: "bg-green-500", value: "2" },
];

const labels = [
  "feature",
  "bug",
  "enhancement",
  "documentation",
  "design",
  "question",
  "maintenance",
]

const CreateBacklog = ({ createSprint, onIssueClick, selectedIssue, setSelectedIssue }) => {
  const [userData, setUserData] = useState(() => {
    const storeData = localStorage.getItem("userData");
    return storeData ? JSON.parse(storeData) : null
  })
  console.log("selectedIssue", selectedIssue)
  const [isExpand, setIsExpand] = useState(false);
  const [createIssue, setCreateIssue] = useState(false);
  const [issueType, setIssueType] = useState('story')
  const [issueName, setIssueName] = useState("")
  const [submittedIssue, setSubmittedIssue] = useState([])
  // const [selectedIssue, setSelectedIssue] = useState(false)
  const [selectProgress, setSelectProgress] = useState('to_do')

  const [editIssue, setEditIssue] = useState(null)
  const [editText, setEditText] = useState("")
  const [originalText, setOriginalText] = useState("")

  const showInputBox = () => {
    setCreateIssue(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    if (issueName && issueType) {
      const newIssue = {
        id: submittedIssue.length,
        name: issueName,
        type: issueType
      }
      setSubmittedIssue([...submittedIssue, newIssue])
      setIssueName("")
      setIssueType('story')
      setCreateIssue(false)
    }
  }

  const handleIssueClick = (id) => {
    const issue = submittedIssue.find(issue => issue.id === id);
    onIssueClick(issue); // Pass the selected issue to the parent
  }

  const handleEditClick = (id, changeText) => {
    setEditIssue(id)
    setEditText(changeText)
    setOriginalText(changeText)
  }

  const handleTextChange = (e) => {
    setEditText(e.target.value)
  }

  const handleSaveEdit = (id) => {
    const updatedIssue = submittedIssue.map((issue) =>
      issue.id === id ? { ...issue, name: editText } : issue
    );
    setSubmittedIssue(updatedIssue)
    setEditIssue(null)
  }

  const closeEditeInput = () => {
    setEditIssue(null)
    setEditText(originalText)
  }


  const avatarFallback = userData?.first_name.charAt(0).toUpperCase() ?? userData?.email.charAt(0).toUpperCase() ?? "U";


  


  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 min-h-[100px] transition-all duration-300 rounded-none ">
      {/* Header */}
      <SprintManagementTwo/>
      <SprintManagement />
      <div className="flex items-center justify-between">
        <CardHeader
          onClick={() => {
            setIsExpand(prev => !prev)
            setCreateIssue(false)
          }}
          className="p-0 cursor-pointer w-full transition-all duration-300"
        >
          <CardTitle className="flex items-center gap-2 w-full text-neutral-700 font-medium text-md transition hover:text-neutral-900">
            {isExpand ? (
              <ChevronDown size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            ) : (
              <ChevronRight size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            )}
            <span>Backlog</span>
            <span className="text-xs text-neutral-500 font-normal">(0 issues)</span>
          </CardTitle>
        </CardHeader>

        <div className='flex items-center gap-4'>
          {/* Status Indicators */}
          <div className="flex gap-x-2">
            {progressTask.map((item, index) => (
              <div key={index} className={`w-6 h-6 flex items-center justify-center text-white text-sm font-light ${item.color} rounded-full shadow-md`}>
                {item.value}
              </div>
            ))}
          </div>
          <div>
            <Button variant="teritary" className="font-semibold text-sm" onClick={createSprint}>
              Create sprint
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {isExpand && (
        <CardContent className="flex flex-col items-center transition-all duration-300 p-0 mt-4">
          {/* Description */}

          {submittedIssue.length > 0 ? (
            submittedIssue.map((item, index) => (
              <div
                key={index}
                className="relative w-full group"
              >
                <Card
                  onClick={() => handleIssueClick(item.id)}
                  className={`w-full hover:bg-neutral-100 shadow-none bg-none bg-card-none border-neutral-300 hover:cursor-pointer border py-2 px-4 rounded-none outline-none text-neutral-600 font-normal flex items-center justify-between ${selectedIssue === item ? ' border-neutral-400 text-neutral-600 font-semibold  bg-neutral-100' : ''
                    }`}
                >
                  <div className='flex items-center justify-start gap-4 min-h-5'>
                    {item.type === "story" && (
                      <div className='bg-green-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                        <Bookmark size={12} className='text-white font-bold' />
                      </div>
                    )
                    }
                    {item.type === "bug" && (
                      <div className='bg-red-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                        <Bug size={12} className='text-white font-bold' />
                      </div>
                    )
                    }
                    {item.type === "task" && (
                      <div className='bg-blue-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                        <Check size={12} className='text-white font-bold' />
                      </div>)
                    }
                    {
                      editIssue === item.id ? (
                        <div className='w-full flex items-center gap-3'>
                          <div>
                            <Input
                              type="text"
                              value={editText}
                              onChange={handleTextChange}
                              className="w-full bg-transparent border-none text-neutral-600 font-normal outline-none rounded-sm"
                              autoFocus
                            />
                          </div>
                          <div className='flex items-center gap-1'>
                            <Button
                              className="w-10 px-3 h-8"
                              variant="muted"
                              onClick={() => handleSaveEdit(item.id)}
                            >
                              <Check size={16} className='text-neutral-700' />
                            </Button>
                            <Button
                              className="w-10 px-3 h-8"
                              variant="muted"
                              onClick={closeEditeInput}
                            >
                              <X size={16} className='text-neutral-700' />
                            </Button>
                          </div>
                        </div>

                      ) : (
                        <div>
                          {item.name}
                        </div>
                      )
                    }

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="py-1 px-2 hover:bg-neutral-200"
                        onClick={() => handleEditClick(item.id, item.name)}
                      >
                        <Pencil size={14} className="text-neutral-500" />
                      </Button>
                    </div>

                  </div>

                  <div className='flex items-center gap-5'>
                    <Select className="w-full border" value={selectProgress} onValueChange={(value) => setSelectProgress(value)}>
                      <SelectTrigger className="w-full h-7 border-neutral-500 px-3 py-0 rounded-sm transition focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full mt-2">
                        <SelectGroup>
                          <SelectItem value="to_do" >
                            <span>To Do</span>
                          </SelectItem>
                          <SelectItem value="done">
                            <span>Done</span>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <span>IN Progress</span>
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <div className='flex items-center gap-2'>
                      <div>
                        <Avatar className="size-8 hover:opacity-75 transition border border-neutral-400 ">
                          <AvatarFallback className="bg-neutral-300 font-medium text-neutral-800 flex items-center ">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger className='outline-none relative'>
                            <Button variant="muted" className="h-8"><Ellipsis size={20} className='text-neutral-900' /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={10}>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="px-3 my-1">Move to</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem>Sprint Name</DropdownMenuItem>
                                  <DropdownMenuItem>Top of backlog</DropdownMenuItem>
                                  <DottedSeparator className="my-1" />
                                  <DropdownMenuItem>Move up</DropdownMenuItem>
                                  <DropdownMenuItem>Move down</DropdownMenuItem>
                                  <DropdownMenuItem>Bottom of backlog</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DottedSeparator className="mb-1" />

                            <DropdownMenuItem className='flex items-center justify-between gap-2 px-3 '>
                              <p className='text-neutral-700'>
                                Copy issue link
                              </p>
                            </DropdownMenuItem>

                            <DropdownMenuItem className=' flex items-center justify-between gap-2 px-3  '>
                              <p className='text-neutral-700'>
                                Copy issue key
                              </p>
                            </DropdownMenuItem>

                            <DottedSeparator className="my-1" />

                            <DropdownMenuItem className='flex items-center justify-between gap-2 px-3'>
                              <p className='text-neutral-700'>
                                Add flag
                              </p>
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="px-3">Assignee</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Filter label..."
                                    autoFocus={true}
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>No label found.</CommandEmpty>
                                    <CommandGroup>
                                      {labels.map((label) => (
                                        <CommandItem
                                          key={label}
                                          value={label}
                                          onSelect={(value) => {
                                            setLabel(value)
                                            setOpen(false)
                                          }}
                                        >
                                          {label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="px-3">
                                Story point estimate
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="p-0 w-10">
                                <Command className="py-2 ">
                                  <CommandInput
                                    type="number"
                                    autoFocus={true}
                                    className="h-9 mx-1 px-2 border border-neutral-400"
                                  />
                                  <div className='flex items-center justify-center mt-1 gap-1'>
                                    <Button className="py-1 px-3 gap-0 h-10" variant="muted">
                                      <Check size={16} className='text-neutral-700' />
                                    </Button>
                                    <Button
                                      className="py-0 px-3"
                                      variant="muted"
                                    >
                                      <X size={16} className='text-neutral-700' />
                                    </Button>
                                  </div>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem className=' flex items-center justify-between gap-2 px-3  '>
                              <p className='text-neutral-700'>
                                Split issue
                              </p>
                            </DropdownMenuItem>

                            <DottedSeparator className="my-1" />

                            <DropdownMenuItem className=' flex items-center justify-between gap-2 px-3 mb-1'>
                              <p className='text-neutral-700'>
                                Delete
                              </p>
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>

            ))
          ) : (
            <div className='w-full border-2 border-dashed border-neutral-300 p-4 rounded-lg'>
              <div className='flex items-center justify-center min-h-10'>
                <p className="text-neutral-700 font-normal text-sm">
                  Your backlog is empty
                </p>
              </div>
            </div>
          )}


          {/* Create Issue Button */}
          {!createIssue ? (
            <div className="mt-6 w-full">
              <Button
                variant="default"
                className="w-full flex items-center justify-start"
                onClick={showInputBox}
              >
                <Plus className="mr-2" size={20} />
                <span className="text-sm">Create issue</span>
              </Button>
            </div>
          ) : (
            <div className="mt-6 w-full">
              {/* Issue Type Selector & Input Field */}

              <form onSubmit={handleSubmit}>
                <div className='flex items-center justify-start gap-2'>
                  <div className='w-[100px]'>
                    <Select className="w-full" onValueChange={(value) => setIssueType(value)}>
                      <SelectTrigger className="w-full px-5 py-2 rounded-md hover:bg-neutral-100 transition focus:outline-none">
                        {issueType ? (
                          <div className="flex items-center gap-2">
                            {issueType === 'story' && (
                              <div className='bg-green-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Bookmark size={12} className='text-white font-bold' />
                              </div>
                            )}
                            {issueType === 'bug' && (
                              <div className='bg-red-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Bug size={12} className='text-white font-bold' />
                              </div>
                            )}
                            {issueType === 'task' && (
                              <div className='bg-blue-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Check size={12} className='text-white font-bold' />
                              </div>
                            )}
                          </div>
                        ) : (
                          <SelectValue placeholder="Select Epic" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="w-full mt-2 bg-white shadow-sm rounded-md border border-neutral-300 z-10">
                        <SelectGroup>
                          <SelectLabel>Issue Type</SelectLabel>
                          <SelectItem value="story" >
                            <div className="flex items-center gap-2">
                              <div className='bg-green-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Bookmark size={12} className='text-white font-bold' />
                              </div>
                              <span>Story</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bug">
                            <div className="flex items-center gap-2">
                              <div className='bg-red-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Bug size={12} className='text-white font-bold' />
                              </div>
                              <span>Bug</span>
                            </div>

                          </SelectItem>
                          <SelectItem value="task">
                            <div className="flex items-center gap-2">
                              <div className='bg-blue-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Check size={12} className='text-white font-bold' />
                              </div>
                              <span>Task</span>
                            </div>
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='w-full'>
                    <Input
                      type="text"
                      className="w-full flex items-center justify-start"
                      placeholder="What needs to be done"
                      value={issueName}
                      onChange={(e) => setIssueName(e.target.value)}
                    />
                  </div>
                </div>
                <div className='flex items-center justify-end my-3 gap-3'>
                  <Button className="py-1 px-3 gap-0 h-10" variant="muted" type="submit">
                    <Check size={16} className='text-neutral-700' />
                  </Button>
                  <Button
                    className="py-0 px-3"
                    variant="muted"
                    onClick={() => setCreateIssue(false)}
                  >
                    <X size={16} className='text-neutral-700' />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CreateBacklog;