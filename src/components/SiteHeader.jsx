import React, { useState } from 'react'
import UserButton from './auth/UserButton'
import MobileSidebar from './MobileSidebar'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, ClipboardList, FolderOpenDot, ListPlus, PanelRightOpen, Plus, Search, SidebarIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from './ui/input'
import { RiTeamFill } from 'react-icons/ri'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { MultiSelect } from './ui/MultiSelect'
import { EmailMultiSelect } from './ui/EmailMultiSelect'

import { useToast } from '@/hooks/use-toast'
import ButtonLoader from './ui/buttonLoader'
import { DottedSeparator } from './dotted-separator'
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue, SelectItem } from './ui/select'
import { useGetRolesQuery } from '@/redux/api/authApi'
import { useSidebar } from './ui/sidebar'
import { useProjectData } from '@/hooks/useProjectData'
import CreateSprint from '@/layout/backlog-layout/common-component/CreateSprint'
import { useUserData } from '@/hooks/useUserData'
import CreateTask from '@/layout/backlog-layout/common-component/CreateTask'


const SiteHeader = () => {
    const [isWorked, setIsWork] = useState(false)
    const [isTeam, setIsTeam] = useState(false)
    const [createButton, setCreateButton] = useState(false)
    // const [isOpen, setIsOpen] = useState(false)
    // const [isOpen,setIsOpen ] = useState({
    //     key : '',
    //     value : false
    // })

    const { toggleSidebar } = useSidebar()
    const { allProjects, currentProject, workType, workFlow, templateData } = useProjectData()
    const { userData } = useUserData()
    console.log("currentPropject", currentProject)
    console.log("templateData", templateData)
    console.log("workType", workType)

    // const epicIcon = workType.find(icon => icon.slug === 'epic')?.icon || "";
    // const epicColor = workType.find(icon => icon.slug === 'epic')?.color || "";
    // const taskColor = workType.find(icon => icon.slug === 'task')?.color || ""
    // const taskIcon = workType.find(icon => icon.slug === 'task')?.icon || ""

    const [dialogState, setDialogState] = useState({
        isOpen: false,
        slug: null
    });

    const openDialog = (slug) => {
        setDialogState({
            isOpen: true,
            slug
        });
    };

    const navigate = useNavigate()
    console.log("dialogState", dialogState)
    return (
        <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background ">
            <div className="flex h-[--header-height] items-center gap-2 px-4">
                <Button
                    className="h-8 w-8"
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                >
                    {/* <SidebarIcon /> */}
                    <PanelRightOpen />
                </Button>
            </div>
            <div className='flex align-end justify-end w-full'>
                <NavigationMenu>
                    <NavigationMenuList>
                        {/* Logo/brand item */}
                        {/* <NavigationMenuItem>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                Your Brand
                            </NavigationMenuLink>
                        </NavigationMenuItem> */}

                        {/* Your Work Dropdown */}
                        <NavigationMenuItem>
                            <DropdownMenu onOpenChange={setIsWork}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`text-neutral-500 text-md ${isWorked ? 'bg-neutral-100 font-semibold text-neutral-800' : ''}`}
                                    >
                                        Your work <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-80 py-2 z-[1000]"
                                    align="start"
                                >
                                    <Tabs defaultValue="assigned" className="w-full ">
                                        <TabsList className="">
                                            <TabsTrigger
                                                value="assigned"
                                            >
                                                Assign to me
                                            </TabsTrigger>


                                            <TabsTrigger
                                                value="recent"
                                            >
                                                Recent
                                            </TabsTrigger>

                                            <TabsTrigger
                                                value="board"
                                            >
                                                Board
                                            </TabsTrigger>
                                        </TabsList>

                                        <div className="p-4">
                                            <TabsContent value='assigned'>
                                                <Card className="border-0 shadow-none">
                                                    <CardHeader className="p-0 pb-4">
                                                        <CardTitle className="text-base">
                                                            <Input
                                                                placeholder="Enter here"
                                                            />
                                                        </CardTitle>
                                                    </CardHeader>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value='recent'>
                                                <Card className="border-0 shadow-none">
                                                    <CardHeader className="p-0 pb-4">
                                                        <CardTitle className="text-base">
                                                            Worked On
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div>
                                                            {/* Your recent items */}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value='board'>
                                                <Card className="border-0 shadow-none">
                                                    <CardHeader className="p-0 pb-4">
                                                        <CardTitle className="text-base">
                                                            Recent
                                                        </CardTitle>
                                                    </CardHeader>
                                                </Card>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                    <DropdownMenuGroup className='p-0'>
                                        <DropdownMenuItem
                                            className="cursor-pointer text-sm"
                                        >
                                            <Link
                                                href="https://ui.shadcn.com/docs/components/dropdown-menu"
                                            >
                                                Go to your work page
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </NavigationMenuItem>

                        {/* Regular navigation items */}
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <DropdownMenu onOpenChange={setIsTeam}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={`text-neutral-500 text-md ${isTeam ? 'bg-neutral-100 font-semibold text-neutral-800' : ''}`}
                                        >
                                            Teams <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-80 py-2"
                                        align="left"
                                    >
                                        <DropdownMenuLabel className="my-2 text-neutral-600 font-semibold text-md">
                                            Your Teams
                                        </DropdownMenuLabel>
                                        {/* <DropdownMenuSeparator className="bg-neutral-300" /> */}
                                        <DropdownMenuGroup className='p-0'>
                                            <DropdownMenuItem
                                                className="p-0"
                                                onClick={() => {
                                                    navigate('/dashboard/team')
                                                }}
                                            >
                                                <div className="w-full hover:bg-neutral-200 cursor-pointer text-sm py-2 px-4">
                                                    <span className='text-sm text-neutral-500'>
                                                        Your Team Details will be display here
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                            {/* <DropdownMenuSeparator className="bg-neutral-300 my-2" /> */}
                                            <DottedSeparator className="my-2" />
                                            <DropdownMenuItem
                                                className="p-0"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    openDialog('for_people');
                                                }}
                                            >
                                                <div className='w-full hover:bg-neutral-200 cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                                    <Plus size={18} className='text-neutral-500' />
                                                    <span className='text-sm text-neutral-500'>
                                                        Invite people to jira
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="p-0"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    openDialog('for_team');
                                                }}
                                            >
                                                <div className='w-full hover:bg-neutral-200 cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                                    <RiTeamFill size={18} className='text-neutral-500' />
                                                    <span className='text-sm text-neutral-500'>
                                                        Create team
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>

                                            {/* <DropdownMenuSeparator className="bg-neutral-300 my-2" /> */}
                                            <DottedSeparator className="my-2" />

                                            <DropdownMenuItem className="p-0">
                                                <div className='w-full hover:bg-neutral-200 cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                                    <Search size={18} className='text-neutral-500' />
                                                    <span className='text-sm text-neutral-500'>
                                                        Search people and teams
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        {/* <NavigationMenuItem>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                Pricing
                            </NavigationMenuLink>
                        </NavigationMenuItem> */}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <div className='w-full px-4 flex items-center gap-2'>
                <Input
                    placeholder="Search"
                    className="hover:bg-neutral-100"
                />
                <div>
                    <DropdownMenu onOpenChange={setCreateButton}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-x-2"
                            >
                                Create <Plus />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="py-2"
                            align="end"
                        >

                            <DropdownMenuGroup className='p-0 '>
                                <DropdownMenuItem
                                    className="p-0 hover:bg-neutral-200/40"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        openDialog('issue');
                                    }}
                                >
                                    <div className='w-full cursor-pointer text-sm py-2 px-2 flex items-center gap-x-4 '>
                                        {/* <div className={`w-7 h-7 rounded-md flex items-center justify-center ${epicColor}`}>
                                            <img
                                                src={epicIcon}
                                                className="w-4 h-4 filter brightness-0 invert"
                                            />
                                        </div> */}

                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-indigo-500`}>
                                            <ClipboardList size={18} className='text-white' />
                                        </div>

                                        <span className='text-base text-neutral-500 font-medium'>
                                            Issue
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="p-0 hover:bg-neutral-200/40"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        openDialog('sprint');
                                    }}

                                >
                                    <div className='w-full cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-green-500`}>
                                            <ListPlus size={18} className='text-white' />
                                        </div>

                                        <span className='text-base text-neutral-500 font-medium'>
                                            Sprint
                                        </span>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="p-0 hover:bg-neutral-200/40"
                                >
                                    <div className='w-full cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-orange-500`}>
                                            <FolderOpenDot size={18} className='text-white' />
                                        </div>
                                        <span className='text-base text-neutral-500 font-medium'>
                                            Project
                                        </span>
                                    </div>
                                </DropdownMenuItem>

                                {/* <DropdownMenuItem
                                    className="p-0 hover:bg-neutral-200/40"
                                >
                                    <div className='w-full cursor-pointer text-sm py-2 px-2 flex items-center gap-5'>
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${taskColor}`}>
                                            <img
                                                src={taskIcon}
                                                className="w-4 h-4 filter brightness-0 invert"
                                            />
                                        </div>
                                        <span className='text-base text-neutral-500 font-medium'>
                                            Task
                                        </span>
                                    </div>
                                </DropdownMenuItem> */}

                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className='pr-4'>
                <UserButton />
            </div>

            <EmailMultiSelect
                slug={dialogState.slug}
                isOpen={dialogState.isOpen && ['for_team', 'for_people'].includes(dialogState.slug)}
                onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
                userData={userData}
            />
            <CreateSprint isOpen={dialogState.isOpen && dialogState.slug === 'sprint'} onClose={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))} />

            <CreateTask
                isOpen={dialogState.isOpen && dialogState.slug === 'issue'}
                onClose={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
                userData={userData}
                allProjects={allProjects}
                currentProject={currentProject}
                workType={workType}
                workFlow={workFlow}
                templateData={templateData}
            />
        </header>
    )
}

export default SiteHeader