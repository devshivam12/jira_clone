import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Link, useParams } from 'react-router-dom'

const CreateProjectSidebar = ({ projectData, isLoading }) => {
    console.log("isLoading", isLoading)
    const [formattedData, setFormattedData] = useState([])
    const { project_slug } = useParams()

    useEffect(() => {
        if (projectData?.data) {
            setFormattedData(
                projectData.data.map((item) => ({
                    title: item.name,
                    slug: item.slug,
                    url: `/create-project/${item.slug}`,
                    isActive: project_slug === item.slug
                }))
            )
        }
    }, [projectData, project_slug])

    return (
        <div>
            <Sidebar className="h-full fixed left-0 top-0 bottom-0 w-80 border-r">
                <SidebarContent className="gap-0 pl-8 mt-10">
                    <SidebarHeader className="mt-2">
                        <p className='text-neutral-500 text-xl font-semibold'>
                            Project templates
                        </p>
                    {/* <p className='font-bold text-2xl'>{isLoading}</p> */}
                    </SidebarHeader>

                    
                    {isLoading ? (
                        <div className="space-y-4 px-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {formattedData.map((item) => (
                                        <SidebarMenuItem key={item.slug} className="relative">
                                            <SidebarMenuButton
                                                className={`
                                                    text-base text-neutral-900 
                                                    ${item.isActive ?
                                                        'before:absolute before:left-[0px] before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border'
                                                        : ''
                                                    }
                                                `}
                                                asChild
                                                isActive={item.isActive}
                                            >
                                                <Link
                                                    to={item.url}
                                                    className='py-6 block hover:text-primary transition-colors'
                                                >
                                                    {item.title}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}
                </SidebarContent>
                <SidebarRail />
            </Sidebar>
        </div>
    )
}

export default CreateProjectSidebar