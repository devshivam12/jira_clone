import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery } from '@/redux/reducers/taskSlice';
import { Input } from '@/components/ui/input';
import ManageAvatar from '@/components/common/ManageAvatar';
import { useGetAllMemberListQuery } from '@/redux/api/company/team';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DottedSeparator } from '@/components/dotted-separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import EpicPanel from './epic-panel/EpicPanel';
import EpicListView from './epic-panel/EpicListView';
import CreateBacklog from './CreateBacklog';
import { ChartSpline, Ellipsis, Maximize, Maximize2, Search, Settings2, Share2, X } from 'lucide-react';
import Share from '../Share';
import Insight from '../Insight';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import BacklogLayoutSetting from '../BacklogLayoutSetting';
import EditIssue from './[id]/EditIssue';
import DeletedTasksPanel from '@/components/common/DeletedTasksPanel';
import { useParams, useSearchParams } from 'react-router-dom';
import { useUserData } from '@/hooks/useUserData';
import { useProjectData } from '@/hooks/useProjectData';

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
  const searchResultCount = useSelector((state) => state.taskSlice.searchResultCount)

  // Real project members for the assignee avatars next to search.
  const { data: memberListData } = useGetAllMemberListQuery({ page: 1, pageSize: 5 })
  const members = memberListData?.data?.members || []
  const totalMembers = memberListData?.data?.totalCount ?? members.length
  const extraMemberCount = Math.max(0, totalMembers - members.length)

  const [openInsight, setOpenInsight] = useState(false)
  const [backlogSetting, setBacklogSetting] = useState(false)

  // Personalised layout: list or board. Stored per project so each project
  // remembers the view the user last chose.
  const viewModeStorageKey = currentProject?._id ? `project_view_mode_${currentProject._id}` : null;
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    if (!viewModeStorageKey) return;
    const saved = localStorage.getItem(viewModeStorageKey);
    setViewMode(saved === 'board' ? 'board' : 'list');
  }, [viewModeStorageKey]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    if (viewModeStorageKey) localStorage.setItem(viewModeStorageKey, mode);
  }, [viewModeStorageKey]);

  // How the epics are shown: 'panel' is the narrow column beside the backlog,
  // 'list' is the full width list of epics with their tasks. Remembered per
  // project, like the layout above.
  const epicViewStorageKey = currentProject?._id ? `project_epic_view_${currentProject._id}` : null;
  const [epicView, setEpicView] = useState('panel');

  useEffect(() => {
    if (!epicViewStorageKey) return;
    const saved = localStorage.getItem(epicViewStorageKey);
    setEpicView(saved === 'list' ? 'list' : 'panel');
  }, [epicViewStorageKey]);

  const handleEpicViewChange = useCallback((view) => {
    setEpicView(view);
    if (epicViewStorageKey) localStorage.setItem(epicViewStorageKey, view);
  }, [epicViewStorageKey]);

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

  // The two epic views never show at the same time. In list view the epics
  // take over the main area, so the narrow column is not drawn, and the
  // backlog and sprint tables are unmounted while it is open - one long list
  // on screen instead of three.
  const showEpicSidebar = showEpic && epicView === 'panel';
  const showEpicList = showEpic && epicView === 'list';

  let gridColumnsClass = 'grid-cols-1';

  if (showEpicSidebar && isAnySidebarPanelOpen) {
    gridColumnsClass = 'lg:grid-cols-[260px_minmax(400px,1fr)_480px]';
  } else if (showEpicSidebar && !isAnySidebarPanelOpen) {
    gridColumnsClass = 'lg:grid-cols-[260px_minmax(0,1fr)]';
  } else if (!showEpicSidebar && isAnySidebarPanelOpen) {
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
    <div className='flex flex-col h-full bg-white'>
      <div className={`grid ${gridColumnsClass} grid-rows-[minmax(0,1fr)] w-full h-full min-h-0 divide-x divide-neutral-200`}>
        {showEpicSidebar && (
          <div className="hidden lg:flex flex-col w-full h-full min-h-0 bg-neutral-50/50">
            <div className="flex-1 min-h-0 p-3">
              <EpicPanel
                projectData={defaultProject}
                onClose={() => setShowEpic(false)}
                onViewChange={handleEpicViewChange}
              />
            </div>
          </div>
        )}

        {showEpicList ? (
          <div className="flex flex-col min-h-0 relative min-w-0">
            <EpicListView
              projectData={defaultProject}
              onViewChange={handleEpicViewChange}
              onClose={() => setShowEpic(false)}
            />
          </div>
        ) : (
        <div className="flex flex-col min-h-0 relative min-w-0">
          <div className="flex-none px-6 py-6 pb-4 border-b border-transparent">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] font-semibold text-neutral-800 tracking-tight leading-tight">
                  {viewMode === 'board' ? 'Board' : 'Backlog'}
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-500 uppercase tracking-wide">
                  {viewMode === 'board' ? 'Board view' : 'List view'}
                </span>
              </div>

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
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search backlog"
                    className={`h-9 pl-9 pr-8 bg-white border-neutral-300 rounded-md focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 ${isExpand ? 'w-[320px]' : 'w-[260px]'} shadow-sm hover:bg-neutral-50`}
                    onFocus={() => setIsExpand(true)}
                    onBlur={() => setIsExpand(false)}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                  {localSearch && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setLocalSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {localSearch.trim() && (
                  <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">
                    {searchResultCount == null
                      ? 'Searching…'
                      : `${searchResultCount} result${searchResultCount === 1 ? '' : 's'}`}
                  </span>
                )}
              </div>

              <div className="flex -space-x-1.5">
                {members.map((member) => (
                  <div key={member._id} className="rounded-full ring-2 ring-white hover:-translate-y-0.5 transition-transform">
                    <ManageAvatar
                      firstName={member.first_name}
                      lastName={member.last_name}
                      image={member.image}
                      size="sm"
                      tooltipContent={`${member.first_name} ${member.last_name}`}
                      showTooltip={true}
                    />
                  </div>
                ))}
                {extraMemberCount > 0 && (
                  <div className="h-8 w-8 rounded-full ring-2 ring-white bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                    +{extraMemberCount}
                  </div>
                )}
              </div>

              <div className="h-5 w-[1px] bg-neutral-300 mx-1 hidden sm:block"></div>

              <div>
                <Select>
                  <SelectTrigger className="h-9 w-auto min-w-[100px] gap-2 border border-transparent bg-neutral-100 text-neutral-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-600 data-[state=open]:border-blue-200 rounded transition-colors focus:ring-0 shadow-none px-3 font-medium">
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

          <div className={`flex-1 min-h-0 custom-scrollbar ${viewMode === 'board' ? 'overflow-hidden px-6 pt-2 pb-4' : 'overflow-y-auto px-6 pb-20'}`}>
            <CreateBacklog
              onIssueClick={handleIssueClick}
              createSprint={handleCreateSprint}
              userData={userData}
              projectData={defaultProject}
              viewMode={viewMode}
            />
          </div>
        </div>
        )}

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
                showEpic={showEpic}
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
                epicView={epicView}
                setEpicView={handleEpicViewChange}
              />
            )}
            {selectedIssue && !openInsight && !backlogSetting && (
              <EditIssue issue={selectedIssue} />
            )}
          </div>
        )}
      </div>

      <DeletedTasksPanel />
    </div>
  );
};

export default Backlog;
