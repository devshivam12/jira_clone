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

const NavMain = ({ items, currentPath, project_slug,
    template_slug }) => {
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
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={item.title}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {item.items?.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild>
                                                <Link key={subItem.url}
                                                    to={`/dashboard/${project_slug}/${template_slug}${subItem.url}`}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                                                        subItem.isActive || currentPath === subItem.url
                                                            ? "bg-neutral-200 text-accent-foreground text-sm font-medium"
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
