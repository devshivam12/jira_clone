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
import { Bolt, Bookmark, Bug, Check, Edit, Zap } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
import MultiSelect from '@/components/ui/multiSelect';
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import SelectTeam from './SelectTeam';
import CreateTeam from './CreateTeam';



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

  const filteredUsers = assignUser.filter((user) =>
    user.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteresTeam = team.filter((team) =>
    team.label.toLowerCase().includes(searchTeam.toLowerCase())
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

    if (isOpenSelect) {
      document.addEventListener('mousedown', handleOutSide);
    }

    if (isOpenTeam) {
      document.addEventListener('mousedown', handleOutSideTeam);
    }

    return () => {
      if (isOpenSelect) {
        document.removeEventListener('mousedown', handleOutSide);
      }
      if (isOpenTeam) {
        document.removeEventListener('mousedown', handleOutSideTeam);
      }
    };
  }, [isOpenSelect, isOpenTeam]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] pointer-events-auto px-0">
          <DialogHeader className="sticky top-0 z-10 px-6">
            <DialogTitle>Create</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 px-6">

            <div className="grid gap-4 py-4 ">
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
                    className='w-80 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
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
                  <MultiSelect
                    options={options}
                    setOptions={setOptions}
                    selectedValues={selectedValues}
                    setSelectedValues={setSelectedValues}
                  />
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
                    className='w-80 mt-1 absolute top-[100%] left-0 shadow-lg bg-neutral-100 rounded-lg z-[10000] border border-neutral-300'
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

            </div>
          </ScrollArea>


          <DialogFooter>
            <Button type="submit">Save changes</Button>
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