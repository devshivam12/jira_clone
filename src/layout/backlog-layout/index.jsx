import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery } from '@/redux/reducers/taskSlice';
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
  const defaultProject = React.useMemo(() => ({
    currentProject: currentProject,
    workType: workType,
    importance: importance,
    workFlow: workFlow
  }), [currentProject, workType, importance, workFlow]);

  const selectedIssue = issueId ? true : false;
  const dispatch = useDispatch();
  const [localSearch, setLocalSearch] = useState("");
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

  const [openInsight, setOpenInsight] = useState(false)
  const [backlogSetting, setBacklogSetting] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setSearchQuery(localSearch));
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch, dispatch]);

  const handleCreateSprint = useCallback(() => {
    const newSprint = {
      id: sprint.length + 1,
      name: `SCRUM Sprint ${sprint.length + 1}`
    }
    setSprint(prev => [...prev, newSprint])
  }, [sprint.length]);

  const handleIssueClick = useCallback((issue) => {
    setOpenInsight(false)
    setBacklogSetting(false)
  }, []);

  const isAnySidebarPanelOpen = openInsight || backlogSetting || selectedIssue;

  let gridColumnsClass = 'grid-cols-1';

  if (showEpic && isAnySidebarPanelOpen) {
    gridColumnsClass = 'lg:grid-cols-[260px_minmax(400px,1fr)_480px]';
  } else if (showEpic && !isAnySidebarPanelOpen) {
    gridColumnsClass = 'lg:grid-cols-[260px_minmax(0,1fr)]';
  } else if (!showEpic && isAnySidebarPanelOpen) {
    gridColumnsClass = 'lg:grid-cols-[minmax(400px,1fr)_480px]';
  } else {
    gridColumnsClass = 'lg:grid-cols-[minmax(0,1fr)]';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-neutral-500 font-medium">Loading project details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-[calc(100vh-56px)] bg-white'>
      <div className={`grid ${gridColumnsClass} w-full h-full min-h-0 divide-x divide-neutral-200`}>
        {showEpic && (
          <div className="hidden lg:flex flex-col w-full h-full min-h-0 bg-neutral-50/50">
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <Epic showEpic={showEpic} setShowEpic={setShowEpic} />
            </div>
          </div>
        )}

        <div className="flex flex-col min-h-0 relative min-w-0">
          <div className="flex-none px-6 py-6 pb-4 border-b border-transparent">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[24px] font-semibold text-neutral-800 tracking-tight leading-tight">
                Backlog
              </h1>

              <div className='flex items-center gap-x-2'>
                <TooltipWrapper content="Backlog insight">
                  <button
                    className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${openInsight ? 'bg-blue-50 text-blue-600' : 'text-neutral-500 hover:bg-neutral-100'}`}
                    onClick={() => {
                      setOpenInsight(prev => !prev)
                      setBacklogSetting(false)
                    }}
                  >
                    <ChartSpline size={18} strokeWidth={2} />
                  </button>
                </TooltipWrapper>
                <TooltipWrapper content="View settings">
                  <button
                    className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${backlogSetting ? 'bg-blue-50 text-blue-600' : 'text-neutral-500 hover:bg-neutral-100'}`}
                    onClick={() => {
                      setBacklogSetting(prev => !prev)
                      setOpenInsight(false)
                    }}
                  >
                    <Settings2 size={18} strokeWidth={2} />
                  </button>
                </TooltipWrapper>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search backlog"
                  className={`h-9 pl-9 bg-white border-neutral-300 rounded focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 ${isExpand ? 'w-[250px]' : 'w-[200px]'} shadow-sm hover:bg-neutral-50`}
                  onFocus={() => setIsExpand(true)}
                  onBlur={() => setIsExpand(false)}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              </div>

              <div className="flex -space-x-1.5">
                {randomData.map((user, index) => (
                  <Avatar key={index} className="h-8 w-8 border-2 border-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <AvatarFallback className="bg-neutral-100 font-medium text-xs text-neutral-600 uppercase">
                      {user.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>

              <div className="h-5 w-[1px] bg-neutral-300 mx-1 hidden sm:block"></div>

              <div>
                <Select>
                  <SelectTrigger className="h-9 w-auto min-w-[100px] gap-2 border-none bg-neutral-100 hover:bg-neutral-200/80 rounded transition-colors focus:ring-0 shadow-none px-3 font-medium text-neutral-700">
                    <SelectValue placeholder="Epic" />
                  </SelectTrigger>
                  <SelectContent align="start" className="w-[280px] bg-white shadow-lg rounded-md border border-neutral-200 z-50 p-2">
                    <div className="p-2 mb-1">
                      <p className="text-neutral-500 text-sm">Your project has no Epic</p>
                    </div>
                    <DottedSeparator className="opacity-50 my-1" />
                    <label className="flex items-center gap-x-3 p-2 mt-1 hover:bg-neutral-100 rounded cursor-pointer transition-colors">
                      <Switch id="show-epic" checked={showEpic} onCheckedChange={(checked) => setShowEpic(checked)} />
                      <span className="text-sm font-medium text-neutral-700">Show Epic Panel</span>
                    </label>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
            <CreateBacklog
              onIssueClick={handleIssueClick}
              createSprint={handleCreateSprint}
              userData={userData}
              projectData={defaultProject}
            />
          </div>
        </div>

        {isAnySidebarPanelOpen && (
          <div className="fixed inset-0 z-[60] bg-white w-full h-full lg:static lg:z-auto lg:w-auto shadow-xl lg:shadow-[none] transition-all">
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
