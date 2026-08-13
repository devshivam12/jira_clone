import React from 'react'
import { Outlet } from 'react-router-dom'
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from '@/components/AppSidebar'
import SiteHeader from '@/components/SiteHeader'
import DashboardBreadcrumb from '@/components/common/DashboardBreadcrumb'

const DashboardLayout = () => {
    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1 min-w-0">
                    <AppSidebar />
                    {/* min-w-0 is required. SidebarInset is flex-1, and a flex
                        item defaults to min-width:auto, so without this it
                        refuses to shrink below its content. A wide page (the
                        timeline chart) then stretches the whole layout past the
                        viewport and the sidebar + page header scroll away
                        sideways with it. */}
                    <SidebarInset className="min-w-0 overflow-x-hidden">
                        {/* Shows on the standard dashboard pages (Team, People,
                            Projects). Project workspace routes render their own
                            breadcrumb inside ProjectLayout, so this stays hidden there. */}
                        <DashboardBreadcrumb />
                        <div className="flex flex-1 flex-col gap-4 pr-4 pl-4 min-w-0">
                            <Outlet />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default DashboardLayout


