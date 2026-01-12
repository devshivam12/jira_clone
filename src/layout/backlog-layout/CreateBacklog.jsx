import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';
import BacklogTable from '@/components/data-table/backlog-table'
import { useGetBacklogListQuery } from '@/redux/graphql_api/task';
import { useProjectData } from '@/hooks/useProjectData';


const CreateBacklog = ({ createSprint, onIssueClick, selectedIssue, setSelectedIssue }) => {

  const { currentProject } = useProjectData()
  const [backlogData, setBacklogData] = useState([])
  const [expanded, setExpanded] = useState(true)
  const { data: backlog, isFetching: taskFetching } = useGetBacklogListQuery({
    operationName: "getBacklogData",
    variables: {
      epic: false,
      limit: 10,
      page: 1,
      projectId: currentProject?._id,
    }
  })
  const issueList = backlog?.data?.getBacklogData?.data

  // useEffect(() => {
  //   if (issueList) {
  //     setBacklogData(issueList)
  //   }
  // }, [issueList])



  const handleOpen = useCallback(() => {
    setExpanded((value) => !value)
  }, [])

  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 min-h-[100px] transition-all duration-300 rounded-none ">
      <BacklogTable
        issue={issueList}
        expanded={expanded}
        onToggleExpand={handleOpen}
      />

      <SprintTable />
    </Card>
  );
};

export default CreateBacklog;