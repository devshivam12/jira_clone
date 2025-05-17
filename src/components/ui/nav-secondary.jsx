import React from 'react'
// import { type LucideIcon } from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from 'react-router-dom'

const NavSecondary = ({ items, ...props }) => {
    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild size="sm">
                                <Link to={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                                {/* <a href={item.url}>
                                </a> */}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

export default NavSecondary
