import React, { useState } from 'react'
import {
    Bot,
    ClipboardList,
    Folder,
    Forward,
    MoreHorizontal,
    PieChart,
    Trash2,
    Users,
} from "lucide-react"
import { RiTeamFill } from 'react-icons/ri'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./sidebar"
import { Link } from 'react-router-dom'
import { DottedSeparator } from '../dotted-separator'
import { EmailMultiSelect } from './EmailMultiSelect'
import { cn } from '@/lib/utils'

const NavPeoples = ({ peoples, currentPath }) => {
    const [userData, setUserData] = useState(() => {
        const storeData = localStorage.getItem("userData");
        return storeData ? JSON.parse(storeData) : null
    })
    const { isMobile } = useSidebar()
    const [isTeam, setIsTeam] = useState(false)
    const [slug, setSlug] = useState("")

    const openDialog = (slug) => {
        setIsTeam(true)
        setSlug(slug)
    };

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Manage Peoples</SidebarGroupLabel>
            <SidebarMenu>
                {peoples.map((item) => (
                    <SidebarMenuItem key={item.name} className="">
                        <SidebarMenuButton asChild>
                            <Link to={item.url} className={cn(
                                "flex items-center text-blue text-yellow gap-2 rounded-md px-2 py-1.5  transition-colors",
                                item.isActive || currentPath === item.url
                                    ? "bg-neutral-200 text-accent-foreground text-sm font-medium"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}>
                                <item.icon />
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                        <DropdownMenu >
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                    <MoreHorizontal />
                                    <span className="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-48 rounded-lg ml-6"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                            >
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        openDialog('for_team');
                                    }}
                                >
                                    <Users className="text-muted-foreground" />
                                    <span>Create Team</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Bot className="text-muted-foreground" />
                                    <span>Smart assignment</span>
                                </DropdownMenuItem>
                                {/* <DropdownMenuSeparator /> */}
                                <DottedSeparator className="my-1" />
                                <DropdownMenuItem className="cursor-pointer">
                                    <PieChart className="text-muted-foreground" />
                                    <span>Workload Heatmap</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <ClipboardList className="text-muted-foreground" />
                                    <span>Meeting Notes</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <SidebarMenuButton className="text-sidebar-foreground/70">
                        <MoreHorizontal className="text-sidebar-foreground/70" />
                        <span>More</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <EmailMultiSelect
                slug={slug}
                isOpen={isTeam}
                onOpenChange={(open) => setIsTeam(open)}
                userData={userData}
            />
        </SidebarGroup>
    )
}

export default NavPeoples
