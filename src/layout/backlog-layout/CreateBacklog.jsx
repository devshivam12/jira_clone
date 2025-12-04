import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SprintTable from '@/components/data-table/create-sprint-data-table';
import BacklogTable from '@/components/data-table/backlog-table'
import { useGetBacklogListMutation } from '@/redux/graphql_api/task';
import { useProjectData } from '@/hooks/useProjectData';


const CreateBacklog = ({ createSprint, onIssueClick, selectedIssue, setSelectedIssue }) => {
  const [backlog, { isLoading }] = useGetBacklogListMutation()

  const [backlogData, setBacklogData] = useState([])
  const [expanded, setExpanded] = useState(true)
  const {currentProject} = useProjectData()

  const handleOpen = useCallback(() => {
    setExpanded((value) => !value)
  },[])
  const fetchBacklog = async () => {
    try {
      const payload = {
        operationName: 'getBacklogData',
        query: `
          query GetBacklogData($projectId : String, $page:Int, $limit:Int){
            getBacklogData(projectId : $projectId, page:$page, limit:$limit){
              data {
                _id
                summary
                taskNumber
                work_type 
                task_status 
                importance 
                project_key 
                task_statue
                assigneeDetail { first_name, last_name, _id} 
                teamDetail {team_name, team_icon} } 
                  page 
                  limit
              }
            }
          }
        `,
        variables: {
          page: 1,
          limit: 10,
          projectId: currentProject?._id,
          epic : false
        }
      }
      const result = await backlog(payload).unwrap()
      if (result?.data?.getBacklogData?.data) {
        setBacklogData(result?.data?.getBacklogData?.data)
      }
      console.log("result", result)
    } catch (error) {
      console.log("error", error)
    }
  }

  useEffect(() => {
    fetchBacklog()
  }, [])
  console.log("backlogData", backlogData)
  return (
    <Card className="w-full border-0 bg-none bg-card-none shadow-none border-bg-0 outline-none p-4 min-h-[100px] transition-all duration-300 rounded-none ">
      <BacklogTable issue={backlogData} expanded={expanded} onToggleExpand={handleOpen}  />
       
      <SprintTable />
    </Card>
  );
};

export default CreateBacklog;