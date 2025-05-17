import React, { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Textarea } from '@/components/ui/textarea'

import { ChevronDown, ChevronRight, ChevronUp, Cog, Ellipsis, Eye, Info, LockKeyholeOpen, Pen, Pin, Plus, Share, Share2, ThumbsUp, X } from 'lucide-react'
// import MultiSelect from '@/components/ui/MultiSelect'
import SelectTeam from './common-component/SelectTeam'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import CreateEpic from './common-component/CreateEpic'

const assingUser = [
    {
        title: "User 1", icon: <Avatar>
            {/* <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> */}
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    },
    {
        title: "User 2", icon: <Avatar>
            {/* <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> */}
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    },
    {
        title: "User 3", icon: <Avatar>
            {/* <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> */}
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    }
]

const EditIssue = ({ issue, onClose }) => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [editedText, setEditedText] = useState(issue.name)
    const handleClose = () => {
        onClose()
    }
    const [selectedProgress, setSelectedProgress] = useState('to_do')
    const [expandDetails, setExpandDetails] = useState(false)
    const [openCommand, setOpenCommand] = useState(false)
    const commandRef = useRef(null)
    const [storyPoint, setStoryPoint] = useState("")
    const [tempValue, setTempValue] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef(null)
    const [isEpicOpen, setIsEpicOpen] = useState(false)

    const handleClickOutside = (event) => {
        if (commandRef.current && !commandRef.current.contains(event.target)) {
            setOpenCommand(false);
        }
    };

    // Attach event listener when dropdown is open
    useEffect(() => {
        if (openCommand) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [openCommand]);

    const handleAddStoryPoint = (e) => {
        console.log("hello")
        e.preventDefault()
        if (tempValue.trim() !== "") {
            setStoryPoint(tempValue)
        }
        else {
            setStoryPoint("")
        }
        setIsEditing(false)
        inputRef.current?.blur()
    }

    const handleScrollEffect = (e) => {
        const isScrolled = e.target.scrollTop > 0
        if (isScrolled !== isScrolled) {
            setIsScrolled(isScrolled)
        }
    }
    console.log("isScrolle", isScrolled)
    console.log("isEpicOpen", isEpicOpen)
    return (
        <Card className='flex flex-col rounded-sm bg-neutral-100 shadow-neutral-200  overflow-y-auto max-h-[350px]'>
            <div
                className={`sticky top-0 bg-neutral-100 z-10 ${isScrolled ? 'shadow-sm' : ''}`}

            >
                <CardHeader className="m-0 pb-0 px-0">
                    <CardTitle className>
                        <div className='flex items-center justify-between px-2'>
                            <div
                                className='hover:bg-neutral-200 cursor-pointer p-1 rounded-sm'
                                onClick={() => {
                                    setIsEpicOpen(prev => !prev)
                                }}
                            >
                                <p className='flex items-center gap-2'>
                                    <Pen className='flex items-center justify-center w-3 h-3 font-normal text-neutral-500 cursor-pointer' />
                                    <span
                                        className='text-xs text-neutral-500'

                                    >
                                        Add epic
                                    </span>
                                </p>
                            </div>
                            <div>
                                {
                                    isEpicOpen && <CreateEpic />
                                }
                            </div>
                            <div className='flex items-center'>
                                <div className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'>
                                    <LockKeyholeOpen size={20} />
                                </div>
                                <div className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'>
                                    <Eye />
                                </div>
                                <div className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'>
                                    <ThumbsUp size={20} />
                                </div>
                                <div className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'>
                                    <Share2 size={20} />
                                </div>
                                <div className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'>
                                    <Ellipsis size={20} />
                                </div>
                                <div 
                                className='flex items-center justify-center w-9 h-9 py-0  rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'
                                onClick={handleClose}
                                >
                                    <X size={20} />
                                </div>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
            </div>
            <CardContent
                className="mt-0 w-full overflow-y-auto px-2"
                onScroll={handleScrollEffect}
                style={{
                    scrollbarWidth: 'none',  /* Firefox */
                    msOverflowStyle: 'none',  /* IE and Edge */
                }}
            >

                <div className='space-y-2 [&::-webkit-scrollbar]:hidden"'>
                    <div className='mt-[0.8rem] pb-0'>
                        <Input
                            type="text"
                            placeholder="Enter your name"
                            className="border-none border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-200"
                        />
                    </div>
                    <div className='flex items-center gap-2 mt-2'>
                        <div className='flex items-center gap-1 py-2 px-4 cursor-pointer rounded-sm text-neutral-500 text-sm font-semibold hover:bg-neutral-200 border bg-neutral-100'>
                            <Plus size={18} />
                            <span>Add</span>
                        </div>
                        <div>
                            <Select value={selectedProgress} onValueChange={(value) => setSelectedProgress(value)}>
                                <SelectTrigger className={`
                            ${selectedProgress === 'to_do' ? 'bg-neutral-100' : 'shadow-none'}
                            ${selectedProgress === 'in_progress' ? 'bg-blue-200' : 'shadow-none'}
                            ${selectedProgress === 'done' ? 'bg-green-200' : 'shadow-none'}
                            ${!['to_do', 'in_progress', 'done'].includes(selectedProgress) ? 'default' : ''}`}>
                                    {/* Display the selected value */}
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="to_do">
                                        To Do
                                    </SelectItem>
                                    <SelectItem value="done">
                                        Done
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                        In Progress
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                        </div>

                        <div className='flex items-center gap-1 py-2 px-4 cursor-pointer rounded-sm text-neutral-500 text-sm font-semibold hover:bg-neutral-200 border bg-neutral-100'>
                            <Cog size={18} />
                            <span className=''>
                                Improve
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label className="text-neutral-500">
                            Description
                        </Label>
                        <Input
                            type="text"
                            placeholder="Add description..."
                            className="border-none border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-200"
                        />
                    </div>
                </div>

                <Card className='mt-8 shadow-none rounded-sm  '>
                    <CardHeader
                        className="py-3 px-2 cursor-pointer bg-neutral-200 border border-neutral-300"
                        onClick={() => setExpandDetails((prev) => !prev)}
                    >
                        <CardTitle className="flex items-center justify-between">
                            <span className='text-neutral-500 font-semibold'>
                                Details
                            </span>
                            {expandDetails === true ? <ChevronDown className='text-neutral-600' /> : <ChevronUp className='text-neutral-600' />}
                        </CardTitle>
                    </CardHeader>
                    {expandDetails && (
                        <CardContent className="bg-neutral-100 py-3 px-2 border border-neutral-300 text-neutral-500 space-y-2 relative">
                            <div
                                className='py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm relative group'
                            >
                                <Label className='flex text-sm text-neutral-500 font-normal items-center gap-2'>
                                    Assignee
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                    </TooltipWrapper>
                                </Label>
                            </div>

                            <div ref={commandRef} className='relative'>
                                <Command className="rounded-sm shadow-none">
                                    <div className="bg-neutral-200"> {/* Add border between input and list */}
                                        <CommandInput
                                            placeholder="Search assignee..."
                                            className="border-none focus:ring-0 focus:outline-none bg-transparent "
                                            onFocus={() => setOpenCommand(true)}
                                        />
                                    </div>

                                    {
                                        openCommand && (

                                            <CommandList className="absolute  w-full shadow-md mt-12 bg-neutral-100 border border-neutral-200 z-100">
                                                <CommandEmpty>
                                                    No result found
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {
                                                        assingUser.map((assign, index) => (
                                                            <CommandItem key={index}>
                                                                {assign.icon}
                                                                <span>
                                                                    {assign.title}
                                                                </span>
                                                            </CommandItem>
                                                        ))
                                                    }
                                                </CommandGroup>
                                            </CommandList>

                                        )
                                    }
                                </Command>
                            </div>

                            <div className=''>
                                <span className='text-blue-900 text-xs font-normal cursor-pointer hover:underline'>
                                    Assigne to me
                                </span>
                            </div>

                            {/* <div
                                className='py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm'
                            > */}
                            {/* <Label className='flex text-sm items-center gap-2'>
                                    Labels
                                    <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                </Label> */}

                            {/* For Labels */}

                            <div className=''>
                                <Label className="flex text-sm text-neutral-500 font-normal items-center gap-2 py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm relative group">
                                    Label
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                    </TooltipWrapper>
                                </Label>
                                {/* <MultiSelect /> */}
                            </div>

                            {/* For Parents */}

                            <div>
                                <Label className="flex text-sm text-neutral-500 font-normal items-center gap-2 py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm relative group">
                                    Parent
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                    </TooltipWrapper>
                                </Label>
                            </div>

                            {/* For Teams */}

                            <div>
                                <Label className="flex text-sm text-neutral-500 font-normal items-center gap-2 py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm relative group">
                                    Team
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                    </TooltipWrapper>
                                </Label>
                                <SelectTeam />
                            </div>

                            {/* For Story point estimate */}

                            <div>
                                <Label className="flex text-sm text-neutral-500 font-normal items-center justify-between py-1 px-2 hover:bg-neutral-200 w-56 rounded-sm relative group">
                                    Story point estimate
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <div className='flex items-center gap-2'>
                                            <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                            <Info size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                        </div>
                                    </TooltipWrapper>
                                </Label>
                                <form action="" onSubmit={handleAddStoryPoint}>
                                    <Input
                                        value={isEditing ? tempValue : storyPoint || "None"}
                                        ref={inputRef}
                                        type="number"
                                        placeholder="None"
                                        className="border-none border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-200"
                                        onFocus={() => {
                                            setIsEditing(true);
                                            setTempValue(storyPoint)
                                        }}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        onBlur={() => {
                                            if (tempValue.trim() === "") {
                                                setStoryPoint(""); // Reset if empty
                                            }
                                            setIsEditing(false);
                                        }}
                                    />
                                </form>

                            </div>

                            {/* For Report  */}

                            <div>
                                <Label className="flex text-sm text-neutral-500 font-normal items-center gap-2 py-1 px-2 hover:bg-neutral-200 w-28 rounded-sm relative group">
                                    Reporter
                                    <TooltipWrapper
                                        content="Pinned to top. Only you can see pinned field"
                                        className="shadow-sm"
                                    >
                                        <Pin size={15} className='cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 ' />
                                    </TooltipWrapper>
                                </Label>
                                <SelectTeam />
                            </div>

                            {/* </div> */}

                        </CardContent>

                    )
                    }
                </Card>
            </CardContent >
            <CreateEpic isOpen={isEpicOpen} onClose={() => setIsEpicOpen(false)} />
        </Card >
        // <div>
        //     <Input value={editedText} onChange={(e) => setEditedText(e.target.value)} />
        //     {/* <Button onClick={handleSave}>Save</Button> */}
        //     <Button onClick={onClose}>Cancel</Button>
        // </div>
    )
}

export default EditIssue
