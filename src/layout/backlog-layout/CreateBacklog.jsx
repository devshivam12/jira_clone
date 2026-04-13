import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';
import BacklogTable from '@/components/data-table/backlog-table'
import { useGetBacklogListQuery, useFilterTaskMutation } from '@/redux/graphql_api/task';
import { useDispatch, useSelector } from 'react-redux';
import { setTaskQuery, setStatusCount } from '@/redux/reducers/taskSlice';
import CreateSprint from './common-component/CreateSprint';
import { Plus } from 'lucide-react';


const CreateBacklog = ({ createSprint, onIssueClick, userData, projectData }) => {

  const { currentProject } = projectData
  const [expanded, setExpanded] = useState(true)
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false)
  const LIMIT = 100
  const [allIssue, setAllIssue] = useState([])
  const [page, setPage] = useState(1)
  const [hasMoreMain, setHasMoreMain] = useState(true)

  // Track group-wise pagination
  const [groupPages, setGroupPages] = useState({});
  const [hasMoreGroups, setHasMoreGroups] = useState({});
  const [loadOptions, setLoadOptions] = useState({ page: 1, status: null });

  const loadingRef = useRef(false)
  const dispatch = useDispatch()
  const [filterTask, { isLoading: isFiltering }] = useFilterTaskMutation();
  const [filteredIssue, setFilteredIssue] = useState([]);
  const [filteredSprints, setFilteredSprints] = useState([]);

  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const statusCount = useSelector((state) => state.taskSlice.statusCount);
  const searchQuery = useSelector((state) => state.taskSlice.searchQuery);

  const { data: backlog, isFetching: taskFetching } = useGetBacklogListQuery({
    operationName: "getBacklogData",
    variables: {
      epic: false,
      limit: LIMIT,
      page: loadOptions.page,
      projectId: currentProject?._id,
      ...(loadOptions.status ? { task_status: loadOptions.status } : {})
    }
  })

  useEffect(() => {
    if (taskFetching) return;

    const newData = backlog?.data?.getBacklogData?.data
    const newStatusCount = backlog?.data?.getBacklogData?.statusCount;
    if (!newData) return;

    if (newStatusCount) {
      dispatch(setStatusCount(newStatusCount));
    }

    setAllIssue(prev => {
      // Re-initialize only on first overall load without status
      if (loadOptions.page === 1 && !loadOptions.status) return newData
      const map = new Map(prev.map(t => [t._id, t]))
      newData.forEach(t => map.set(t._id, t))
      return Array.from(map.values())
    })

    if (newData.length < LIMIT) {
      if (loadOptions.status) {
        setHasMoreGroups(prev => ({ ...prev, [loadOptions.status]: false }));
      } else {
        setHasMoreMain(false)
      }
    } else {
      if (loadOptions.status) {
        setHasMoreGroups(prev => ({ ...prev, [loadOptions.status]: true }));
      } else {
        setHasMoreMain(true)
      }
    }
  }, [backlog, taskFetching, loadOptions]);

  useEffect(() => {
    if (!taskFetching) {
      loadingRef.current = false;
    }
  }, [taskFetching]);

  useEffect(() => {
    let isActive = true;
    let promise;

    if (searchQuery) {
      loadingRef.current = true;
      promise = filterTask({
        operationName: 'filterTask',
        variables: {
          searchquery: searchQuery,
          selectedfilter: '',
          cursor: null
        }
      });
      
      promise.then((res) => {
        if (!isActive) return;
        const result = res?.data?.data?.filterTask;
        if (result) {
          setFilteredIssue(result.backlog || []);
          setFilteredSprints(result.sprints || []);
          setCursor(result.cursor);
          setHasMore(result.hasMore);
        }
      }).finally(() => {
        if (isActive) {
          loadingRef.current = false;
        }
      });
    } else {
      loadingRef.current = false;
      setFilteredIssue([]);
      setFilteredSprints([]);
      setCursor(null);
      setHasMore(true);
    }

    return () => {
      isActive = false;
      if (promise) {
        promise.abort();
      }
    };
  }, [searchQuery, filterTask]);

  const loadMore = useCallback((status) => {
    if (taskFetching || loadingRef.current) {
      return;
    }

    if (status && typeof status === 'string') {
      if (hasMoreGroups[status] === false) return;
      loadingRef.current = true;
      setGroupPages(prev => {
        const nextPage = (prev[status] || 1) + 1;
        setLoadOptions({ page: nextPage, status });
        return { ...prev, [status]: nextPage };
      });
    } else {
      if (!hasMoreMain) return;
      loadingRef.current = true;
      setPage(prev => {
        const nextPage = prev + 1;
        setLoadOptions({ page: nextPage, status: null });
        return nextPage;
      });
    }
  }, [taskFetching, hasMoreGroups, hasMoreMain]);

  const loadMoreSearch = useCallback(async () => {

    if (!hasMore || isFiltering || loadingRef.current) return

    loadingRef.current = true;
    try {
      const res = await filterTask({
        operationName: "filterTask",
        variables: {
          searchquery: searchQuery,
          selectedfilter: '',
          cursor: cursor
        }
      })

    const result = res?.data?.data?.filterTask
    console.log("resultresultresultresult", result)
    if (result) {

      setFilteredIssue(prev => {
        const map = new Map(prev.map(t => [t._id, t]))
          ; (result.backlog || []).forEach(t => map.set(t._id, t))
        return Array.from(map.values())
      })

      setFilteredSprints(prev => {
        const sprintMap = new Map((prev || []).map(s => [s.sprintId, s]));
        (result.sprints || []).forEach(s => {
          const existing = sprintMap.get(s.sprintId);
          if (existing) {
            const taskMap = new Map((existing.tasks || []).map(t => [t._id, t]));
            (s.tasks || []).forEach(t => taskMap.set(t._id, t));
            sprintMap.set(s.sprintId, { ...existing, tasks: Array.from(taskMap.values()) });
          } else {
            sprintMap.set(s.sprintId, s);
          }
        })
        return Array.from(sprintMap.values());
      })

      setCursor(result.cursor)
      setHasMore(result.hasMore)
    }
    } finally {
      loadingRef.current = false;
    }

  }, [cursor, searchQuery, hasMore, isFiltering, filterTask])

  const handleOpen = useCallback(() => {
    setExpanded((value) => !value)
  }, [])

  const displayIssues = searchQuery ? filteredIssue : allIssue;

  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 transition-all duration-300 rounded-none space-y-4">
      <BacklogTable
        issue={displayIssues}
        statusCount={statusCount}
        onLoadMore={searchQuery ? loadMoreSearch : loadMore}
        hasMore={searchQuery ? hasMore : hasMoreMain}
        isLoading={searchQuery ? isFiltering : taskFetching}
        expanded={expanded}
        onToggleExpand={handleOpen}
        userData={userData}
        projectData={projectData}
        searchQuery={searchQuery}
        paginationToken={searchQuery ? (cursor ? JSON.stringify(cursor) : 'null') : loadOptions.page}
      />

      {/* Decorative and Interactive Separator */}
      {displayIssues.length > 0 && (
        <div 
          className="relative flex items-center py-4 sm:py-6 group cursor-pointer" 
          onClick={() => setIsCreateSprintOpen(true)}
        >
          <div className="flex-grow border-t border-dashed border-gray-300 transition-colors group-hover:border-blue-300"></div>
          <div className="flex items-center gap-1 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors bg-white absolute left-1/2 transform -translate-x-1/2 rounded-full ring-4 ring-white shadow-sm duration-300">
            Sprints
            <span className="flex items-center justify-center rounded-full p-[2px] bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300 ml-1">
               <Plus size={14} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      )}

      <SprintTable
        projectData={projectData}
        searchQuery={searchQuery}
        filteredSprints={filteredSprints}
        onLoadMore={searchQuery ? loadMoreSearch : () => {}}
        hasMore={searchQuery ? hasMore : false}
        isLoading={searchQuery ? isFiltering : false}
        paginationToken={searchQuery ? (cursor ? JSON.stringify(cursor) : 'null') : null}
      />

      <CreateSprint 
        isOpen={isCreateSprintOpen} 
        onClose={() => setIsCreateSprintOpen(false)} 
        sprintId={null} 
      />
    </Card>
  );
};

export default React.memo(CreateBacklog);