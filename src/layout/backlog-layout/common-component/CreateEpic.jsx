import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Ensure you import Avatar
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bolt, Bookmark, Bug, Calendar1, Check, Edit, UploadCloud, Zap } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
// import MultiSelect from '@/components/ui/MultiSelect';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import SelectTeam from './SelectTeam';
import CreateTeam from './CreateTeam';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ColorSelectorView, isColor } from 'ckeditor5';
import { Checkbox } from '@/components/ui/checkbox';



const assignUser = [
  { label: "User 1", icon: <Avatar><AvatarFallback>U1</AvatarFallback></Avatar> },
  { label: "User 2", icon: <Avatar><AvatarFallback>U2</AvatarFallback></Avatar> },
  { label: "User 3", icon: <Avatar><AvatarFallback>U3</AvatarFallback></Avatar> }
];

const team = [
  { label: "Team 1", icon: <Avatar><AvatarFallback>T1</AvatarFallback></Avatar> },
  { label: "Team 2", icon: <Avatar><AvatarFallback>T2</AvatarFallback></Avatar> },
  { label: "Team 3", icon: <Avatar><AvatarFallback>T3</AvatarFallback></Avatar> }
]

const allIssues = [
  { label: "blocks" },
  { label: "is blocke by" },
  { label: "clone" },
  { label: "is clone by" },
  { label: "duplicates" },
  { label: "is duplicates by" },
  { label: "related to" },
]

const colorOptions = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
];

const Z_INDEX = {
  DIALOG: 1000,
  DIALOG_HEADER: 1010,
  DROPDOWN: 1020,
  POPOVER: 1030,
  TOOLTIP: 1040,
  MODAL: 1050,
  OVERLAY: 1060
};

