import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';
import BacklogTable from '@/components/data-table/backlog-table'
import { useGetBacklogListQuery } from '@/redux/graphql_api/task';
import { useDispatch } from 'react-redux';
import { setTaskQuery } from '@/redux/reducers/taskSlice';


const CreateBacklog = ({ createSprint, onIssueClick, selectedIssue, setSelectedIssue, userData, projectData }) => {

  const { currentProject } = projectData
  const [expanded, setExpanded] = useState(true)
  const LIMIT = 100
  const [allIssue, setAllIssue] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)
  const dispatch = useDispatch()

  const { data: backlog, isFetching: taskFetching } = useGetBacklogListQuery({
    operationName: "getBacklogData",
    variables: {
      epic: false,
      limit: LIMIT,
      page: page,
      projectId: currentProject?._id,
    }
  })

  useEffect(() => {
    if (taskFetching) return;

    const newData = backlog?.data?.getBacklogData?.data
    if (!newData) return;

    setAllIssue(prev => {
      if (page === 1) return newData
      const map = new Map(prev.map(t => [t._id, t]))
      newData.forEach(t => map.set(t._id, t))
      return Array.from(map.values())
    })

    if (newData.length < LIMIT) {
      setHasMore(false)
    }
  }, [backlog, page, taskFetching]);

  useEffect(() => {
    if (!taskFetching) {
      loadingRef.current = false;
    }
  }, [taskFetching]);

  const loadMore = useCallback(() => {
    if (!hasMore || taskFetching || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setPage(prev => prev + 1);
  }, [hasMore, taskFetching, page]);

  const handleOpen = useCallback(() => {
    setExpanded((value) => !value)
  }, [])

  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 transition-all duration-300 rounded-none ">
      <BacklogTable
        issue={allIssue}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={taskFetching}
        expanded={expanded}
        onToggleExpand={handleOpen}
        userData={userData}
        projectData={projectData}
      />

      <SprintTable />
    </Card>
  );
};

export default CreateBacklog;