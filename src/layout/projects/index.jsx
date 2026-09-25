import React, { useCallback, useMemo, useState } from 'react'
import ProjectDrawer from './ProjectDrawer'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
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

  const showLoading = isProjectLoading || isProjectFetching

  const handleProjectSettings = useCallback((id) => {
    navigate(`/dashboard/project/edit/${id}`)
  }, [navigate])

  const openProject = useCallback((projectId) => {
    const findProject = allProjects.find(p => p._id === projectId)
    if (!findProject) return

    const getProjectSlug = findProject.project_slug
    const getTemplateSlug = findProject.template?.slug
    const tabs = findProject.template?.fields?.tabs || []
    // A template does not always mark a default tab. Falling back to the first
    // tab keeps the name from being a dead link instead of throwing.
    const getDefaultTab = tabs.find(tab => tab.isDefault === true) || tabs[0]

    if (!getProjectSlug || !getTemplateSlug || !getDefaultTab?.url) return

    dispatch(switchProject(projectId))
    navigate(`/dashboard/${getProjectSlug}/${getTemplateSlug}/${getDefaultTab.url}`)
  }, [allProjects, dispatch, navigate])

  // Fixed widths keep the columns from resizing between the loading skeleton
  // and the loaded rows, and stop a long project name from squeezing the rest.
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: false,
      // No header filter here. The toolbar search box already searches by name,
      // and two controls for the same field only confused the header row.
      enableFiltering: false,
      meta: { width: '32%' },
      cell: ({ row }) => (
        <button
          type="button"
          className='inline-block max-w-full truncate rounded align-middle text-left font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          onClick={() => openProject(row.original._id)}
        >
          {row.original.name}
        </button>
      )
    },
    {
      accessorKey: 'project_key',
      header: 'Key',
      enableFiltering: true,
      enableSorting: true,
      meta: { width: '14%' },
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    {
      accessorKey: 'project_slug',
      header: 'Type',
      meta: { width: '18%' },
      cell: ({ getValue }) => {
        const slug = getValue();
        if (!slug) return <span className="text-neutral-400">&mdash;</span>

        const formattedSlug = slug.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

        return <span>{formattedSlug}</span>
      }
    },
    {
      accessorKey: 'leaderDetails',
      header: 'Lead',
      enableFiltering: true,
      enableSorting: false,
      meta: { width: '26%' },
      cell: ({ row }) => {
        const leader = row.original.leaderDetails
        if (!leader) {
          return <span className="text-neutral-400">Unassigned</span>
        }

        return (
          <div className='flex min-w-0 items-center gap-2'>
            <ManageAvatar
              size='sm'
              firstName={leader.first_name}
              lastName={leader.last_name}
              image={leader.image}
            />
            <span className='truncate'>{leader.first_name + " " + leader.last_name}</span>
          </div>

        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { width: '10%', align: 'right' },
      cell: ({ row }) => {
        const project = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 py-2">
              <DropdownMenuItem
                onClick={() => handleProjectSettings(project._id)}
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
  ], [openProject, handleProjectSettings])

  const tableData = useMemo(() => {
    if (!projectData?.data?.projectData) {
      return []
    }

    return projectData.data.projectData
  }, [projectData])


  const totalCount = projectData?.data?.pagination?.totalCount || 0

  const handleSearchChange = (newSearchValues) => {

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

      return updated
    })
  }

  return (
    <div className='space-y-6 py-4'>
      {/* Header. Same shape as the team page: title on the left, secondary
          actions then the primary action on the right. */}
      <div className='flex items-center justify-between'>
        <h1 className="text-2xl font-semibold text-neutral-500">Projects</h1>
        <div className='flex items-center gap-2'>
          <Button variant="outline" onClick={() => setOpenTemplate(true)}>
            Templates
          </Button>
          <Button variant="teritary" onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })} >
            Create project
          </Button>
          <ProjectDrawer openDrawer={openTemplate} onClose={() => setOpenTemplate(false)} />
        </div>
      </div>

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
  )
}

export default Project