const CreateEpic = ({ isOpen, onClose }) => {
  const [issueType, setIssueType] = useState('story');
  const [isEditDisplay, setIsEditDisplay] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')


  const [isOpenSelect, setIsOpenSelect] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const closeAssignee = useRef(null)

  const [isOpenTeam, setIsOpenTeam] = useState(false)
  const [valueTeam, setValueTeam] = useState("")
  const [searchTeam, setSearchTeam] = useState("")
  const closeTeam = useRef(null)

  const [options, setOptions] = useState([]);
  const [selectedValues, setSelectedValues] = useState([]);

  const [openTeam, setOpenTeam] = useState(false)

  const [startDate, setStartDate] = useState()
  const [endDate, setEndDate] = useState()

  const [selectColor, setSelectColor] = useState('#3b82f6')
  const [isColorPicked, setIsColorPicked] = useState(false)

  const [linkeIssue, setLinkeIssue] = useState(false)
  const [linkeIssueValue, setLinkeIssueValue] = useState("")
  const [searchLinkIssue, setSearchLinkIssue] = useState("")
  const closeLinkeIssue = useRef(null)

  const filteredUsers = assignUser.filter((user) =>
    user.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteresTeam = team.filter((team) =>
    team.label.toLowerCase().includes(searchTeam.toLowerCase())
  )

  const filtersLinkIssue = allIssues.filter((issue) =>
    issue.label.toLowerCase().includes(searchLinkIssue.toLowerCase())
  )

  const handleEditClick = (status) => {
    console.log("status", status)
    setSelectedStatus(status)
    setIsEditDialogOpen(true)
  }

  const handleChangeStatusValue = () => {
    setIsEditDialogOpen(false)
  }

  useEffect(() => {
    const handleOutSide = (e) => {
      if (closeAssignee.current && !closeAssignee.current.contains(e.target)) {
        setIsOpenSelect(false);
      }
    };

    const handleOutSideTeam = (e) => {
      if (closeTeam.current && !closeTeam.current.contains(e.target)) {
        setIsOpenTeam(false);
      }
    };

    const handleOutSideLinkeIssue = (e) => {
      if (closeLinkeIssue.current && !closeLinkeIssue.current.contains(e.target)) {
        setLinkeIssue(false)
      }
    }
    if (isOpenSelect) {
      document.addEventListener('mousedown', handleOutSide);
    }

    if (isOpenTeam) {
      document.addEventListener('mousedown', handleOutSideTeam);
    }

    if (linkeIssue) {
      document.addEventListener('mousedown', handleOutSideLinkeIssue)
    }

    return () => {
      if (isOpenSelect) {
        document.removeEventListener('mousedown', handleOutSide);
      }
      if (isOpenTeam) {
        document.removeEventListener('mousedown', handleOutSideTeam);
      }
      if (linkeIssue) {
        document.removeEventListener('mouseup', handleOutSideLinkeIssue)
      }
    };
  }, [isOpenSelect, isOpenTeam, linkeIssue]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] pointer-events-auto px-0">
          <DialogHeader className="sticky top-0 z-10 px-8">
            <DialogTitle>Create</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 px-6">

            <div className="grid gap-4 py-4 px-2">
              <div className="grid-rows-1 items-center w-80 gap-y-2">
                <Label htmlFor="name" className="text-right text-neutral-500">
                  Project
                </Label>
                <Select>
                  <SelectTrigger className="hover:bg-neutral-200/20">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent className="" style={{ zIndex: Z_INDEX.DROPDOWN }}>
                    <SelectItem value="to_do">To Do</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid-rows-1 items-center w-80 gap-y-4">
                <Label htmlFor="username" className="text-right text-neutral-500">
                  Issue type
                </Label>
                <Select onValueChange={(value) => setIssueType(value)}>
                  <SelectTrigger className="w-full px-5 py-2 rounded-md hover:bg-neutral-200/20 focus:outline-none">
                    <SelectValue>
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
                          {
                            issueType === 'epic' && (
                              <div className='bg-purple-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                                <Zap size={12} className='text-white font-bold' />
                              </div>
                            )
                          }
                          <span>{issueType}</span>
                        </div>
                      ) : (
                        "Select Epic"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full mt-2 shadow-sm rounded-md border border-neutral-300" style={{ zIndex: Z_INDEX.DROPDOWN }}>
                    <SelectGroup>
                      <SelectItem value="story">
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
                      <SelectItem value="epic">
                        <div className="flex items-center gap-2">
                          <div className='bg-purple-500 py-1 h-6 w-6 flex items-center justify-center rounded-sm'>
                            <Zap size={12} className='text-white font-bold' />
                          </div>
                          <span>Epic</span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <DottedSeparator className="my-5" />

              <div className="grid-rows-1 w-56 items-center gap-y-4">
                <Label htmlFor="username" className="text-right text-neutral-500">
                  Status
                </Label>
                <Select onOpenChange={(open) => setIsEditDisplay(open)}>
                  <SelectTrigger className="hover:bg-neutral-200/20">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent className="w-[250px]" style={{ zIndex: Z_INDEX.DROPDOWN }}>
                    <SelectItem value="to_do">
                      <div className='flex justify-between items-center gap-10 w-full'>
                        <span>To Do</span>
                        {
                          isEditDisplay && (
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-300 cursor-pointer"
                              onClick={(e) => {
                                console.log("it is working")
                                e.stopPropagation(); // Prevent click from closing select
                                handleEditClick('To Do'); // Set the selected status and open the dialog
                                isPropagationStopped()
                                console.log("")
                              }}
                            >
                              <Edit
                                className="text-neutral-500" size={15}

                              />
                            </div>
                          )
                        }
                      </div>
                    </SelectItem>
                    <SelectItem value="done">
                      <div className="flex justify-between items-center gap-10 w-full">
                        <span>Done</span>
                        {isEditDisplay && (
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-300 cursor-pointer"

                            onClick={() => handleEditClick('Done')}
                          >
                            <Edit
                              className="text-neutral-500" size={15}
                            />
                          </div>
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex justify-between items-center w-full gap-10">
                        <span>In Progress</span>
                        {isEditDisplay && (
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-300 cursor-pointer"
                            onClick={() => handleEditClick('In Progress')}
                          >
                            <Edit
                              className="text-neutral-500" size={15}

                            />
                          </div>
                        )}
                      </div>
                    </SelectItem>
                    <DottedSeparator className="my-2" />
                    <SelectItem className="create_status">
                      {/* <div> */}
                      Create Status
                      {/* </div> */}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-start flex-col gap-y-2 w-full'>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Summary
                </Label>
                <Input
                  type="text"
                  placeholder
                  className="border border-neutral-400"
                />
              </div>

              <div className='relative flex items-start flex-col gap-y-2' ref={closeAssignee}>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Assignee
                </Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm z-[10000]'>
                  <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full border flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500 z-[10000]"
                    onClick={() => setIsOpenSelect(!isOpenSelect)}
                  >
                    {value
                      ? assignUser.find((user) => user.label === value)?.label
                      : "Select your assignee..."}
                  </Button>
                </div>
                {isOpenSelect && (
                  <div
                    className='w-72 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
                    style={{ zIndex: Z_INDEX.POPOVER }}
                  >


                    {/* Search Input */}
                    <div className='px-2 py-1 z-[10000]'>
                      <Input
                        type="text"
                        placeholder="Search your team..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none border-none focus:ring-none ring-none focus:border-none"
                      />
                    </div>
                    <DottedSeparator className="my-2" />

                    {/* User List */}
                    <ScrollArea className="h-40">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.label}
                            onClick={() => {
                              setValue(user.label);
                              setIsOpenSelect(false);
                            }}
                            className={`${value === user.label ? 'bg-neutral-200 py-1 px-2 flex items-center cursor-pointer z-[10000]' : 'px-2 py-1 flex items-center hover:bg-neutral-200 cursor-pointer z-[10000]'}`}
                          >
                            {user.icon}
                            <span className="ml-2">{user.label}</span>
                            {value === user.label && (
                              <span className="ml-auto">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-neutral-500 z-[10000]">No team found.</div>
                      )}
                    </ScrollArea>

                  </div>
                )}
              </div>

              <div className='flex items-start flex-col gap-y-2 relative z-50'>
                <Label className="text-right text-neutral-500">
                  Labels
                </Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm z-[10000]'>
                  {/* <MultiSelect
                    options={options}
                    setOptions={setOptions}
                    selectedValues={selectedValues}
                    setSelectedValues={setSelectedValues}
                  /> */}
                </div>
              </div>

              <div className='relative flex items-start flex-col gap-y-2' ref={closeTeam}>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Team
                </Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full border flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500"
                    onClick={() => setIsOpenTeam(!isOpenTeam)}
                  >
                    {valueTeam
                      ? team.find((user) => user.label === valueTeam)?.label
                      : "Select your team..."}
                  </Button>
                </div>
                {isOpenTeam && (
                  <div
                    className='w-72 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
                    style={{ zIndex: Z_INDEX.POPOVER }}
                  >


                    {/* Search Input for Team */}
                    <div className='px-2 py-1 z-[10000]'>
                      <Input
                        type="text"
                        placeholder="Search your team..."
                        value={searchTeam}
                        onChange={(e) => setSearchTeam(e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none border-none focus:ring-none ring-none focus:border-none"
                      />
                    </div>
                    <DottedSeparator className="my-2" />

                    {/* Team List */}
                    <ScrollArea className="h-40">
                      {filteresTeam.length > 0 ? (
                        <>
                          {
                            filteresTeam.map((user) => (
                              <div
                                key={user.label}
                                onClick={() => {
                                  setValueTeam(user.label);
                                  setIsOpenTeam(false);
                                }}
                                className={`${valueTeam === user.label ? 'bg-neutral-200 py-1 px-2 flex items-center cursor-pointer z-[10000]' : 'px-2 py-1 flex items-center hover:bg-neutral-200 cursor-pointer z-[10000]'}`}
                              >
                                {user.icon}
                                <span className="ml-2">{user.label}</span>
                                {value === user.label && (
                                  <span className="ml-auto">✓</span>
                                )}
                              </div>
                            ))
                          }
                          <DottedSeparator className="my-1" />
                          <div
                            className='px-2 py-2 my-2 hover:bg-neutral-200 cursor-pointer z-[10000]'
                            onClick={() => {
                              setOpenTeam(prev => !prev)
                            }}
                          >
                            <p className="ml-2">Create Team</p>
                          </div>
                        </>


                      ) : (
                        <div className="p-2 text-neutral-500 z-[10000]">No team found.</div>
                      )}
                    </ScrollArea>

                  </div>
                )}
              </div>

              <div className='relative flex items-start flex-col gap-y-2'>
                <Label htmlFor="summary" className="text-right text-neutral-500">Start date</Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Popover>
                    <PopoverTrigger asChild className='cursor-pointer'>
                      <Button variant="default" className="w-full justify-between text-left font-normal ">
                        {startDate ? format(startDate, "PPP") : "Enter start date"}
                        <Calendar1 className="ml-2 h-8 w-8 text-neutral-500 flex items-center justify-center rounded-sm hover:bg-neutral-200 py-2 px-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                </div>
              </div>


              <div className='relative flex items-start flex-col gap-y-2'>
                <Label htmlFor="summary" className="text-right text-neutral-500">End date</Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Popover>
                    <PopoverTrigger asChild className='cursor-pointer'>
                      <Button variant="default" className="w-full justify-between text-left font-normal ">
                        {endDate ? format(endDate, "PPP") : "Enter end date"}
                        <Calendar1 className="ml-2 h-8 w-8 text-neutral-500 flex items-center justify-center rounded-sm hover:bg-neutral-200 py-2 px-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                </div>
              </div>

              <div className='relative flex items-start flex-col gap-y-2'>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Issue Color
                </Label>
                <div className='w-20'>
                  <Popover open={isColorPicked} onOpenChange={setIsColorPicked}>
                    <PopoverTrigger asChild className='w-10 h-10 rounded-md border hover:ring-offset-2 hover:ring-neutral-400 hover:ring-2 transition-all border-neutral-200 '>
                      <button className=''>
                        <div>
                          {
                            selectColor ? (
                              <div className='w-10 h-10 rounded-md border border-neutral-200 ' style={{ background: selectColor }} />
                            ) : (
                              <span>select color</span>
                            )
                          }
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className=" p-0 pointer-events-auto" align="start">
                      <div className="grid bg-neutral-100 grid-cols-5 py-2 px-4 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            className="w-full aspect-square rounded-md flex items-center justify-center hover:ring-2 hover:ring-offset-2 hover:ring-neutral-400 transition-all "
                            style={{ backgroundColor: color.value }}
                            onClick={() => {
                              setSelectColor(color.value);
                              setIsColorPicked(false);
                            }}
                            title={color.name}
                          >
                            {selectColor === color.value && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className='relative flex items-start flex-col gap-y-2' ref={closeTeam}>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Reporter
                </Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full border flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500"
                    onClick={() => setIsOpenTeam(!isOpenTeam)}
                  >
                    {valueTeam
                      ? team.find((user) => user.label === valueTeam)?.label
                      : "Select your team..."}
                  </Button>
                </div>
                {isOpenTeam && (
                  <div
                    className='w-80 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
                    style={{ zIndex: Z_INDEX.POPOVER }}
                  >


                    {/* Search Input for Team */}
                    <div className='px-2 py-1 z-[10000]'>
                      <Input
                        type="text"
                        placeholder="Search your team..."
                        value={searchTeam}
                        onChange={(e) => setSearchTeam(e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none border-none focus:ring-none ring-none focus:border-none"
                      />
                    </div>
                    <DottedSeparator className="my-2" />

                    {/* Team List */}
                    <ScrollArea className="h-40">
                      {filteresTeam.length > 0 ? (
                        <>
                          {
                            filteresTeam.map((user) => (
                              <div
                                key={user.label}
                                onClick={() => {
                                  setValueTeam(user.label);
                                  setIsOpenTeam(false);
                                }}
                                className={`${valueTeam === user.label ? 'bg-neutral-200 py-1 px-2 flex items-center cursor-pointer z-[10000]' : 'px-2 py-1 flex items-center hover:bg-neutral-200 cursor-pointer z-[10000]'}`}
                              >
                                {user.icon}
                                <span className="ml-2">{user.label}</span>
                                {value === user.label && (
                                  <span className="ml-auto">✓</span>
                                )}
                              </div>
                            ))
                          }
                          <DottedSeparator className="my-1" />
                          <div
                            className='px-2 py-2 my-2 hover:bg-neutral-200 cursor-pointer z-[10000]'
                            onClick={() => {
                              setOpenTeam(prev => !prev)
                            }}
                          >
                            <p className="ml-2">Create Team</p>
                          </div>
                        </>


                      ) : (
                        <div className="p-2 text-neutral-500 z-[10000]">No team found.</div>
                      )}
                    </ScrollArea>

                  </div>
                )}
              </div>

              <div className='relative flex items-start flex-col gap-y-2'>
                <Label className="text-right text-neutral-500">
                  Attachement
                </Label>
                <div className='relative border w-full border-neutral-200 rounded-sm'>
                  <div className=' flex items-center h-14'>
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer hover:bg-neutral-200/50"
                    />
                    <div className='absolute inset-0 flex items-center justify-center pl-3 pointer-events-none'>
                      <UploadCloud className='text-neutral-500' />
                      <span className='ml-2 text-neutral-500 text-sm'>
                        Click to upload or drag and drop
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='relative flex items-start flex-col gap-y-2' ref={closeLinkeIssue}>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Linked Issues
                </Label>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full border flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500"
                    onClick={() => setLinkeIssue(!linkeIssue)}
                  >
                    {linkeIssueValue
                      ? allIssues.find((user) => user.label === linkeIssueValue)?.label
                      : "Select your issues..."}
                  </Button>
                </div>
                {linkeIssue && (
                  <div
                    className='w-80 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
                    style={{ zIndex: Z_INDEX.POPOVER }}
                  >


                    {/* Search Input for Team */}
                    <div className='px-2 py-1 z-[10000]'>
                      <Input
                        type="text"
                        placeholder="Search your issues..."
                        value={searchLinkIssue}
                        onChange={(e) => setSearchLinkIssue(e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none border-none focus:ring-none ring-none focus:border-none"
                      />
                    </div>
                    <DottedSeparator className="my-2" />

                    {/* issues List */}
                    <ScrollArea className="h-40">
                      {filtersLinkIssue.length > 0 ? (
                        <>
                          {
                            filtersLinkIssue.map((user) => (
                              <div
                                key={user.label}
                                onClick={() => {
                                  setLinkeIssueValue(user.label);
                                  setLinkeIssue(false);
                                }}
                                className={`${linkeIssueValue === user.label ? 'bg-neutral-200 py-2 px-2 flex items-center cursor-pointer z-[10000]' : 'px-2 py-2 flex items-center hover:bg-neutral-200 cursor-pointer z-[10000]'}`}
                              >
                                <span className="ml-2">{user.label}</span>
                                {linkeIssueValue === user.label && (
                                  <span className="ml-auto">✓</span>
                                )}
                              </div>
                            ))
                          }
                        </>


                      ) : (
                        <div className="p-2 text-neutral-500 z-[10000]">No issues found.</div>
                      )}
                    </ScrollArea>

                  </div>
                )}
              </div>

              <div className='relative flex items-start flex-col gap-y-2' ref={closeLinkeIssue}>
                <div className='w-80 border border-neutral-200 shadow-sm rounded-sm'>
                  <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full border flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500"
                    onClick={() => setLinkeIssue(!linkeIssue)}
                  >
                    {linkeIssueValue
                      ? allIssues.find((user) => user.label === linkeIssueValue)?.label
                      : "Select your issues..."}
                  </Button>
                </div>
                {linkeIssue && (
                  <div
                    className='w-80 text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
                    style={{ zIndex: Z_INDEX.POPOVER }}
                  >


                    {/* Search Input for Team */}
                    <div className='px-2 py-1 z-[10000]'>
                      <Input
                        type="text"
                        placeholder="Search your issues..."
                        value={searchLinkIssue}
                        onChange={(e) => setSearchLinkIssue(e.target.value)}
                        className="w-full px-2 py-1 focus:outline-none border-none focus:ring-none ring-none focus:border-none"
                      />
                    </div>
                    <DottedSeparator className="my-2" />

                    {/* issues List */}
                    <ScrollArea className="h-40">
                      {filtersLinkIssue.length > 0 ? (
                        <>
                          {
                            filtersLinkIssue.map((user) => (
                              <div
                                key={user.label}
                                onClick={() => {
                                  setLinkeIssueValue(user.label);
                                  setLinkeIssue(false);
                                }}
                                className={`${linkeIssueValue === user.label ? 'bg-neutral-200 py-2 px-2 flex items-center cursor-pointer z-[10000]' : 'px-2 py-2 flex items-center hover:bg-neutral-200 cursor-pointer z-[10000]'}`}
                              >
                                <span className="ml-2">{user.label}</span>
                                {linkeIssueValue === user.label && (
                                  <span className="ml-auto">✓</span>
                                )}
                              </div>
                            ))
                          }
                        </>


                      ) : (
                        <div className="p-2 text-neutral-500 z-[10000]">No issue found.</div>
                      )}
                    </ScrollArea>

                  </div>
                )}
              </div>

              <div className='relative flex items-start flex-col gap-y-2'>
                <Label htmlFor="summary" className="text-right text-neutral-500">
                  Flagged
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-500"
                  >
                    Impediment
                  </label>
                </div>
              </div>

            </div>
          </ScrollArea>


          <DialogFooter className="px-6">
            <Button variant="teritary" type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent style={{ zIndex: Z_INDEX.MODAL }}>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update the name and category for the status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid-rows-1 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="grid-rows-1 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeStatusValue}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      <CreateTeam openTeam={openTeam} onClose={() => setOpenTeam(false)} />
    </>
  );
};

export default CreateEpic;