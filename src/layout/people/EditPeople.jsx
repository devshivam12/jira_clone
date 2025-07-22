import React, { useState } from 'react'
import { useGetMemberDetailWithIdQuery } from '@/redux/api/company/team'
import { useParams } from 'react-router-dom'

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
import { Skeleton } from '@/components/ui/skeleton'

import { Building, Check, ChevronLeft, ChevronRight, Edit3, ImagePlus, Loader2, LocateIcon, LogOut, LucideAirVent, Mail, Map, MapPin, MoreHorizontal, Network, Plus, Search, ShieldAlert, Trash2, UserX, Users, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const EditPeople = () => {
  const { id } = useParams()
  const { data: memberData, isLoading: memberLoading, isFetching: memberFetching } = useGetMemberDetailWithIdQuery({
    member_id: id
  })
  console.log("memberData", memberData)

  const [editingField, setEditingField] = useState(null)
  const [fieldValues, setFieldValues] = useState({
    department: memberData?.data?.department || 'Your department',
    organization: memberData?.data?.organization || 'Your organization',
    location: memberData?.data?.location || 'Your location',
    email : memberData?.data?.email || 'Your email'
  })

  const handleEditClick = (fieldName) => {
    setEditingField(fieldName)
  }

  const handleSave = (fieldName) => {
    // Here you would typically call an API to save the changes
    setEditingField(null)
    // Save logic would go here
  }

  const handleCancel = (fieldName) => {
    setEditingField(null)
    // Reset to original value
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: memberData?.data?.[fieldName] || `Your ${fieldName}`
    }))
  }

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      handleSave(fieldName)
    } else if (e.key === 'Escape') {
      handleCancel(fieldName)
    }
  }

  // Field configuration
  const fields = [
    {
      name: 'department',
      icon: <Network size={17} className='text-neutral-500' />,
      label: 'Department'
    },
    {
      name: 'organization',
      icon: <Building size={17} className='text-neutral-500' />,
      label: 'Organization'
    },
    {
      name: 'location',
      icon: <MapPin size={17} className='text-neutral-500' />,
      label: 'Location'
    },
    {
      name : "email",
      icon : <Mail size={17} className='text-neutral-500' />,
      label : 'Email'
    }
  ]
  return (
    <div className='py-5 space-y-5'>
      <span className='text-neutral-500 font-normal text-lg'>Team</span>

      {/* Banner Card */}
      <Card className="w-full relative rounded-lg overflow-hidden group shadow-none">
        {memberData?.personal_image ? (
          <>
            <img
              src={memberData.team_cover_image}
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
              Add you Banner
            </Button>
          </div>
        )}
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6">
        {/* Left column (smaller width) */}
        <div className="md:col-span-2 space-y-5">
          {/* Memeber details */}

          <Card className="p-0 shadow-none border border-neutral-300">
            <div className="font-medium text-neutral-500 pt-3 px-3">
              About
            </div>
            <CardContent className="p-3 my-2">
              {memberFetching ? (
                <div className="space-y-1">
                  {[...Array(3)].map((_, index) => (
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
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className="relative group flex items-center justify-between w-full gap-x-4"
                      onClick={() => !editingField && handleEditClick(field.name)}
                    >
                      <div>
                        {field.icon}
                      </div>
                      {editingField === field.name ? (
                        <div className='relative w-full'>
                          <Input
                            value={fieldValues[field.name]}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                            className='border-none outline-none rounded hover:bg-neutral-100 hover:rounded-md cursor-pointer bg-neutral-100 hover:bg-neutral-200/20'
                            autoFocus
                          />
                          <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0 z-50'>
                            <Button
                              variant='outline'
                              size='icon'
                              className="h-8 px-2 shadow-md"
                              onClick={() => handleSave(field.name)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              variant='outline'
                              size='icon'
                              className="h-8 px-2 shadow-md"
                              onClick={() => handleCancel(field.name)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <TooltipWrapper content={`Click to edit your ${field.label.toLowerCase()}`}>
                          <div className="flex items-center justify-between rounded p-2 hover:bg-neutral-100 hover:rounded-md cursor-pointer w-full">
                            <span className="text-neutral-500">
                              {fieldValues[field.name]}
                            </span>
                            <Edit3
                              className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </TooltipWrapper>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <div className="font-medium text-neutral-500 pt-3 px-3">
              Contact
            </div>
            <CardContent className="p-3 my-2">
              {memberFetching ? (
                <div className="space-y-1">
                  {[...Array(3)].map((_, index) => (
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
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className="relative group flex items-center justify-between w-full gap-x-4"
                      onClick={() => !editingField && handleEditClick(field.name)}
                    >
                      <div>
                        {field.icon}
                      </div>
                      {editingField === field.name ? (
                        <div className='relative w-full'>
                          <Input
                            value={fieldValues[field.name]}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, field.name)}
                            className='border-none outline-none rounded hover:bg-neutral-100 hover:rounded-md cursor-pointer bg-neutral-100 hover:bg-neutral-200/20'
                            autoFocus
                          />
                          <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0 z-50'>
                            <Button
                              variant='outline'
                              size='icon'
                              className="h-8 px-2 shadow-md"
                              onClick={() => handleSave(field.name)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              variant='outline'
                              size='icon'
                              className="h-8 px-2 shadow-md"
                              onClick={() => handleCancel(field.name)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <TooltipWrapper content={`Click to edit your ${field.label.toLowerCase()}`}>
                          <div className="flex items-center justify-between rounded p-2 hover:bg-neutral-100 hover:rounded-md cursor-pointer w-full">
                            <span className="text-neutral-500">
                              {fieldValues[field.name]}
                            </span>
                            <Edit3
                              className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </TooltipWrapper>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (larger width) */}
        <div className="md:col-span-4 space-y-5">
          <div className='flex items-center justify-end gap-x-2'>

            {/* {
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
                        name: memberData?.data?.team_name,
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
            } */}
            {/* {
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
                        name: memberData?.data?.team_name,
                        actionType: "leave",
                        actionHandler: handleLeaveTeam
                      })
                    }}
                  >
                    <LogOut size={17} />
                  </Button>
                </TooltipWrapper>
              )
            } */}
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

            memberFetching ? (
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
                    // onClick={() => setDialogState({
                    //   isOpen: true,
                    //   slug: 'add_project'
                    // })}
                    >
                      <Plus size={17} />
                    </div>
                  </TooltipWrapper>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {
                    memberData?.data?.projectDetails?.map((project, index) => (
                      <div className='relative group'>
                        <CardContent
                          key={index}
                          className="p-4 shadow-none rounded-lg bg-neutral-100/50 cursor-pointer border border-neutral-300 hover:bg-transparent"
                        // onClick={() => handleSwitchProject(project._id)}
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
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              //   setConfirmDialog({
                              //     isOpen: true,
                              //     id: project._id,
                              //     name: project.name,
                              //     actionType: "remove_project",
                              //     actionHandler: handleRemoveProject
                              //   });
                              // }}
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
                  // onClick={() => setDialogState({
                  //   isOpen: true,
                  //   slug: 'add_project'
                  // })}
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
                  <p className="mt-1 text-neutral-500 font-normal text-base">{memberData?.data?.first_name + " " + memberData?.data?.last_name}</p>
                </div>


                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Members</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">
                    {
                      memberData?.data?.totalMembersCount
                    } People
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Created At</h4>
                  {/* <p className="mt-1 text-neutral-500 font-normal text-base">{formattedDate}</p> */}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Created By</h4>
                  <p className="mt-1 text-neutral-500 font-normal text-base">{memberData?.data?.createdBy?.first_name + " " + memberData?.data?.createdBy?.last_name}</p>
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



    </div >
  )
}

export default EditPeople
