import React from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import CreateProjectSidebar from './CreateProjectSidebar'
import { useGetFieldsDataQuery, useGetProjectQuery, useGetTemplateQuery } from '@/redux/api/company/api'
import Template from './Template'
import { useParams } from 'react-router-dom'

const CreateProject = () => {
    const { project_slug } = useParams()
    const { data: projectData, isLoading: ProjectLoading } = useGetProjectQuery()
    const { data: templateData, isLoading: templateLoading } = useGetTemplateQuery(project_slug)


    return (
        <div className="flex min-h-screen">
            <SidebarProvider>
                {/* Sidebar - fixed width */}
                <div className="w-80 flex-shrink-0">
                    <CreateProjectSidebar projectData={projectData} isLoading={ProjectLoading} />
                </div>

                {/* Main content - takes remaining space */}
                <SidebarInset className="flex-1 overflow-auto">
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <Template
                            templateData={templateData}
                            isLoading={templateLoading}
                            projectSlug={project_slug}
                        />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}

export default CreateProject