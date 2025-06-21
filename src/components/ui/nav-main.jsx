import React, { useState } from 'react'
import { ChevronRight } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "../ui/sidebar"
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NavMain = ({ items, currentPath, project_slug, template_slug }) => {
    // const [projectSlug, setProjectSlug] = useState("software_development")
    // const [templateSlug, setTemplateSlug] = useState('scrum')
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Manage Work</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem className="relative">
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={item.title}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className='mt-1 mb-1'>
                                <SidebarMenuSub>
                                    {item.items?.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.title} className="">
                                            <SidebarMenuSubButton
                                                asChild
                                                className={`text-base text-neutral-700 ${subItem.isActive ?
                                                    'before:absolute before:left-[0px]  before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border'
                                                    : ''
                                                    }`}
                                            >
                                                <Link key={subItem.url}
                                                    to={`/dashboard/${project_slug}/${template_slug}${subItem.url}`}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-md px-2 py-4 transition-colors",
                                                        subItem.isActive || currentPath === subItem.url
                                                            ? "bg-neutral-200 border-0 py-4 text-accent-foreground text-sm font-medium"
                                                            : "hover:bg-accent hover:text-accent-foreground"
                                                    )}>
                                                    <span>{subItem.title}</span>
                                                </Link>
                                                {/* <a href={subItem.url}>
                                                </a> */}
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}

export default NavMain
