import React, { useMemo, useState } from 'react'
import ProjectDrawer from './ProjectDrawer'
import { Button } from '@/components/ui/button'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import CommonDynamicTable from '@/components/data-table/common-dynamic-table'
import { useGetProjectListQuery } from '@/redux/api/company/api'
import ManageAvatar from '@/components/common/ManageAvatar'
import { useProjectData } from '@/hooks/useProjectData'
import { useDispatch } from 'react-redux'
import { switchProject } from '@/redux/reducers/projectSlice'
import { Archive, MoreHorizontal, Settings, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const Project = () => {
  const [openTemplate, setOpenTemplate] = useState(false)
  const { allProjects } = useProjectData()
  console.log("allProjects", allProjects)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const [sorting, setSorting] = useState([])
  const [searchValue, setSearchValue] = useState({
    projectKey: '',
    projectName: '',
    leaderName: ''
  })

  const { data: projectData, isLoading: isProjectLoading, isFetching: isProjectFetching, isError } = useGetProjectListQuery({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    ...(searchValue.projectKey && { projectKey: searchValue.projectKey }),
    ...(searchValue.projectName && { projectName: searchValue.projectName }),
    ...(searchValue.leaderName && { leaderName: searchValue.leaderName }),

  })
  console.log("isError", isError)

  const showLoading = isProjectLoading || isProjectFetching

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: false,
      enableFiltering: true,
      cell: ({ row }) => {
        const redirectToProject = () => {

          const projectId = row.original._id
          // console.log("projectId", projectId)
          dispatch(switchProject(projectId))
          const findProject = allProjects.find(p => p._id === projectId)
          // console.log("findProject", findProject)

          const getProjectSlug = findProject?.project_slug
          const getTemplateSlug = findProject?.template.slug
          const getDefaultTab = findProject?.template?.fields?.tabs.find(tab => tab.isDefault === true)

          navigate(`/dashboard/${getProjectSlug}/${getTemplateSlug}/${getDefaultTab.url}`)
        }
        return (
          <span
            className='text-blue-900 hover:cursor-pointer hover:underline'
            onClick={redirectToProject}
          >
            {row.original.name}
          </span>
        )
      }
    },
    {
      accessorKey: 'project_key',
      header: 'Key',
      enableFiltering: true,
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    // {
    //   accessorKey: 'template_slug',
    //   header: 'Type'
    // },
    {
      accessorKey: 'project_slug',
      header: 'Type',
      cell: ({ getValue }) => {
        const slug = getValue();
        if (!slug) return

        const formattedSlug = slug.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

        return <span>{formattedSlug}</span>
      }
    },
    {
      accessorKey: 'leaderDetails',
      header: 'Lead',
      enableFiltering: true,
      enableSorting: false,
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
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const project = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 py-2">
              <DropdownMenuItem
                // onClick={() => handleProjectSettings(project._id)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Project setting</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => handleArchiveProject(project._id)}
                className="cursor-pointer"
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => handleDeleteProject(project._id)}
                className="cursor-pointer text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

  const handleSearchChange = (newSearchValues) => {
    console.log("Search values received:", newSearchValues)

    setSearchValue(prev => {
      const updated = { ...prev }

      // Map column accessorKeys to API parameter names
      Object.keys(newSearchValues).forEach(key => {
        switch (key) {
          case 'name':
            updated.projectName = newSearchValues[key]
            break
          case 'project_key':
            updated.projectKey = newSearchValues[key]
            break
          case 'leaderDetails':
            updated.leaderName = newSearchValues[key]
            break
          default:
            // For any other keys, use as-is
            updated[key] = newSearchValues[key]
        }
      })

      console.log("Updated search values:", updated)
      return updated
    })
  }

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <h1 className="text-neutral-500 text-2xl font-semibold">Project</h1>
        <div className='flex items-center gap-x-2'>
          <Button variant="teritary" onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })} >
            Create Project
          </Button>
          <Button variant="outline" onClick={() => setOpenTemplate(true)}>
            Templates
          </Button>
          <ProjectDrawer openDrawer={openTemplate} onClose={() => setOpenTemplate(false)} />
        </div>
      </div>


      <div >
        <CommonDynamicTable
          data={tableData}
          columns={columns}
          searchPlaceholder='Search project by name'
          searchColumn='name'
          showPagination={true}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          totalCount={totalCount}
          isLoading={showLoading}
          pageSizeOptions={[10, 20, 30, 50, 100]}
        />
      </div>


    </div>
  )
}

export default Project
