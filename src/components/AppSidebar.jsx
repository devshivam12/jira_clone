
// import React from 'react'
// import { Globe, Frame, ChartNoAxesGantt, SquareKanban, SquareLibrary } from 'lucide-react'
// import { Link, useLocation } from 'react-router-dom'
// import { cn } from '@/lib/utils'
import { RiTeamFill } from 'react-icons/ri'
// import {
//     Sidebar,
//     SidebarContent,
//     SidebarGroup,
//     SidebarGroupContent,
//     SidebarGroupLabel,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
// } from "@/components/ui/sidebar"
// const routes = [
//     {
//         label: "Summary",
//         href: "/dashboard/summary",
//         icon: Globe
//     },
//     {
//         label: "Timeline",
//         href: "/dashboard/timeline",
//         icon: ChartNoAxesGantt
//     },
//     {
//         label: "Backlog",
//         href: "/dashboard/backlog",
//         icon: Frame
//     },
//     {
//         label: "Board",
//         href: "/dashboard/board",
//         icon: SquareKanban
//     },
//     {
//         label: "Forms",
//         href: "/dashboard/forms",
//         icon: SquareLibrary
//     },
//     {
//         label: "Team",
//         href: "/dashboard/team",
//         icon: RiTeamFill
//     }
// ]

// const Navigation = () => {
//     const location = useLocation()

//     return (
//         <Sidebar>
//             <SidebarContent>
//                 <SidebarGroup>
//                     <SidebarGroupLabel>Application</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <SidebarMenu>
//                             {routes.map((item) => (
//                                 <SidebarMenuItem key={item.title}>
//                                     <SidebarMenuButton asChild>
//                                         <Link key={item.href} to={item.href}>
//                                             <item.icon />
//                                             <span>{item.label}</span>
//                                         </Link>
//                                     </SidebarMenuButton>
//                                 </SidebarMenuItem>
//                             ))}
//                         </SidebarMenu>
//                     </SidebarGroupContent>
//                 </SidebarGroup>
//             </SidebarContent>
//         </Sidebar>
//     )
// }

// export default Navigation


import React from 'react'
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    LifeBuoy,
    Map,
    PieChart,
    Rocket,
    Send,
    Settings2,
    SquareTerminal,
    User,
    UsersRound,
} from "lucide-react"



// import NavMain from "@/components/nav-main"
import NavMain from "./ui/nav-main"
import NavProjects from "./ui/nav-projects"
import TeamSwitcher from "./ui/team-switcher"
import NavUser from "./ui/nav-user"
// import NavProjects from "@/components/nav-projects"
// import NavUser from "@/components/nav-user"
// import TeamSwitcher from "@/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import NavSecondary from './ui/nav-secondary'
import { useLocation } from 'react-router-dom'



// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: Command,
            plan: "Free",
        },
    ],
    navMain: [
        {
            title: "Project Managment",
            url: "#",
            icon: Rocket,
            isActive: true,
            items: [
                {
                    title: "Summary",
                    url: "/dashboard/summary",
                },
                {
                    title: "Timeline",
                    url: "/dashboard/timeline",
                },
                {
                    title: "Backlog",
                    url: "/dashboard/backlog",
                },
                {
                    title: "Board",
                    url: "/dashboard/board",
                },
                {
                    title: "Forms",
                    url: "/dashboard/forms",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Support",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ],
    projects: [
        {
            name: "Teams",
            url: "/dashboard/team",
            icon: UsersRound,
        },
        {
            name: "Peoples",
            url: "/dashboard/people",
            icon: User,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

const AppSidebar = (props) => {
    const location = useLocation()
    const updateData = {
        ...data,
        navMain: data.navMain.map(group => ({
            ...group,
            items: group.items.map(item => ({
                ...item,
                isActive: location.pathname === item.url
            }))
        })),
        projects: data.projects.map(project => ({
            ...project,
            isActive: location.pathname === project.url
        }))
    };
    return (
        // <Sidebar className="top-[--header-height] !h-[calc(100svh-var(--header-height))]" collapsible="icon" {...props}>
        //     <SidebarHeader>
        //         <TeamSwitcher teams={data.teams} />
        //     </SidebarHeader>
        //     <SidebarContent>
        //         <NavMain items={data.navMain} />
        //         <NavProjects projects={data.projects} />
        //     </SidebarContent>
        //     <SidebarFooter>
        //         <NavUser user={data.user} />
        //     </SidebarFooter>
        //     <SidebarRail />
        // </Sidebar>
        <Sidebar
            className="top-[--header-height] !h-[calc(100svh-var(--header-height))]"
            collapsible="icon"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Acme Inc</span>
                                    <span className="truncate text-xs">Enterprise</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={updateData.navMain} currentPath={location.pathname} />
                <NavProjects projects={updateData.projects} currentPath={location.pathname} />
                <NavSecondary items={updateData.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar
