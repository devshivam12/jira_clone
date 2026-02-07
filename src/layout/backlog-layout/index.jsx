import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DottedSeparator } from '@/components/dotted-separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import Epic from './Epic';
import Sprint from './Sprint';
import CreateBacklog from './CreateBacklog';
import { ChartSpline, Ellipsis, Maximize, Maximize2, Search, Settings2, Share2 } from 'lucide-react';
import Share from '../Share';
import Insight from '../Insight';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import BacklogLayoutSetting from '../BacklogLayoutSetting';
import EditIssue from './[id]/EditIssue';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { useProjectData } from '@/hooks/useProjectData';

const randomData = [
  { first_name: "Shivam" },
  { first_name: "Mittal" },
  { first_name: "SM" }
];

const Backlog = () => {
  const [searchParams] = useSearchParams()
  const issueId = searchParams.get('issueId')
  const { userData } = useUserData()
  const { currentProject, workType, importance, workFlow } = useProjectData()
  const defaultProject = {
    currentProject: currentProject,
    workType: workType,
    importance: importance,
    workFlow: workFlow
  }

  const selectedIssue = issueId ? true : false
  const [isExpand, setIsExpand] = useState(false);
  const [showEpic, setShowEpic] = useState(false);
  const [sprint, setSprint] = useState([
    {
      id: 1,
      name: 'SCRUM Sprint 1'
    }
  ])

  const getProjectDetails = useSelector((state) => state.projectSlice.currentProject)
  const isLoading = useSelector((state) => state.projectSlice.loading)

  console.log("getProjectDetails------------", getProjectDetails)
  // const [selectedIssue, setSelectedIssue] = useState(null)

  const [openCommonShare, setOpenCommonShare] = useState(false)
  const [openInsight, setOpenInsight] = useState(false)
  const [backlogSetting, setBacklogSetting] = useState(false)

  const handleCreateSprint = () => {
    const newSprint = {
      id: sprint.lenght + 1,
      name: `SCRUM Sprint ${sprint.length + 1}`
    }
    setSprint([...sprint, newSprint])
  }

  const handleIssueClick = (issue) => {
    // setSelectedIssue(issue)
    setOpenInsight(false)
    setBacklogSetting(false)
  }
  console.log("selectedIssue", selectedIssue)

  // ... inside Backlog component ...

  const isAnySidebarPanelOpen = openInsight || backlogSetting || selectedIssue;

  let gridColumnsClass = 'grid-cols-[minmax(0,1fr)]';

  if (showEpic && isAnySidebarPanelOpen) {
    gridColumnsClass = 'grid-cols-[256px_minmax(0,1fr)_320px]';
  } else if (showEpic && !isAnySidebarPanelOpen) {
    gridColumnsClass = 'grid-cols-[256px_minmax(0,1fr)]';
  } else if (!showEpic && isAnySidebarPanelOpen) {
    gridColumnsClass = 'grid-cols-[minmax(0,1fr)_320px]';
  } else {
    gridColumnsClass = 'grid-cols-[minmax(0,1fr)]';
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading project details...</p>
        </div>
      </div>
    )

  }
  return (
    <div className='flex flex-col h-screen px-4 py-4'>
      <div className={`grid ${gridColumnsClass} gap-x-2 w-full h-full min-h-0`}>
        {showEpic && (
          <div className="w-full h-full min-h-0 overflow-y-auto">
            <Epic showEpic={showEpic} setShowEpic={setShowEpic} />
          </div>
        )}

        <div className="flex flex-col min-h-0">

          <div className='flex flex-col space-y-5'>
            <h1 className="text-neutral-500 text-2xl font-semibold">Backlog</h1>

            <div className='flex items-center justify-between'>
              <div className="flex items-center gap-x-4">
                <div className='space-x-1 relative'>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search size={15} className="text-neutral-500" />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Search"
                      className={`px-8 pl-8 w-40 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 hover:bg-neutral-100 ${isExpand ? 'w-52' : 'w-40'}`}
                      onFocus={() => setIsExpand(true)}
                      onBlur={() => setIsExpand(false)}
                    />
                  </div>
                </div>
                <div className="flex -space-x-1">
                  {randomData.map((user, index) => (
                    <Avatar key={index} className="size-10 border border-neutral-300 hover:opacity-75 transition">
                      <AvatarFallback className="bg-neutral-200 font-medium text-neutral-600 flex items-center justify-center cursor-pointer">
                        {user.first_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>

                {/* Select Dropdown for Epic */}
                <div>
                  <Select>
                    <SelectTrigger className="w-full px-5 py-2 rounded-md hover:bg-neutral-100 transition focus:outline-none">
                      <SelectValue placeholder="Epic" />
                      <SelectContent className="w-full mt-2 bg-white shadow-sm rounded-md border border-neutral-300 z-10">
                        <div className="p-3">
                          <p className="text-neutral-600 font-medium text-sm">Your project has no Epic</p>
                        </div>
                        <DottedSeparator className="my-1" />
                        <div className="flex items-center gap-x-2 p-3">
                          <Switch id="show-epic" onClick={() => setShowEpic(prev => !prev)} />
                          <Label htmlFor="show-epic" className="text-sm font-medium text-neutral-800">Show Epic</Label>
                        </div>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                </div>
              </div>
              {/* Insight/Settings icons, which are part of the middle column's header */}
              <div className='flex items-center gap-x-4'>
                <div>
                  <TooltipWrapper content="Backlog insight">
                    <ChartSpline
                      size={10}
                      className='h-9 w-9 flex item-center justify-center py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer rounded-sm'
                      onClick={() => {
                        setOpenInsight(prev => !prev)
                        setBacklogSetting(false)
                      }}
                    />
                  </TooltipWrapper>
                </div>
                <div>
                  <TooltipWrapper content="View settings">
                    <Settings2
                      size={10}
                      className='h-9 w-9 flex item-center justify-center py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer rounded-sm'
                      onClick={() => {
                        setBacklogSetting(prev => !prev)
                        setOpenInsight(false)
                      }}
                    />
                  </TooltipWrapper>
                </div>
              </div>
            </div>
          </div>


          <div className="flex-1 mt-5">
            <div className="space-y-4">
              <div className="">
                <CreateBacklog
                  onIssueClick={handleIssueClick}
                  createSprint={handleCreateSprint}
                  selectedIssue={selectedIssue}
                  userData={userData}
                  projectData={defaultProject}
                />
              </div>
            </div>
          </div>
        </div>

        {isAnySidebarPanelOpen && (
          <div className="w-full h-full flex-shrink-0 bg-neutral-50">

            {openInsight && (
              <Insight openInsight={openInsight} setOpenInsight={setOpenInsight} />
            )}
            {backlogSetting && (
              <BacklogLayoutSetting
                backlogSetting={backlogSetting}
                setBacklogSetting={setBacklogSetting}
                setShowEpic={setShowEpic}
              />
            )}
            {selectedIssue && !openInsight && !backlogSetting && (
              <EditIssue issue={selectedIssue} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Backlog;
