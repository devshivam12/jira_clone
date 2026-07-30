import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';
import BacklogTable from '@/components/data-table/backlog-table'
import { useGetBacklogListQuery, useFilterTaskMutation } from '@/redux/graphql_api/task';
import { useDispatch, useSelector } from 'react-redux';
import { setTaskQuery, setStatusCount, setSearchResultCount } from '@/redux/reducers/taskSlice';
import CreateSprint from './common-component/CreateSprint';
import BacklogBoard from './BacklogBoard';
import { Plus } from 'lucide-react';

const noop = () => {};

const CreateBacklog = ({ createSprint, onIssueClick, userData, projectData, viewMode = 'list' }) => {

  const { currentProject } = projectData
  const [expanded, setExpanded] = useState(true)
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false)
  const LIMIT = 100
  const [allIssue, setAllIssue] = useState([])
  // Cursor based paging. `cursorMain` is the rank we are currently asking the
  // server for (null means the first page). The server returns the next cursor
  // to use for the page after this one.
  const [cursorMain, setCursorMain] = useState(null)
  const [hasMoreMain, setHasMoreMain] = useState(true)

  // Reset state when project changes to prevent stale data merging
  useEffect(() => {
    setAllIssue([]);
    setCursorMain(null);
    setHasMoreMain(true);
  }, [currentProject?._id]);

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
      cursor: cursorMain,
      projectId: currentProject?._id
    }
  })

  useEffect(() => {
    if (taskFetching) return;

    const payload = backlog?.data?.getBacklogData;
    const newData = payload?.data;
    const newStatusCount = payload?.statusCount;
    if (!newData) return;

    // The status count only comes back on the first page, so only apply it
    // when it is present.
    if (newStatusCount && newStatusCount.length) {
      dispatch(setStatusCount(newStatusCount));
    }

    setAllIssue(prev => {
      // First page (no cursor) replaces the list. Later pages append and drop
      // any row we already have so there are no duplicates.
      if (!cursorMain) return newData;
      const newIds = new Set(newData.map(t => t._id));
      return [...prev.filter(t => !newIds.has(t._id)), ...newData];
    });

    setHasMoreMain(!!payload.hasMore);
  }, [backlog, taskFetching, cursorMain, dispatch]);

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
      setFilteredIssue([]);
      setFilteredSprints([]);
      setCursor(null);
      setHasMore(true);

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
    };
  }, [searchQuery, filterTask]);

  const loadMore = useCallback(() => {
    if (taskFetching || loadingRef.current) return;
    if (!hasMoreMain) return;

    // The next cursor is returned on the current page's response.
    const nextCursor = backlog?.data?.getBacklogData?.cursor;
    if (!nextCursor) {
      setHasMoreMain(false);
      return;
    }
    loadingRef.current = true;
    setCursorMain(nextCursor);
  }, [taskFetching, hasMoreMain, backlog]);

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
          const newIds = new Set((result.backlog || []).map(t => t._id));
          return [...prev.filter(t => !newIds.has(t._id)), ...(result.backlog || [])];
        });

        setFilteredSprints(prev => {
          const sprintMap = new Map((prev || []).map(s => [s.sprintId, s]));
          (result.sprints || []).forEach(s => {
            const existing = sprintMap.get(s.sprintId);
            if (existing) {
              const newTaskIds = new Set((s.tasks || []).map(t => t._id));
              const oldTasks = (existing.tasks || []).filter(t => !newTaskIds.has(t._id));
              sprintMap.set(s.sprintId, { ...existing, tasks: [...oldTasks, ...(s.tasks || [])] });
            } else {
              sprintMap.set(s.sprintId, s);
            }
          });
          return Array.from(sprintMap.values());
        });

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

  // Keep the search result count in the store so the search box in the backlog
  // header can show how many issues currently match.
  useEffect(() => {
    if (!searchQuery) {
      dispatch(setSearchResultCount(null));
      return;
    }
    const sprintTaskCount = filteredSprints.reduce((total, sprint) => total + (sprint.tasks?.length || 0), 0);
    dispatch(setSearchResultCount(filteredIssue.length + sprintTaskCount));
  }, [searchQuery, filteredIssue, filteredSprints, dispatch]);

  const displayIssues = searchQuery ? filteredIssue : allIssue;

  if (viewMode === 'board') {
    return (
      <div className="w-full h-full min-h-0 pt-2">
        <BacklogBoard
          issue={displayIssues}
          projectData={projectData}
          isLoading={searchQuery ? isFiltering : taskFetching}
          hasMore={searchQuery ? hasMore : hasMoreMain}
          onLoadMore={searchQuery ? loadMoreSearch : loadMore}
          searchQuery={searchQuery}
        />
        <CreateSprint
          isOpen={isCreateSprintOpen}
          onClose={() => setIsCreateSprintOpen(false)}
          sprintId={null}
        />
      </div>
    );
  }

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
        paginationToken={searchQuery ? (cursor ? JSON.stringify(cursor) : 'null') : (cursorMain || 'start')}
        onCreateSprintClick={() => setIsCreateSprintOpen(true)}
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
        onLoadMore={searchQuery ? loadMoreSearch : noop}
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