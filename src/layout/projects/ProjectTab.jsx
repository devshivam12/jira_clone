import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetProjectByIdQuery } from '@/redux/api/company/api'
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'

const ProjectTab = () => {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: projectDetail } = useGetProjectByIdQuery(id)
  console.log("projectDetail", projectDetail)

  const currentTab = searchParams.get('tab') || 'detail'

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
      >

        <TabsList className="">
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

        <div className='px-5'>

          <TabsContent value="detail" className="flex items-center justify-center flex-col">
            <ProjectDetail projectDetail={projectDetail} />
          </TabsContent>
          <TabsContent value="access">
            Access
          </TabsContent>
          <TabsContent value="team">
            Team
          </TabsContent>
          <TabsContent value="people">
            People
          </TabsContent>
        </div>
      </Tabs>
    </div>
    // <div>
    //   Details,
    //   Access,
    //   Teams,
    //   Peoples,

    // </div>
  )
}

export default ProjectTab
