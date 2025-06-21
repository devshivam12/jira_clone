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
import { ChevronDown, PanelRightOpen, Plus, Search, SidebarIcon } from "lucide-react"
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




const options = [
    { label: "React", value: "react" },
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" },
    { label: "HTML", value: "html" },
    { label: "CSS", value: "css" },
];


const SiteHeader = () => {
    const [isWorked, setIsWork] = useState(false)
    const [isTeam, setIsTeam] = useState(false)

    const { toggleSidebar } = useSidebar()

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

    const [userData, setUserData] = useState(() => {
        const storeData = localStorage.getItem("userData");
        return storeData ? JSON.parse(storeData) : null
    })

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
            <div className='w-full px-4'>
                <Input
                    placeholder="Search"
                    className="hover:bg-neutral-100"
                />
            </div>

            <div className='pr-4'>
                <UserButton />
            </div>

            <EmailMultiSelect
                slug={dialogState.slug}
                isOpen={dialogState.isOpen}
                onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
                userData={userData}
            />
        </header>
    )
}

export default SiteHeader