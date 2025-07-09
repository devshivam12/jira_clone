import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import { DottedSeparator } from '@/components/dotted-separator'
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect'
import { EmailMultiSelectInput } from '@/components/ui/EmailMultiSelectInput'
import { AlertDialogHeader } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
import useDateFormatter from '@/hooks/useDateFormatter'
import { useProjectData } from '@/hooks/useProjectData'
import { useGetTeamDetailWithIdQuery, useUpdateTeamMutation } from '@/redux/api/company/team'
import { Check, Edit3, ImagePlus, MoreHorizontal, Plus, Search, Trash2, UserX, Users, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

const EditTeam = () => {
  const { id } = useParams()
  const [updateTeam, { isLoading: isTeamUpdate }] = useUpdateTeamMutation()
  const userData = JSON.parse(localStorage.getItem('userData'))

  console.log("userData", userData)

  const { data: teamData, isLoading: teamLoading } = useGetTeamDetailWithIdQuery(id)
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

  const { currentProject } = useProjectData()


  const [isEditingName, setIsEditingName] = useState(false)
  const [isDescriptionEdit, setIsDescriptionEdit] = useState(false)
  const [displaySearchInput, setDisplaySearchInput] = useState(false)
  const [isCurrentUserMemeber, setIsCurrentUserMemeber] = useState(false)

  const [teamName, setTeamName] = useState(teamData?.data?.team_name || '')
  const [teamDescription, setTeamDescription] = useState(teamData?.data?.team_description || 'There is no team like a team with a description')

  const [dialogState, setDialogState] = useState(false);


  const openDialog = () => {
    setDialogState(true)
  };

  const handleStartEdit = () => {
    setIsEditingName(true)
  }

  const handleDescriptionEdit = () => {
    setIsDescriptionEdit(true)
  }

  const handleCancel = () => {
    // setTeamName(teamData?.data?.team_name || '')
    setIsEditingName(false)
  }

  const handleCancelDescription = () => {
    // setTeamDescription(teamData?.data?.team_description || 'There is no team like a team with a description')
    setIsDescriptionEdit(false)
  }

  useEffect(() => {
    if (teamData?.data?.membersList && userData?.memberId) {
      const isMember = teamData.data.membersList.some(
        member => member.memberId === userData.memberId
      );
      setIsCurrentUserMemeber(isMember);
    }
  }, [teamData, userData]);

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

  const handleDeleteTeam = async (teamId) => {
    await handleUpdateTeam('delete_team', {

    })
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
            <div className='flex items-center gap-x-2 w-full'>
              <div className='flex items-center bg-blue-500 justify-center p-[10px] rounded-md h-9 w-9'>
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className='relative w-full'>
                {!isEditingName ? (
                  <div
                    className='flex items-center justify-between gap-2 px-3 py-2 w-full hover:bg-neutral-100 rounded-md cursor-pointer group hover:border hover:border-neutral-300'
                    onClick={handleStartEdit}
                  >
                    <span className='text-sm text-neutral-500 font-semibold'>{teamData?.data?.team_name}</span>
                  </div>
                ) : (
                  <>
                    <Input
                      {...register('teamName')}
                      // onChange={(e) => setTeamName(e.target.value)}
                      className='border-none outline-none bg-neutral-100 hover:bg-neutral-200/50 w-full'
                      onBlur={handleBlurTeamName}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                    <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0'>
                      <Button
                        variant='outline'
                        size='sm'
                        className="h-8 px-2"
                        onClick={handleSaveTeamName}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <Check size={12} />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className="h-8 px-2"
                        onClick={handleCancel}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>


          </div>

          {/* about us details */}

          <div className=''>

            <span className='text-neutral-500 font-semibold '>About </span>

            <div className='relative'>
              {!isDescriptionEdit ? (
                <div
                  className='flex items-center justify-between gap-2 px-3 py-2 w-full hover:bg-neutral-100 rounded-md cursor-pointer group hover:border hover:border-neutral-300'
                  onClick={handleDescriptionEdit}
                >
                  <span className='text-sm text-neutral-500 font-medium'>{teamData?.data?.team_description || 'There is no team like a team with a description'}</span>
                </div>
              ) : (
                <>
                  <Input
                    {...register('teamDescription')}
                    // onChange={(e) => setTeamDescription(e.target.value)}
                    className='border-none outline-none bg-neutral-100 hover:bg-neutral-200/50 w-full'
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
                </>
              )}
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
                    />
                  </div>
                  <div
                    className='border border-neutral-300 text-neutral-500 rounded-sm p-1 cursor-pointer hover:bg-neutral-100'
                    onClick={() => setDisplaySearchInput(false)}
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
                        onClick={() => setDialogState(true)}
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
              <div className="space-y-2">
                {teamData?.data?.membersList.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-neutral-100 rounded cursor-pointer group"
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
            </CardContent>

          </Card>

        </div>

        {/* Right column (larger width) */}
        <div className="md:col-span-3 space-y-5">
          <div className='flex items-center justify-end gap-x-2'>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogState(true)}
            >
              Add Member
            </Button>

            <DropdownMenu>
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
            </DropdownMenu>
          </div>
          <Card className="p-6 shadow-none border border-neutral-300">
            <h2 className="text-xl font-semibold text-neutral-500 mb-4">Team Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Created At</h4>
                <p className="mt-1 text-neutral-500 font-normal text-base">{formattedDate}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Team Lead</h4>
                <p className="mt-1 text-neutral-500 font-normal text-base">{teamData?.data?.createdBy.first_name + " " + teamData?.data?.createdBy.last_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Projects</h4>
                <p className="mt-1 text-neutral-500 font-normal text-base">3 Active</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Members</h4>
                <p className="mt-1 text-neutral-500 font-normal text-base">8 People</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {/* Activity feed would go here */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-100"></div>
                <div>
                  <p className="text-sm"><span className="font-medium">Sarah</span> completed a task</p>
                  <p className="text-xs text-neutral-500">2 hours ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* <EmailMultiSelect
        slug={dialogState.slug}
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
      /> */}
      <EmailMultiSelectInput
        isOpen={dialogState}
        onOpenChange={() => setDialogState(prev => !prev)}
        onSuccess={handleAddMembers}
        isLoading={isTeamUpdate}
      />
    </div >
  )
}

export default EditTeam