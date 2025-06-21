import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect';
import { EmailMultiSelectInput } from '@/components/ui/EmailMultiSelectInput';
import { Info, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import ShowToast from '@/components/common/ShowToast';
import { useCreateProjectMutation } from '@/redux/api/company/api';
import { useForm } from 'react-hook-form';
import ButtonLoader from '@/components/ui/buttonLoader';
import { useDispatch } from 'react-redux';
import { addProject } from '@/redux/reducers/projectSlice';
import { useProjectData } from '@/hooks/useProjectData';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useGetAllMemberListQuery } from '@/redux/api/company/team';
import { DottedSeparator } from '@/components/dotted-separator';
import ManageAvatar from '@/components/common/ManageAvatar';

const UseTemplate = ({ showForm, setShowForm, fieldsData, project_slug }) => {
    const { handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm()

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false);

    const { currentProject, projectSlug, templateSlug, defaultTab } = useProjectData()
    const [createProject, { isLoading }] = useCreateProjectMutation()
    const projectName = watch('name');
    const projectKey = watch('project_key');

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [localUserData, setLocalUserData] = useState(null);

    const [open, setOpen] = useState(false)
    const [leaderValue, setLeaderValue] = useState(null)

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
        let searchTimer;
        let userData;

        // Initialize user data and set default leader (only once)
        if (!localUserData) {
            try {
                userData = JSON.parse(localStorage.getItem('userData'));
                setLocalUserData(userData);
                if (userData?.member_id) {
                    setLeaderValue(userData.member_id);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        // Handle search term debouncing
        if (searchTerm !== debouncedSearchTerm) {
            searchTimer = setTimeout(() => {
                setDebouncedSearchTerm(searchTerm);
            }, 200);
        }

        // Handle project key generation from project name
        if (projectName) {
            const key = projectName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('');
            setValue('project_key', key);
        }

        // Cleanup timer
        return () => {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
        };
    }, [searchTerm, debouncedSearchTerm, projectName, setValue, localUserData]);

    const members = membersData?.data?.members || []

    // Memoized selected member to avoid unnecessary re-renders
    const selectedMember = useMemo(() => {
        return members.find((member) => member._id === leaderValue);
    }, [members, leaderValue]);

    // Memoized display for selected member (handles cases where member is not in current search)
    const selectedMemberDisplay = useMemo(() => {
        if (selectedMember) {
            return {
                name: `${selectedMember.first_name} ${selectedMember.last_name}`,
                isCurrentUser: leaderValue === localUserData?.member_id,
                ...selectedMember
            };
        }

        // If we have a leaderValue but member is not in current search results
        if (leaderValue && localUserData?.member_id === leaderValue) {
            return {
                name: `${localUserData.first_name || 'Current'} ${localUserData.last_name || 'User'}`,
                isCurrentUser: true,
                first_name: localUserData.first_name,
                last_name: localUserData.last_name,
                image: localUserData.image
            };
        }

        return null;
    }, [selectedMember, leaderValue, localUserData]);

    const handleSearchTerm = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const handleKeyChange = useCallback((e) => {
        const value = e.target.value
            .toUpperCase()
            .replace(/[^A-Z]/g, '');
        setValue('project_key', value);
    }, [setValue]);

    const handleCreateProject = async (data) => {
        try {
            const payload = {
                project: {
                    project_slug: project_slug,
                    template: fieldsData?.data,
                    project_key: data.project_key,
                    name: data.name,
                    project_leader : leaderValue
                }
            }

            const response = await createProject(payload).unwrap()
            console.log("response", response)
            if (response.status === 200) {
                const newProject = response.data
                dispatch(addProject({
                    ...newProject,
                    setAsCurrent: true
                }))
                navigate(`/dashboard/${projectSlug}/${templateSlug}/${defaultTab.url}`)
                reset()
                ShowToast.success("Project successfully created")
            }

            if (response.status === 400) {
                ShowToast.error("Project creation failed", {
                    description: response.message,
                    useCustom: true,
                    duration: 5000
                })
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error('project creation failed', {
                description: error.message,
                useCustom: true,
                duration: 5000
            })
        }
    }

    const onSubmit = (data) => {
        handleCreateProject(data)
    }

    console.log("leaderValue", leaderValue)
    return (
        <>
            <DialogHeader className="bg-neutral-100 p-6 text-neutral-500 m-0 ">
                <DialogTitle className="font-semibold text-xl">Create New Project from "{fieldsData?.data?.name}" Template </DialogTitle>
                <div className='mt-2  w-10/12'>
                    <p className="text-xs text-justify text-neutral-400 font-normal">
                        Configure your new project based on the {fieldsData?.data?.name} template.
                        Set your project details and invite team members to get started.
                    </p>
                </div>
            </DialogHeader>
            <form className='space-y-4 px-6' onSubmit={handleSubmit(onSubmit)}>
                <div className='w-96 space-y-2'>

                    <div className='space-y-1'>
                        <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                            Name
                            <span className='text-red-300'>*</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder="Enter your project name"
                            // onChange={(e) => setProjectName(e.target.value)}
                            className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                            {...register('name', {
                                required: 'Project name is required',
                                onChange: (e) => {
                                    // Convert to title case as user types
                                    const value = e.target.value
                                        .toLowerCase()
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                    e.target.value = value;
                                }
                            })}
                        />
                        {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                    </div>

                    <div className='space-y-1'>
                        <div className='flex items-center gap-x-2'>
                            <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                                Key
                                <span className='text-red-300'>*</span>
                            </Label>
                            <div>
                                <TooltipWrapper
                                    content="Helps quickly recognize which project an issue belongs to (e.g., TEST-101 = Test Project, DEV-205 = Development Project)."
                                    className="w-44 shadow-md text-justify"
                                    direction="right"
                                    width='200px'
                                >
                                    <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                                </TooltipWrapper>
                            </div>
                        </div>
                        <Input
                            type="text"
                            placeholder="Enter unique project key"
                            className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                            // onChange={(e) => setProjectKey(e.target.value)}
                            {...register('project_key', {
                                required: 'Project key is required',
                                pattern: {
                                    value: /^[A-Z]+$/,
                                    message: 'Project key must contain only uppercase letters'
                                },
                                onChange: handleKeyChange
                            })}
                        />
                        {errors.project_key && <p className='text-red-500 text-sm'>{errors.project_key.message}</p>}
                    </div>

                    <div className='space-y-1'>
                        <div className='flex items-center gap-x-2'>
                            <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                                Project Leader
                                <span className='text-red-300'>*</span>
                            </Label>
                            <div>
                                <TooltipWrapper
                                    content="Select a project leader"
                                    className="w-44 shadow-md text-justify"
                                    direction="right"
                                >
                                    <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                                </TooltipWrapper>
                            </div>
                        </div>
                        <div>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-72 justify-between"
                                    >
                                        {selectedMemberDisplay ? (
                                            <div className='flex items-center gap-x-3'>
                                                <ManageAvatar
                                                    firstName={selectedMemberDisplay.first_name}
                                                    lastName={selectedMemberDisplay.last_name}
                                                    image={selectedMemberDisplay.image}
                                                />
                                                <span>
                                                    {selectedMemberDisplay.name}
                                                    {selectedMemberDisplay.isCurrentUser && (
                                                        <span className="text-xs text-neutral-500 ml-1">(You)</span>
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            "Select member..."
                                        )}
                                        
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command className="py-2" shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search member..."
                                            className="h-9"
                                            value={searchTerm}
                                            onValueChange={handleSearchTerm}
                                        />
                                        <DottedSeparator />
                                        <CommandList>
                                            {
                                                isMembersLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="animate-spin h-5 w-5 text-neutral-500" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {members.length === 0 ? (
                                                            <CommandEmpty>No members found</CommandEmpty>
                                                        ) : (
                                                            <>
                                                                <CommandGroup>
                                                                    {members.map((member, index) => (
                                                                        <CommandItem
                                                                            className="cursor-pointer"
                                                                            key={index}
                                                                            value={member._id}
                                                                            onSelect={(currentValue) => {
                                                                                setLeaderValue(currentValue === leaderValue ? "" : currentValue);
                                                                                setOpen(false);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <ManageAvatar
                                                                                    firstName={member.first_name}
                                                                                    lastName={member.last_name}
                                                                                    image={member.image}
                                                                                />
                                                                                <span>{member.first_name} {member.last_name}</span>
                                                                            </div>

                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <DottedSeparator className='mb-2' />
                                                                <CommandItem
                                                                    className="cursor-pointer"
                                                                    onSelect={() => setShowAllMembers(true)}
                                                                >
                                                                    View All Members
                                                                </CommandItem>
                                                            </>
                                                        )}

                                                    </>
                                                )
                                            }

                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                    </div>


                </div>
                <DialogFooter className="mt-0 border-t border-neutral-200">
                    <div className='flex itmes-center p-6 gap-x-5'>
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(!showForm)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                        <div>
                            <ButtonLoader
                                variant="teritary"
                                type='submit'
                                isLoading={isLoading}
                            >
                                Submit
                            </ButtonLoader>
                        </div>
                    </div>
                </DialogFooter>
            </form >
        </>

    );
};

export default UseTemplate;