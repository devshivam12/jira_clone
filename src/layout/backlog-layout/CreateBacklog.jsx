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
  const dispatch = useDispatch()
  const { data: backlog, isFetching: taskFetching } = useGetBacklogListQuery({
    operationName: "getBacklogData",
    variables: {
      epic: false,
      limit: 100,
      page: 1,
      projectId: currentProject?._id,
    }
  })
  const issueList = backlog?.data?.getBacklogData?.data

  useEffect(() => {
    if (!backlog?.data?.getBacklogData) return;

    dispatch(
      setTaskQuery({
        page: backlog.data.getBacklogData.page,
        limit: backlog.data.getBacklogData.limit,
      })
    );
  }, [backlog, dispatch]);

  const handleOpen = useCallback(() => {
    setExpanded((value) => !value)
  }, [])

  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 min-h-[100px] transition-all duration-300 rounded-none ">
      <BacklogTable
        issue={issueList}
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