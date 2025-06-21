import React, { useEffect, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Archive, ChevronsUpDown, FolderOpenDot, MoreHorizontal, Plus, Settings, Trash2 } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { switchProject } from '@/redux/reducers/projectSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { DottedSeparator } from '../dotted-separator'
import TooltipWrapper from '../common/TooltipWrapper'

const ProjectSwitcher = ({ teams }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { isMobile } = useSidebar()
    const [activeTeam, setActiveTeam] = React.useState(teams[0])
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const dispatch = useDispatch()
    const { currentProject, allProjects } = useSelector((state) => state.projectSlice)

    // Handle navigation after project switch
    useEffect(() => {
        if (selectedProjectId && currentProject?._id === selectedProjectId) {
            const defaultTab = currentProject.template.fields.tabs.find(tab => tab.isDefault === true)
            if (defaultTab) {
                navigate(`/dashboard/${currentProject.project_slug}/${currentProject.template.slug}/${defaultTab.url}`)
            }
            setSelectedProjectId(null) // Reset after navigation
        }
    }, [currentProject, selectedProjectId, navigate])

    const handleProjectSwitch = (projectId) => {
        setSelectedProjectId(projectId)
        dispatch(switchProject(projectId))
    }

    const truncProjectName = (value) => {
        return value.length > 12 ? value.substring(0, 12) + '...' : value;
    }

    return (
        <SidebarMenu className="">
            <SidebarMenuItem className="group/project-switcher relative">
                <div className="flex items-center w-full">

                    <DropdownMenu model={false}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground
                            focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0  group-hover/project-switcher:pr-8"
                            >
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <activeTeam.logo className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {truncProjectName(currentProject.name)}
                                    </span>
                                    {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
                                </div>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg py-2 px-2"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={13}
                            model={false}
                        >
                            <DropdownMenuLabel className="text-muted-foreground text-xs">
                                Project details
                            </DropdownMenuLabel>
                            {allProjects.map((project, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    onClick={() => handleProjectSwitch(project._id)}
                                    className={`gap-2 py-2 px-2 cursor-pointer my-2 ${currentProject?._id === project._id ? 'before:absolute before:left-[0px]  before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border ' : ''}`}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border">
                                        {/* <team.logo className="size-3.5 shrink-0" /> */}
                                    </div>
                                    {project.name}
                                    {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
                                </DropdownMenuItem>
                            ))}
                            <DottedSeparator className='m-2' />
                            <DropdownMenuItem
                                className="gap-2 p-2 cursor-pointer"
                                onClick={() => navigate('/dashboard/projects', { state: { from: location.pathname } })}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <FolderOpenDot className="size-4" />
                                </div>
                                <div
                                    className="text-muted-foreground font-medium"

                                >
                                    View all projects
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="gap-2 p-2 cursor-pointer"
                                onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div
                                    className="text-muted-foreground font-medium"

                                >
                                    Create project
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Action Buttons - Always Visible */}
                    <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-10'>
                        <TooltipWrapper content={'Create Project'}>
                            <button
                                onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })}
                                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-0"
                            >

                                <Plus className="size-4" />
                            </button>
                        </TooltipWrapper>



                        <DropdownMenu model={false}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-0"
                                >
                                    <TooltipWrapper content={'More actions'}>
                                        <MoreHorizontal className="size-4" />
                                    </TooltipWrapper>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg py-2 px-2"
                                align="start"
                                side={isMobile ? "bottom" : "right"}
                                sideOffset={13}
                                model={false}
                            >
                                <DropdownMenuLabel className="text-muted-foreground text-xs">
                                    Project Actions
                                </DropdownMenuLabel>
                                <DropdownMenuItem className="gap-2 py-2 px-2 cursor-pointer">
                                    <Settings className="size-4" />
                                    <span>Project Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 py-2 px-2 cursor-pointer">
                                    <Plus className="size-4" />
                                    <span>Add Member</span>
                                </DropdownMenuItem>
                                <DottedSeparator className="my-2 border-netural-800" />
                                <DropdownMenuItem className="gap-2 py-2 px-2 cursor-pointer">
                                    <Archive className="size-4" />
                                    <span>Archive Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 py-2 px-2 cursor-pointer text-red-600 hover:text-red-700">
                                    <Trash2 className="size-4" />
                                    <span>Delete Project</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </SidebarMenuItem>
        </SidebarMenu >
    )
}

export default ProjectSwitcher
