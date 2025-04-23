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
import EditIssue from './EditIssue';

const randomData = [
  { first_name: "Shivam" },
  { first_name: "Mittal" },
  { first_name: "SM" }
];

const Backlog = () => {
  const [isExpand, setIsExpand] = useState(false);
  const [showEpic, setShowEpic] = useState(false);
  const [sprint, setSprint] = useState([
    {
      id: 1,
      name: 'SCRUM Sprint 1'
    }
  ])

  const [selectedIssue, setSelectedIssue] = useState(null)

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
    setSelectedIssue(issue)
  }
console.log("selectedIssue", selectedIssue)
  return (
    <div className='space-y-5'>
      {/* Title */}
      <div className='flex items-center justify-between'>
        <h1 className="text-neutral-500 text-2xl font-semibold">Backlog</h1>
        <div className='flex items-center gap-x-4'>
          <div className='relative'>

            <TooltipWrapper content="Share">
              <Share2 size={10} className='h-9 w-9 flex item-center justify-center py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer rounded-sm' onClick={() => setOpenCommonShare(prev => !prev)} />
            </TooltipWrapper>

            {openCommonShare && (
              <div className='absolute top-full right-0 mt-2 z-50 w-[400px]'>
                <Share />
              </div>
            )}
          </div>
          {/* <Maximize2 size={10} className='h-9 w-9 flex item-center justify-center py-1 px-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 cursor-pointer rounded-sm' /> */}
          <Ellipsis size={10} className='h-9 w-9 flex item-center justify-center py-1 px-2 bg-neutral-100 hover:bg-neutral-200 cursor-pointer rounded-sm text-neutral-600' />
        </div>
      </div>

      {/* Search & Avatars */}
      <div className='flex items-center justify-between'>
        <div className="flex items-center gap-x-4">
          {/* Search Box */}
          <div className='flex items-center justify-between space-x-1 relative'>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search size={15} className="text-neutral-500" />
            </div>
            <Input
              type="text"
              placeholder="Search"
              className={`px-8 pl-8 w-40 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 hover:bg-neutral-100 ${isExpand ? 'w-52' : 'w-40'}`}
              onFocus={() => setIsExpand(true)}
              onBlur={() => setIsExpand(false)}
            />
          </div>

          {/* Multiple Avatars */}
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

      {/* Main Content */}
      <div className="flex justify-between gap-x-2 w-full max-w-full">
        {/* Left Div */}
        <div className="flex-shrink-0">
          {showEpic && <Epic showEpic={showEpic} setShowEpic={setShowEpic} />}
        </div>

        {/* Middle Div with Horizontal Scrollbar */}
        <div className="space-y-6 flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-auto max-h-[390px]">
          <div className="min-w-[800px]">
            {
              sprint.map((sprint) => (
                <div key={sprint.id} className="w-full">
                  <Sprint sprintName={sprint.name} />
                </div>
              ))
            }
            <div className="w-full">
              <CreateBacklog
                onIssueClick={handleIssueClick}
                createSprint={handleCreateSprint}
                selectedIssue={selectedIssue}
                setSelectedIssue={setSelectedIssue}
              />
            </div>
          </div>
        </div>

        {/* Right Div */}
        <div className="flex-shrink-0 ">
          {openInsight &&
            <Insight openInsight={openInsight} setOpenInsight={setOpenInsight} />}
          {
            backlogSetting &&
            <BacklogLayoutSetting backlogSetting={backlogSetting} setBacklogSetting={setBacklogSetting} setShowEpic={setShowEpic} />
          }
          {
            selectedIssue && (
              <EditIssue issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
            )
          }
        </div>
      </div>

    </div>
  );
};

export default Backlog;
