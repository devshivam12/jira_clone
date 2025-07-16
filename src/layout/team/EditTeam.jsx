import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import { DottedSeparator } from '@/components/dotted-separator'
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect'
import { EmailMultiSelectInput } from '@/components/ui/EmailMultiSelectInput'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import ButtonLoader from '@/components/ui/buttonLoader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import useDateFormatter from '@/hooks/useDateFormatter'
import { useProjectData } from '@/hooks/useProjectData'
import { useGetAllCompanyProjectQuery } from '@/redux/api/company/api'
import { useGetTeamDetailWithIdQuery, useUpdateTeamMutation } from '@/redux/api/company/team'
import { switchProject } from '@/redux/reducers/projectSlice'
import { Check, ChevronLeft, ChevronRight, Edit3, ImagePlus, Loader2, LogOut, LucideAirVent, MoreHorizontal, Plus, Search, ShieldAlert, Trash2, UserX, Users, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

const EditTeam = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [updateTeam, { isLoading: isTeamUpdate }] = useUpdateTeamMutation()

  const userData = JSON.parse(localStorage.getItem('userData'))

  console.log("userData", userData)

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    search: ''
  })
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchTerm, setSearchTerm] = useState('')

  const { data: teamData, isLoading: teamLoading, isFetching: teamFetching } = useGetTeamDetailWithIdQuery({
    team_id: id,
    page: pagination.page,
    perPage: pagination.perPage,
    search: debouncedSearch
  })

  const formattedDate = useDateFormatter(teamData?.data?.createdAt)

  const {
    register,
    handleSubmit,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      teamName: teamData?.data?.team_name || '',
      teamDescription: teamData?.data?.team_description || 'There is no team like a team with a description'
    }
  })

  const { allProjects, currentProject } = useProjectData()
  console.log("allProjects", allProjects)

  const [isEditingName, setIsEditingName] = useState(false)
  const [isDescriptionEdit, setIsDescriptionEdit] = useState(false)
  const [displaySearchInput, setDisplaySearchInput] = useState(false)
  const [isLeaveTeamVisible, setIsLeaveTeamVisible] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
    actionType: null,
    actionHandler: null
  })

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    slug: null
  });

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const totalPages = Math.ceil(teamData?.data?.pagination?.totalCount / pagination.pageSize) || 1;

  useEffect(() => {
    const getLeaderId = teamData?.data?.teamLeader?.member_id
    const loginUserId = userData?.member_id
    if (getLeaderId === loginUserId) {
      setIsLeaveTeamVisible(true)
    }
  }, [userData, isLeaveTeamVisible])
  // alert(isLeaveTeamVisible)
  useEffect(() => {
    const timerId = setTimeout(() => {
      setPagination(prev => ({
        ...prev,
        page: 1,
        search: searchTerm
      }))
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm])

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm)
  }
  const clearSearch = () => {
    setDisplaySearchInput(false)
    setPagination(prev => ({
      ...prev,
      search: setSearchTerm('')
    }))
  }
  const handleStartEdit = () => {
    setIsEditingName(true)
  }

  const handleDescriptionEdit = () => {
    setIsDescriptionEdit(true)
  }

  const handleCancel = () => {
    setIsEditingName(false)
  }

  const handleCancelDescription = () => {
    setIsDescriptionEdit(false)
  }


  const handleUpdateTeam = async (actionType, payload) => {
    try {
      if (!actionType) {
        const data = { ...payload }
        const result = await updateTeam({ id, data }).unwrap()

        console.log("result=========", result)
        if (result.status === 200) {
          ShowToast.success(result.message)
        }
        else if (result.status === 404) {
          ShowToast.error(result.message)
        }
        else if (result.status === 400) {
          ShowToast.error(result.message)
        }
        else {
          ShowToast.error(result.message)
        }
        return result
      }
      else {
        const data = {
          action: actionType,
          ...payload
        }
        const response = await updateTeam({ id, data }).unwrap()

        console.log("response-----------", response)
        if (response.status === 200) {
          ShowToast.success(response.message)
        }
        else if (response.status === 400) {
          ShowToast.error(response.message)
        }
        else if (response.status === 404) {
          ShowToast.error(response.message)
        }
        return response
      }

    } catch (error) {
      console.log("error", error)
      ShowToast.error(error.error)
    }
  }

  const handleSaveTeamName = handleSubmit(async (formData) => {
    // console.log('Saving new team name:', teamName)

    await ShowToast.promise(
      handleUpdateTeam(null, {
        team_name: formData.teamName
      }),
      {
        loading: `Updating team name....`,
        position: 'bottom-right',
        duration: 4000
      }
    )
    setIsEditingName(false)
  })

  const handleSaveDescription = handleSubmit(async (formData) => {
    await ShowToast.promise(
      handleUpdateTeam(null, {
        team_description: formData.teamDescription
      }),
      {
        loading: `Updating team description...`,
        position: 'bottom-right',
        duration: 4000
      }
    )
    setIsDescriptionEdit(false)
  })

  const handleAddMembers = async (memberId) => {
    try {
      const data = await handleUpdateTeam('add_member', {
        members: memberId
      })
      return data
    } catch (error) {
      console.log("error", error)
    }
  }

  const handleAddProjects = async (projectId) => {
    try {
      const data = await handleUpdateTeam('add_project', {
        project_id: projectId
      })
      return data
    } catch (error) {
      console.log("error", error)
    }
  }

  const handleSwitchProject = (projectId) => {
    console.log("projectId", projectId)
    dispatch(switchProject(projectId))
    const findProject = allProjects.find(p => p._id === projectId)
    console.log("findProject", findProject)
    const getProjectSlug = findProject?.project_slug
    const getTemplateSlug = findProject?.template.slug
    const getDefaultNavigation = findProject?.template.fields?.tabs.find(tab => tab.isDefault === true)
    window.location.href = `/dashboard/${getProjectSlug}/${getTemplateSlug}/${getDefaultNavigation.url}`
  }

  const handleRemoveProject = async (projectId) => {
    try {
      const data = await handleUpdateTeam('remove_project', {
        project_id: projectId
      })
      return data;
    } catch (error) {
      console.log("error", error)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    return ShowToast.promise(
      handleUpdateTeam('remove_member', { member_id: memberId }),
      {
        loading: `Removing ${memberName} from team...`,
        position: 'bottom-right',
        duration: 4000
      }
    );
  };

  const handleDeleteTeam = async () => {
    try {
      const data = await handleUpdateTeam('delete_team', {});
      if (data?.status === 204 || data?.status === 204) {
        ShowToast.info(data.message);
        navigate('/dashboard/team');
      }
      return data;
    } catch (error) {
      ShowToast.error('Failed to delete team');
      console.error("Delete team error:", error);
    }
  }

  const handleLeaveTeam = async (memberId) => {
    return ShowToast.promise(
      handleUpdateTeam('leave', {
        member_id: memberId
      }),
      {
        loading: 'Procession please wait....',
        position: 'bottom-right',
        duration: 4000
      }
    )

  }

  const handleChangeLeader = async (memberId) => {
    return ShowToast.promise(
      handleUpdateTeam('change_leader', {
        member_id: memberId
      }),
      {
        loading: 'Procession please wait....',
        position: 'bottom-right',
        duration: 4000
      }
    )
  }

  // Handle blur with timeout to allow button clicks
  const handleBlurTeamName = () => {
    setIsEditingName(false)
    // setTeamName(teamData?.data?.team_name || '')

  }

  const handleBlurTeamDescription = () => {
    setIsDescriptionEdit(false)
    // setTeamDescription(teamData?.data?.team_description || 'There is no team like a team with a description')
  }

  const handleKeyDown = (e) => {
    if (isEditingName && e.key === 'Enter') {
      handleSaveTeamName()
    }
    else if (isDescriptionEdit && e.key === 'Enter') {
      handleSaveDescription()
    }
    else if (e.key === 'Escape') {
      handleCancel()
      handleCancelDescription()
    }
  }
  // alert(dialogState)
  return (
    <div className='py-5 space-y-5'>
      <span className='text-neutral-500 font-normal text-lg'>Team</span>

      {/* Banner Card */}
      <Card className="w-full relative rounded-lg overflow-hidden group shadow-none">
        {teamData?.team_cover_image ? (
          <>
            <img
              src={teamData.team_cover_image}
              alt="Team banner"
              className="w-full h-48 object-cover"
            />
            <Button
              variant="outline"
              className="absolute top-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ImagePlus className="h-4 w-4" />
              Change Banner
            </Button>
          </>
        ) : (
          <div className="w-full h-48 bg-muted hover:bg-neutral-200/50 cursor-pointer flex items-center justify-center relative transition-all">
            <Button
              variant="outline"
              className="absolute gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ImagePlus className="h-4 w-4" />
              Upload Banner
            </Button>
          </div>
        )}
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6">
        {/* Left column (smaller width) */}
        <div className="md:col-span-1 space-y-5">
          <div className='flex items-center justify-between'>
            {
              teamFetching ? (
                <div className='w-full'>
                  {[...Array(1)].map((_, index) => (
                    <div key={index} className="w-full">
                      <div className="flex items-center gap-x-2 w-full">
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex items-center gap-x-2 w-full'>
                  <div className='flex items-center bg-blue-500 justify-center p-[10px] rounded-md h-9 w-9'>
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <div className='relative w-full'>
                    {!isEditingName ? (
                      <div
                        className='flex items-center justify-between gap-2 px-3 py-2 w-full hover:bg-neutral-100 rounded-md cursor-pointer group hover:border hover:border-neutral-300 min-h-[40px]'
                        onClick={handleStartEdit}
                      >
                        <span className='text-sm text-neutral-500 font-semibold'>{teamData?.data?.team_name}</span>
                      </div>
                    ) : (
                      <div className='relative'>
                        <Input
                          {...register('teamName')}
                          // onChange={(e) => setTeamName(e.target.value)}
                          className='border-none outline-none bg-neutral-100 hover:bg-neutral-200/50 w-full pr-20'
                          onBlur={handleBlurTeamName}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                        <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0'>
                          <Button
                            variant='outline'
                            size='icon'
                            className="h-8 px-2"
                            onClick={handleSaveTeamName}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            variant='outline'
                            size='icon'
                            className="h-8 px-2"
                            onClick={handleCancel}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }


          </div>

          {/* about us details */}

          <div className='relative'>

            <span className='text-neutral-500 font-semibold '>About </span>

            <div className='relative'>
              {
                teamFetching ? (
                  <div className='w-full'>
                    {[...Array(1)].map((_, index) => (
                      <div key={index} className="w-full">
                        <div className="flex items-center gap-x-2 w-full">
                          <Skeleton className="h-20 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>

                    {!isDescriptionEdit ? (
                      <div
                        className='flex items-center justify-between gap-2 px-3 py-2 w-full hover:bg-neutral-100 rounded-md cursor-pointer group hover:border hover:border-neutral-300 min-h-[40px]'
                        onClick={handleDescriptionEdit}
                      >
                        <span className='text-sm text-neutral-500 font-medium'>{teamData?.data?.team_description || 'There is no team like a team with a description'}</span>
                      </div>
                    ) : (
                      <div className='relative'>
                        <Input
                          {...register('teamDescription')}
                          // onChange={(e) => setTeamDescription(e.target.value)}
                          className='border-none outline-none text-start bg-neutral-100 hover:bg-neutral-200/50 w-full '
                          onBlur={handleBlurTeamDescription}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                        <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0'>
                          <Button
                            variant='outline'
                            size='sm'
                            className="h-8 px-2"
                            onClick={handleSaveDescription}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className="h-8 px-2"
                            onClick={handleCancelDescription}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )
              }
            </div>
          </div>

          {/* Memeber details */}

          <Card className="p-0 shadow-none border border-neutral-300">
            <div className="relative overflow-hidden">
              <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${displaySearchInput ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className='py-3 px-3 flex items-center justify-between gap-x-2'>
                  <div className='flex-1'>
                    <Input
                      className="h-8 p-1 w-full"
                      autoFocus
                      onChange={(e) => handleSearch(e.target.value)}
                      value={searchTerm}
                      placeholder="Search members..."
                    />
                  </div>
                  <div
                    className='border border-neutral-300 text-neutral-500 rounded-sm p-1 cursor-pointer hover:bg-neutral-100'
                    onClick={clearSearch}
                  >
                    <X size={17} />
                  </div>
                </div>
              </div>
              <div className={`transition-transform duration-300 ease-in-out ${displaySearchInput ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="py-3 px-3 flex items-center justify-between">
                  <div>
                    <CardTitle className="font-medium text-neutral-500">
                      Team Members
                    </CardTitle>
                  </div>
                  <div className='flex items-center gap-x-2'>
                    <TooltipWrapper content={'Add member'}>
                      <div
                        className='border border-neutral-300 text-neutral-500 rounded-sm p-1 cursor-pointer hover:bg-neutral-100'
                        onClick={() => setDialogState({
                          isOpen: true,
                          slug: 'add_member'
                        })}
                      >
                        <Plus size={17} />
                      </div>
                    </TooltipWrapper>
                    <TooltipWrapper content={'Search members'}>
                      <div
                        className='border border-neutral-300 text-neutral-500 rounded-sm p-1 cursor-pointer hover:bg-neutral-100'
                        onClick={() => setDisplaySearchInput(true)}
                      >
                        <Search size={17} />
                      </div>
                    </TooltipWrapper>
                  </div>
                </div>
              </div>
            </div>
            <DottedSeparator />

            <CardContent className="p-0 my-2">
              {/* Team members list would go here */}
              {
                teamFetching ? (
                  <div className="space-y-1">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded">
                        <div className="flex items-center gap-x-2 w-full">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-[120px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamData?.data?.membersList?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-neutral-100 rounded cursor-pointer group"
                        onClick={() => navigate(`/dashboard/peoples/${item.member_id}`)}
                      >
                        <div className="flex items-center gap-x-4">
                          <ManageAvatar
                            firstName={item.first_name}
                            lastName={item.last_name}
                            image={item.image}
                          />
                          <span className="text-sm text-neutral-500 font-medium">
                            {item.first_name + " " + item.last_name}
                          </span>
                        </div>

                        {/* Action button that appears on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="muted"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {
                              userData?.role === 'Admin' && (
                                <DropdownMenuContent align="end" className="w-40 py-2">

                                  {item.isLeader && item.memberId !== userData?.memberId && (
                                    // <DropdownMenuItem className="text-red-500" onClick={() => handleLeaveTeam(item.member_id)}>
                                    //   <UserX className="mr-2 h-4 w-4" />
                                    //   Leave Team
                                    // </DropdownMenuItem>

                                    <DropdownMenuItem
                                      className="text-red-500"
                                      onClick={() => handleRemoveMember(item.member_id, item.first_name + " " + item.last_name)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove
                                    </DropdownMenuItem>

                                  )}

                                  {((!item.isLeader && item.memberId === userData?.memberId) || (item.isLeader && item.memberId === userData?.memberId)) && userData.role === 'Admin' && (
                                    <DropdownMenuItem className="text-red-500" onClick={() => handleLeaveTeam(item.member_id)}>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Leave Team
                                    </DropdownMenuItem>
                                  )}

                                  {!item.isLeader && item.memberId !== userData?.memberId && (
                                    <DropdownMenuItem
                                      className="text-red-500"
                                      onClick={() => handleRemoveMember(item.member_id, item.first_name + " " + item.last_name)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove
                                    </DropdownMenuItem>
                                  )}
                                  {!item.isLeader && userData?.role === 'Admin' && (
                                    <DropdownMenuItem
                                      onClick={() => handleChangeLeader(item.member_id)}
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      Make Leader
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              )
                            }
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }

            </CardContent>
          </Card>
          <div className='flex items-center justify-end gap-x-2'>
            <Button
              size="icon"
              variant="default"
              disabled={pagination.page === 1 || teamFetching}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className='' />
            </Button>
            <Button
              size="icon"
              variant="default"
              disabled={pagination.page >= totalPages || teamFetching}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>

        </div>

        {/* Right column (larger width) */}
        <div className="md:col-span-3 space-y-5">
          <div className='flex items-center justify-end gap-x-2'>

            {
              userData?.role === "Admin" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDialogState({
                      isOpen: true,
                      slug: 'add_member'
                    })}
                  >
                    Add Member
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({
                        isOpen: true,
                        id: id,
                        name: teamData?.data?.team_name,
                        actionType: "delete_team",
                        actionHandler: handleDeleteTeam
                      }
                      )
                    }}
                  >
                    Delete team
                  </Button>
                </>
              )
            }
            {
              isLeaveTeamVisible && (
                <TooltipWrapper
                  content={'Leave team'}
                  direction='left'
                >
                  <Button
                    size='icon'
                    variant="outline"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        id: userData?.member_id,
                        name: teamData?.data?.team_name,
                        actionType: "leave",
                        actionHandler: handleLeaveTeam
                      })
                    }}
                  >
                    <LogOut size={17} />
                  </Button>
                </TooltipWrapper>
              )
            }
            {/* <DropdownMenu>
              <DropdownMenuTrigger>
                <Button size="sm" variant="outline">
                  <MoreHorizontal size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="py-2 w-36" align="end" side="bottom" sideOffset="1">
                <DropdownMenuItem className="cursor-pointer text-neutral-500 font-medium">Leave team</DropdownMenuItem>
                {
                  userData?.role === 'Admin' && (
                    <DropdownMenuItem
                      className="cursor-pointer text-neutral-500 font-medium"
                      onClick={() => handleDeleteTeam(id)}
                    >
                      Delete team
                    </DropdownMenuItem>
                  )
                }
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>

          {

            teamFetching ? (
              <div className='flex items-center gap-x-4 '>
                {[...Array(2)].map((_, index) => (
                  <Card key={index} className="p-2 w-full bg-neutral-50 rounded-md shadow-none flex justify-center flex-col">
                    <CardContent className="gap-x-4 flex items-center justify-center p-4">
                      <Skeleton className="h-10 w-12 bg-gray-200" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-none border-none">
                <div className='flex items-center justify-between'>
                  <h2 className="text-xl font-semibold text-neutral-500 mb-4">Team Projects</h2>
                  <TooltipWrapper content={'Add project'} direction="left">
                    <div
                      className='border border-neutral-300 text-neutral-500 rounded-sm p-1 cursor-pointer hover:bg-neutral-100'
                      onClick={() => setDialogState({
                        isOpen: true,
                        slug: 'add_project'
                      })}
                    >
                      <Plus size={17} />
                    </div>
                  </TooltipWrapper>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {
                    teamData?.data?.projectDetails.map((project, index) => (
                      <div className='relative group'>
                        <CardContent
                          key={index}
                          className="p-4 shadow-none rounded-lg bg-neutral-100/50 cursor-pointer border border-neutral-300 hover:bg-transparent"
                          onClick={() => handleSwitchProject(project._id)}
                        >

                          <div className='flex items-center gap-x-4'>
                            <Avatar className="w-8 h-8 rounded-none ">
                              {project?.project_icon ? (
                                <AvatarImage
                                  src={project?.project_icon}
                                  alt={`${project?.name}`}
                                  className="object-cover"
                                />
                              ) : (
                                <AvatarFallback className='rounded-sm text-base font-semibold text-neutral-500 bg-neutral-200'>
                                  {project?.name?.charAt(0)?.toUpperCase() ?? ''}
                                </AvatarFallback>
                              )}
                            </Avatar>

                            <p className="mt-1 text-neutral-500 font-normal text-base">{project.name}</p>
                          </div>

                        </CardContent>
                        {
                          userData?.role === "Admin" && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    id: project._id,
                                    name: project.name,
                                    actionType: "remove_project",
                                    actionHandler: handleRemoveProject
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        }
                      </div>
                    ))
                  }
                  <CardContent
                    className="p-4 shadow-none rounded-lg bg-neutral-100/50 cursor-pointer border-2 border-dotted border-neutral-300 hover:bg-transparent"
                    onClick={() => setDialogState({
                      isOpen: true,
                      slug: 'add_project'
                    })}
                  >
                    <div className='flex items-center gap-x-4'>
                      <Avatar className="w-8 h-8 rounded-none ">

                        <AvatarFallback className='rounded-sm text-base font-semibold text-neutral-500 bg-neutral-200'>
                          <Plus />
                        </AvatarFallback>

                      </Avatar>

                      <p className="mt-1 text-neutral-500 font-normal text-base">Add Project</p>
                    </div>

                  </CardContent>
                </div>
              </Card>
            )
          }

          <Card className="shadow-none border-none">
            <h2 className="text-xl font-semibold text-neutral-500 mb-4">Team Details</h2>
            <CardContent className="p-6 shadow-none rounded-md border border-neutral-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Team Lead</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">{teamData?.data?.teamLeader?.first_name + " " + teamData?.data?.teamLeader.last_name}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Projects</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">
                    {teamData?.data?.projectDetails.length} Active
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Members</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">
                    {
                      teamData?.data?.totalMembersCount
                    } People
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Created At</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">{formattedDate}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Created By</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">{teamData?.data?.createdBy?.first_name + " " + teamData?.data?.createdBy?.last_name}</p>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-none">
            <h2 className="text-xl font-semibold text-neutral-500 mb-4">Recent Activity</h2>
            <CardContent className="p-6 shadow-none rounded-md border border-neutral-300">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100"></div>
                  <div>
                    <p className="text-sm"><span className="font-medium">Sarah</span> completed a task</p>
                    <p className="text-xs text-neutral-500">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div >

      {/* <EmailMultiSelect
        slug={dialogState.slug}
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
      /> */}
      < EmailMultiSelectInput
        isOpen={dialogState.isOpen}
        slug={dialogState.slug}
        onOpenChange={() => setDialogState(prev => !prev)}
        onSuccess={dialogState.slug === 'add_project' ? handleAddProjects : handleAddMembers}
        isLoading={isTeamUpdate}
      />

      {/* Confirmation Dialog for Project Removal */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="w-96">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-500 flex items-center gap-x-4">
              <div className='bg-yellow-300 rounded-md h-6 w-6 p-0 text-yellow-900 flex items-center justify-center'>
                <ShieldAlert className='h-4 w-4' />
              </div>
              {confirmDialog.actionType === 'remove_project'
                ? 'Remove Project'
                : confirmDialog.actionType === 'delete_team'
                  ? 'Delete Team'
                  : `You're about to leave team ${teamData?.data?.team_name}`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-justify">
              {confirmDialog.actionType === 'remove_project'
                ? `This team will no longer be connected to the ${confirmDialog.name}.`
                : confirmDialog.actionType === 'delete_team'
                  ? `Are you sure you want to delete the team "${confirmDialog.name}"? This action cannot be undone.`
                  : `Are you sure you want to leave ${teamData?.data?.team_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              disabled={isTeamUpdate}
            >
              Cancel
            </Button>
            <ButtonLoader
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirmDialog.id && confirmDialog.actionHandler) {
                  try {
                    // Handle different action types
                    if (confirmDialog.actionType === 'remove_project') {
                      await confirmDialog.actionHandler(confirmDialog.id);
                    } else if (confirmDialog.actionType === 'leave') {
                      await confirmDialog.actionHandler(confirmDialog.id);
                    } else if (confirmDialog.actionType === 'delete_team') {
                      await confirmDialog.actionHandler();
                      // Don't close dialog here - navigation will happen in handleDeleteTeam
                      return;
                    }

                    // Close dialog for all actions except delete_team
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  } catch (error) {
                    console.error("Action failed:", error);
                    ShowToast.error('Action failed. Please try again.');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                }
              }}
              isLoading={isTeamUpdate}
            >
              {confirmDialog.actionType === 'remove_project'
                ? 'Remove'
                : confirmDialog.actionType === 'delete_team'
                  ? 'Delete'
                  : 'Leave Team'}
            </ButtonLoader>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

    </div >
  )
}

export default EditTeam