import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import { DottedSeparator } from '@/components/dotted-separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import ButtonLoader from '@/components/ui/buttonLoader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUpdateProjectByIdMutation } from '@/redux/api/company/api'
import { useGetAllMemberListQuery } from '@/redux/api/company/team'
import { updateProjectReduxStore } from '@/redux/reducers/projectSlice'
import { ChevronDown, Info, Loader2, X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

const ProjectDetail = ({ projectDetail }) => {
    console.log("projectDetail", projectDetail)
    const initialProjectName = projectDetail?.data?.name?.charAt(0)?.toUpperCase() ?? '';

    const [updateProject, { isLoading }] = useUpdateProjectByIdMutation()

    const { id } = useParams()
    const dispatch = useDispatch()

    console.log("params", id)
    console.log()
    const [addProjectName, setAddProjectName] = useState('')
    const [changeProjectLead, setChangeProjectLead] = useState(false)
    const [openInfo, setOpenInfo] = useState(false)
    const [open, setOpen] = useState(false)
    const [leaderValue, setLeaderValue] = useState(null)
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const {
        data: membersData,
        isLoading: isMembersLoading,
        isError: isMembersError
    } = useGetAllMemberListQuery({
        search: debouncedSearchTerm,
        page: 1,
        pageSize: 10
    }, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
        // skip: !open
    })

    useEffect(() => {

        if (projectDetail?.data.name) {
            setAddProjectName(projectDetail?.data.name)
        }

        if (projectDetail?.data?.projectLeaderDetail?._id) {
            setLeaderValue(projectDetail.data.projectLeaderDetail._id);
        }
        let searchTimer;

        // Handle search term debouncing
        if (searchTerm !== debouncedSearchTerm) {
            searchTimer = setTimeout(() => {
                setDebouncedSearchTerm(searchTerm);
            }, 200);
        }
        // Cleanup timer
        return () => {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
        };
    }, [searchTerm, debouncedSearchTerm, projectDetail]);

    const members = membersData?.data?.members || []

    const selectedMember = useMemo(() => {
        console.log("leaderValue", leaderValue)
        if (leaderValue) {
            // First check current members list
            const found = members.find((member) => member._id === leaderValue);
            if (found) return found;


        }
        // If not found, use the project leader detail from props
        if (projectDetail?.data?.projectLeaderDetail?._id) {
            return projectDetail?.data?.projectLeaderDetail;
        }
        return null;
    }, [members, leaderValue, projectDetail]);



    const showViewAllMember = useMemo(() => {
        return membersData?.data?.pagination?.totalCount > 2
        // return membersData?.data?.pagination?.totalCount > 2 && members.length < membersData.data.pagination.totalCount
    }, [membersData, members])

    const handleSearchTerm = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const handleLeaderChange = (newLeaderId) => {
        setLeaderValue(newLeaderId);
        setChangeProjectLead(false);
        setOpen(false);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault()

        try {
            const result = await updateProject({
                id,
                body: {
                    name: addProjectName,
                    project_leader: leaderValue
                }
            }).unwrap()
            console.log("result", result)
            console.log("result.status", result.status)
            if (result.status === 201) {
                console.log("this is working ")

                dispatch(updateProjectReduxStore({
                    _id: id,
                    name: addProjectName,
                }))
                console.log("result.message", result.message)
                ShowToast.success(result.message)
            }
            else if (result.status === 404) {
                ShowToast.info('Please check the error', {
                    description: result.message,
                    useCustom: true,
                    duration: 5000
                })
            }
            else {
                ShowToast.error("Please check the error", {
                    description: result?.message,
                    useCustom: true,
                    duration: 3000
                })
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error("Please check the error", {
                description: error?.data?.message,
                useCustom: true,
                duration: 5000
            })
        }
    }

    return (

        <section className='my-5'>
            <div className='flex items-center justify-center flex-col relative group'>
                <div className='relative'>
                    <Avatar className="w-32 h-32 rounded-none">
                        {projectDetail?.project_icon ? (
                            <AvatarImage
                                src={projectDetail?.project_icon}
                                alt={`${projectDetail?.data?.name}`}
                                className="object-cover"
                            />
                        ) : (
                            <AvatarFallback className='rounded-sm text-5xl text-neutral-500'>
                                {initialProjectName}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    {/* Overlapping Button */}
                    <Button
                        variant="outline"
                        className={`
                            absolute bottom-0 left-0 right-0 
                            transition-all duration-300 ease-in-out
                            h-1/3 group-hover:h-full
                            opacity-70 group-hover:opacity-90
                            flex items-center justify-center
                            rounded-none
                        `}
                    >
                        Change icon
                    </Button>
                </div>
                <div className='mt-1'>
                    <span className='text-sm text-neutral-500 font-medium'>{projectDetail?.data?.name}</span>
                </div>
            </div>
            <Card className='mt-4 border-none outline-none shadow-none p-0'>
                <CardHeader className="p-0">
                    <CardTitle className="text-sm p-0 text-neutral-500 font-normal flex items-center gap-x-1">
                        Required fields marked with asterisk
                        <span className='text-red-500 text-base'>*</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className='p-0 mt-3 w-80'>
                    <form className='space-y-5' onSubmit={handleSubmitForm}>
                        <div className='space-y-1'>
                            <Label className="flex items-center gap-x-1 text-neutral-500 font-semibold">
                                Name
                                <span className='text-red-500 '>*</span>
                            </Label>
                            <Input
                                value={addProjectName}
                                className="focus:ring-none text-neutral-500 border border-neutral-300 hover:bg-neutral-200/30"
                                onChange={(e) => setAddProjectName(e.target.value)}
                            />
                        </div>

                        <div className='space-y-1'>
                            <Label className="flex items-center gap-x-1 text-neutral-500 font-semibold relative">
                                Project key
                                <span className='text-red-500 '>*</span>
                                <Button
                                    variant='default'
                                    size="size"
                                    type='button'
                                    onClick={(e) => {
                                        e.preventDefault();    // Prevent form submission
                                        e.stopPropagation();   // Stop event bubbling
                                        setOpenInfo(prev => !prev); // Toggle instead of always setting to false
                                    }}
                                >
                                    <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                                </Button>

                                {
                                    openInfo && (
                                        <Card className="p-0 w-60 absolute z-50 right-0 left-32 bg-neutral-50 ">
                                            <X
                                                size={15}
                                                className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-700 cursor-pointer z-10"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setOpenInfo(false);
                                                }}
                                            />
                                            <CardContent className='px-4 py-4 pt-6'>
                                                <span className='text-neutral-500 text-wrap font-medium text-sm'>
                                                    Project keys serve as distinct, unchangeable identifiers for projects and are assigned only once during creation.
                                                </span>
                                            </CardContent>
                                        </Card>
                                    )
                                }
                            </Label>
                            <Input
                                value={projectDetail?.data?.project_key}
                                className="focus:ring-none font-normal text-neutral-700 border border-neutral-400 hover:bg-neutral-200/30"
                                onChange={(e) => setProjectName(e.traget.value)}
                                disabled
                            />
                        </div>

                        <div className='space-y-1'>
                            <div className='flex items-center justify-between'>
                                <Label className="flex items-center gap-x-1 text-neutral-500 font-semibold">
                                    Project lead
                                    <span className='text-red-500 '>*</span>
                                </Label>
                            </div>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <div className="w-full min-h-[40px] px-3 py-2 border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between">
                                        {selectedMember ? (
                                            <div className='flex items-center gap-x-2'>
                                                <ManageAvatar
                                                    firstName={selectedMember.first_name}
                                                    lastName={selectedMember.last_name}
                                                    image={selectedMember.image}
                                                />
                                                <span className="text-neutral-700">
                                                    {selectedMember.first_name} {selectedMember.last_name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-500">Select project leader...</span>
                                        )}
                                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search team members..."
                                            value={searchTerm}
                                            onValueChange={handleSearchTerm}
                                        />
                                        <DottedSeparator />
                                        <CommandList>
                                            {isMembersLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="animate-spin h-5 w-5 text-neutral-500" />
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No members found</CommandEmpty>
                                                    <CommandGroup>
                                                        {members.map((member) => (
                                                            <CommandItem
                                                                key={member._id}
                                                                value={member._id}
                                                                onSelect={() => handleLeaderChange(member._id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <ManageAvatar
                                                                        firstName={member.first_name}
                                                                        lastName={member.last_name}
                                                                        image={member.image}
                                                                    />
                                                                    <span>
                                                                        {member.first_name} {member.last_name}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                    {showViewAllMember && (
                                                        <>
                                                            <DottedSeparator />
                                                            <CommandItem className="text-center justify-center cursor-pointer">
                                                                View All Members
                                                            </CommandItem>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <ButtonLoader
                            variant="teritary"
                            size="sm"
                            isLoading={isLoading}
                        >
                            Save
                        </ButtonLoader>
                    </form>
                </CardContent>
            </Card>
        </section>
    )
}

export default ProjectDetail
