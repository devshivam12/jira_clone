import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetProjectByIdQuery } from '@/redux/api/company/api'
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'
import ManageAvatar from '@/components/common/ManageAvatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const ProjectTab = () => {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: projectDetail } = useGetProjectByIdQuery(id)
  console.log("projectDetail", projectDetail)

  const initialProjectName = projectDetail?.data?.name?.charAt(0)?.toUpperCase() ?? '';
  const currentTab = searchParams.get('tab') || 'detail'

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
  }

  return (
    <div className="flex w-full flex-col">
      {/* <div className='space-y-2'>
        <span className='text-neutral-500 font-semibold text-lg'>Project</span>
        <div className='flex items-center gap-x-3'>
          <Avatar className="w-7 h-7 rounded-none">
            {projectDetail?.project_icon ? (
              <AvatarImage
                src={projectDetail?.project_icon}
                alt={`${projectDetail?.data?.name}`}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className='rounded-sm text-sm text-neutral-500'>
                {initialProjectName}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div>
            <span className='text-neutral-500 font-medium text-lg'>{projectDetail?.data?.name}</span>
          </div>
        </div>
      </div> */}

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="flex flex-col space-y-10"
      >
        {/* Sticky Tab Header */}
        <div className='fixed top-100 bg-white z-10 w-full '>
          <TabsList className="px-10 h-16">
            <TabsTrigger
              value="detail"
              className="data-[state=active]:text-neutral-600 data-[state=active]:font-semibold"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="access"
            >
              Access
            </TabsTrigger>
            <TabsTrigger
              value="team"
            >
              Team
            </TabsTrigger>
            <TabsTrigger
              value="people"
            >
              People
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable Tab Content */}
        <div className='flex-1 overflow-hidden '>
          <TabsContent
            value="detail"
            className="h-full overflow-y-auto px-5 py-4 m-0"
          >
            <div className="flex items-center justify-center flex-col">
              <ProjectDetail projectDetail={projectDetail} />
            </div>
          </TabsContent>

          <TabsContent
            value="access"
            className="h-full overflow-y-auto px-5 py-4 m-0"
          >
            <div>
              Access Content
              {/* Add your access content here */}
            </div>
          </TabsContent>

          <TabsContent
            value="team"
            className="h-full overflow-y-auto px-5 py-4 m-0"
          >
            <div>
              Team Content
              {/* Add your team content here */}
            </div>
          </TabsContent>

          <TabsContent
            value="people"
            className="h-full overflow-y-auto px-5 py-4 m-0"
          >
            <div>
              People Content
              {/* Add your people content here */}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default ProjectTab