import React, { useEffect, useRef, useState } from 'react'
import { useGetMemberDetailWithIdQuery, useUploadMemberImageMutation } from '@/redux/api/company/team'
import { useNavigate, useParams } from 'react-router-dom'

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
  const navigate = useNavigate()
  const { data: memberData, isLoading: memberLoading, isFetching: memberFetching } = useGetMemberDetailWithIdQuery({
    member_id: id
  })
  console.log("memberData", memberData)

  const [uploadMemberImage, { isLoading: isUploading }] = useUploadMemberImageMutation()
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const [currentAction, setCurrentAction] = useState(null)

  const userData = JSON.parse(localStorage.getItem('userData'))
  const [editingField, setEditingField] = useState(null)
  const [fieldValues, setFieldValues] = useState({
    department: memberData?.data?.department || 'Your department',
    organization: memberData?.data?.organization || 'Your organization',
    location: memberData?.data?.location || 'Your location',
    email: memberData?.data?.email || 'Your email'
  })

  useEffect(() => {
    if (memberData?.data) {
      setFieldValues({
        department: memberData.data.department || 'Your department',
        organization: memberData.data.organization || 'Your organization',
        location: memberData.data.location || 'Your location',
        email: memberData.data.email || 'Your email'
      });
    }
  }, [memberData]);

  const handleFileChange = async (e, action) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setCurrentAction(action)
      const formData = new FormData()
      formData.append('file', file)
      const response = await uploadMemberImage({
        memberId: id,
        action: action,
        file: formData
      }).unwrap()
      if (response.status === 200) {
        ShowToast.success(response.message)
      }
      else if (response.status === 404) {
        ShowToast.error(response.message)
      }
      else if (response.status === 400) {
        ShowToast.error(response.message)
      }
      else {
        ShowToast.error(response.message)
      }
    } catch (error) {
      console.log("error", error)
      ShowToast.error(error?.message)
    }
  }

  const triggerFileInput = (action) => {
    if (action === 'image') {
      fileInputRef.current.click()
    } else {
      bannerInputRef.current.click()
    }
  }

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
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: memberData?.data?.[fieldName] || `Your ${fieldName}`
    }))
  }
  const fieldRef = useRef(null)
  useEffect(() => {
    const handleOutsid = (e) => {
      if (editingField && fieldRef.current && !fieldRef.current.contains(e.target)) {
        handleCancel(editingField)
      }
    }
    document.addEventListener('mousedown', handleOutsid)
    return () => {
      document.removeEventListener('moudedown', handleOutsid)
    }
  }, [editingField])

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

  ]

  const contactField = [
    {
      name: "email",
      icon: <Mail size={17} className='text-neutral-500' />,
      label: 'Email'
    }
  ]
  return (
    <div className='py-5 space-y-5'>
      <span className='text-neutral-500 font-normal text-lg'>People</span>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/jpeg, image/jpg, image/png"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => handleFileChange(e, 'banner')}
        accept="image/jpeg, image/jpg, image/png"
        className="hidden"
      />

      {/* Banner Card */}
      <Card className="w-full relative rounded-lg overflow-hidden group shadow-none">
        <div>
          {memberData?.data?.personal_banner ? (
            <div className="relative group">
              <img
                src={memberData?.data?.personal_banner}
                alt="Team banner"
                className="w-full h-48 object-cover"
                onClick={() => triggerFileInput('banner')}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="muted"
                  size={"xs"}
                  onClick={() => triggerFileInput('banner')}
                  disabled={isUploading && currentAction === 'banner'}
                  className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploading && currentAction === 'banner' ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Change Banner
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-48 bg-muted hover:bg-neutral-200/50 cursor-pointer flex items-center justify-center relative transition-all"
              onClick={() => triggerFileInput('banner')}
            >
              <Button
                variant="outline"
                className="absolute gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => triggerFileInput('banner')}
                disabled={isUploading && currentAction === 'banner'}
              >
                {isUploading && currentAction === 'banner' ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    Add your Banner
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6">
        {/* Left column (smaller width) */}
        <div className="md:col-span-2 space-y-5">
          {/* Memeber details */}

          <div className="relative group -mt-14 flex items-center justify-center">
            {memberData?.data?.image ? (
              <>
                <div className="cursor-pointer" onClick={() => triggerFileInput('image')}>
                  <ManageAvatar
                    firstName={memberData.data.first_name}
                    image={memberData.data.image}
                    size={'xl'}
                  />
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => triggerFileInput('image')}
                  disabled={isUploading && currentAction === 'image'}
                >
                  {isUploading && currentAction === 'image' ? (
                    <ButtonLoader size="sm" />
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Change
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="cursor-pointer" onClick={() => triggerFileInput('image')}>
                  <ManageAvatar
                    firstName={memberData?.data?.first_name}
                    lastName={memberData?.data?.last_name}
                    size={'xl'}
                  />
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => triggerFileInput('image')}
                  disabled={isUploading && currentAction === 'image'}
                >
                  {isUploading && currentAction === 'image' ? (
                    <ButtonLoader size="sm" />
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Add Photo
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          <div className='text-center'>
            <h3 className='text-neutral-500 font-semibold text-2xl'>
              {memberData?.data?.first_name + " " + memberData?.data?.last_name}
            </h3>
          </div>
          <Card className="py-3 shadow-none border border-neutral-300 ">
            <div>
              <div className="px-3">
                <span className='font-medium text-neutral-500'>About</span>
              </div>
              <CardContent className="px-3">
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
                  <div>
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
                            <div className='relative w-full' ref={fieldRef}>
                              <Input
                                value={fieldValues[field.name]}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, field.name)}
                                className='border border-neutral-400 outline-none rounded hover:bg-neutral-100 hover:rounded-md cursor-pointer bg-neutral-100 focus:none ring:none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-neutral-200/20'
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
                            <TooltipWrapper
                              direction='right'
                              content={`Click to edit your ${field.label.toLowerCase()}`}
                            >
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


                  </div>
                )}
              </CardContent>
            </div>

            <div>
              <div className="font-medium text-neutral-500 px-3">
                <span className='font-medium text-neutral-500'>
                  Contact
                </span>
              </div>
              <CardContent className="px-3 ">
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
                    {
                      contactField.map((contact, index) => (
                        <div
                          key={index}
                          className="relative group flex items-center justify-between w-full gap-x-4"
                          onClick={() => !editingField && handleEditClick(contact.name)}
                        >
                          <div>
                            {contact.icon}
                          </div>
                          {editingField === contact.name ? (
                            <div className='relative w-full' ref={fieldRef}>
                              <Input
                                value={fieldValues[contact.name]}
                                onChange={(e) => handleFieldChange(contact.name, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, contact.name)}
                                className='border border-neutral-400 outline-none rounded hover:bg-neutral-100 hover:rounded-md cursor-pointer bg-neutral-100 focus:none ring:none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-neutral-200/20'
                                autoFocus
                              />
                              <div className='absolute flex items-center justify-end gap-x-2 top-full mt-1 right-0 z-50'>
                                <Button
                                  variant='outline'
                                  size='icon'
                                  className="h-8 px-2 shadow-md"
                                  onClick={() => handleSave(contact.name)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <Check size={12} />
                                </Button>
                                <Button
                                  variant='outline'
                                  size='icon'
                                  className="h-8 px-2 shadow-md"
                                  onClick={() => handleCancel(contact.name)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <TooltipWrapper
                              direction='right'
                              content={`Click to edit your ${contact.label.toLowerCase()}`}
                            >
                              <div className="flex items-center justify-between rounded p-2 hover:bg-neutral-100 hover:rounded-md cursor-pointer w-full">
                                <span className="text-neutral-500">
                                  {fieldValues[contact.name]}
                                </span>
                                <Edit3
                                  className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                            </TooltipWrapper>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </div>

            <div>
              <div className='px-3'>
                <span className='font-medium text-neutral-500'>
                  Teams you are in
                </span>
              </div>
              <CardContent className='px-3 space-y-1'>
                {
                  userData?.role === 'Admin' && (
                    <TooltipWrapper content={"Create team"} direction='right'>
                      <div className='w-full p-2 mt-2 flex items-center gap-x-3 hover:bg-neutral-200/20 hover:cursor-pointer'>
                        <Plus className='text-neutral-500' size={18} />
                        <span className='text-neutral-500 font-normal'>
                          Create a team
                        </span>
                      </div>
                    </TooltipWrapper>
                  )
                }


                <div className='w-full flex-col  flex items-center  '>
                  {
                    memberData?.data?.teamDetails?.map((data, index) => (
                      <TooltipWrapper content={`${data?.team_name}`} direction="right">
                        <div
                          key={index}
                          className="flex items-center w-full gap-3 p-2 hover:bg-neutral-200/20 hover:cursor-pointer"
                          onClick={() => navigate(`/dashboard/team/edit/${data._id}`)}
                        >

                          <ManageAvatar
                            firstName={data?.team_name}
                            image={data?.team_icon}
                          />

                          <span className='text-neutral-500 font-normal'>
                            {data?.team_name}
                          </span>
                        </div>
                      </TooltipWrapper>
                    ))
                  }

                </div>
              </CardContent>
            </div>

          </Card>
        </div>

        {/* Right column (larger width) */}
        <div className="md:col-span-4 space-y-5">

          {
            memberFetching ? (
              <div className='flex items-center flex-col gap-4 '>
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
              <div>
                <h2 className="text-xl font-semibold text-neutral-500 mb-4">Your task</h2>
                <Card className="shadow-none ">
                  <div className="">
                    {
                      memberData?.data?.personalTask?.length > 0 ?
                        memberData?.data?.personalTask?.map((task, index) => (
                          <div className='relative group' key={index}>
                            <CardContent
                              className="p-4 shadow-none rounded-lg bg-neutral-100/50 cursor-pointer border border-neutral-300 hover:bg-transparent"
                            // onClick={() => handleSwitchProject(project._id)}
                            >

                              <div className='flex items-center gap-x-4'>
                                <Avatar className="w-8 h-8 rounded-none ">
                                  {task?.icon ? (
                                    <AvatarImage
                                      src={task?.icon}
                                      alt={`${task?.name}`}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <AvatarFallback className='rounded-sm text-base font-semibold text-neutral-500 bg-neutral-200'>
                                      {task?.name?.charAt(0)?.toUpperCase() ?? ''}
                                    </AvatarFallback>
                                  )}
                                </Avatar>

                                <p className="mt-1 text-neutral-500 font-normal text-base">{task.name}</p>
                              </div>

                            </CardContent>

                          </div>
                        )) : (
                          <CardContent
                            className="p-4 shadow-none rounded-lg w-full bg-neutral-100/50 cursor-pointer "
                          >

                            <div className='flex items-center gap-x-4'>
                              <p className="mt-1 text-neutral-500 font-normal text-base">
                                You have no active tasks at the moment.
                              </p>
                            </div>

                          </CardContent>
                        )
                    }
                  </div>
                </Card>
              </div>
            )
          }

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
                <h2 className="text-xl font-semibold text-neutral-500 mb-4">Places you work in</h2>
                <div className="grid grid-cols-2 gap-4">
                  {
                    memberData?.data?.teamDetails?.map((project, index) => (
                      <div className='relative group'>
                        {
                          project.projectDetails.map((project, index) => (
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
                          ))
                        }
                      </div>
                    ))
                  }
                </div>
              </Card>
            )
          }

        </div>
      </div >



    </div >
  )
}

export default EditPeople
