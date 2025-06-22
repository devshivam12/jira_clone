import React, { useMemo, useState } from 'react'
import ProjectDrawer from './ProjectDrawer'
import { Button } from '@/components/ui/button'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import CommonDynamicTable from '@/components/data-table/common-dynamic-table'
import { useGetProjectListQuery } from '@/redux/api/company/api'
import ManageAvatar from '@/components/common/ManageAvatar'

const Project = () => {
  const [openTemplate, setOpenTemplate] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { data: projectData, isLoading: isProjectLoading, isError } = useGetProjectListQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize
  })
  console.log("isError", isError)


  const columns = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'project_key',
      header: 'Key',
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    {
      accessorKey: 'template_slug',
      header: 'Type'
    },
    {
      accessorKey: 'leaderDetails',
      header: 'Lead',
      cell: ({ row }) => {
        const leader = row.original.leaderDetails
        console.log('leader', leader)
        if (!leader) {
          return <span className="text-muted-foreground">No leader assigned</span>
        }

        return (
          <div className='flex items-center gap-x-4'>
            <ManageAvatar
              firstName={leader.first_name}
              lastName={leader.last_name}
              image={leader.image}
            />
            <span>{leader.first_name + " " + leader.last_name}</span>
          </div>

        )
      }
    }
  ]

  const tableData = useMemo(() => {
    if (!projectData?.data?.projectData) {
      return []
    }

    return projectData.data.projectData
  }, [projectData])

  
  const totalCount = projectData?.data?.pagination?.totalCount || 0

  return (
    <div className=''>
      <div className=''>
        <Button variant="teritary" onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })} >
          Create Project
        </Button>
        <Button variant="outline" onClick={() => setOpenTemplate(true)}>
          Templates
        </Button>
        <ProjectDrawer openDrawer={openTemplate} onClose={() => setOpenTemplate(false)} />
      </div>

      <CommonDynamicTable
        data={tableData}
        columns={columns}
        searchPlaceholder='Search project by name'
        searchColumn='name'
        showPagination={true}        
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={totalCount}
        isLoading={isProjectLoading}
        pageSizeOptions={[10, 20, 30, 50, 100]}
      />
    </div>
  )
}

export default Project
