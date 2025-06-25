import ManageAvatar from '@/components/common/ManageAvatar'
import { DottedSeparator } from '@/components/dotted-separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGetAllMemberListQuery } from '@/redux/api/company/team'
import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const ProjectDetail = ({ projectDetail }) => {
    console.log("projectDetail", projectDetail)
    const [addProjectName, setAddProjectName] = useState('')
    const initialProjectName = projectDetail?.data?.name?.charAt(0)?.toUpperCase() ?? '';

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
    }, [searchTerm, debouncedSearchTerm, projectName]);

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
                    <div className='space-y-5'>
                        <div className='space-y-1'>
                            <Label className="flex items-center gap-x-1 text-neutral-500 font-semibold">
                                Name
                                <span className='text-red-500 '>*</span>
                            </Label>
                            <Input
                                value={projectDetail?.data?.name}
                                className="focus:ring-none text-neutral-500 border border-neutral-300 hover:bg-neutral-200/30"
                                onChange={(e) => setAddProjectName(e.traget.value)}
                            />
                        </div>

                        <div className='space-y-1'>
                            <Label className="flex items-center gap-x-1 text-neutral-500 font-semibold">
                                Project key
                                <span className='text-red-500 '>*</span>
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
                                <Button
                                    variant='outline'
                                    size='xs'
                                >
                                    Change project lead
                                </Button>
                            </div>
                            <Input
                                value={projectDetail?.data?.projectLeaderDetail
                                    ?.first_name + " " + projectDetail?.data?.projectLeaderDetail
                                        ?.last_name}
                                className="focus:ring-none text-neutral-500 border border-neutral-300 hover:bg-neutral-200/30"
                                onChange={(e) => setProjectName(e.traget.value)}
                            />
                            <div className='text-justify'>
                                <span className='text-neutral-500 font-normal text-xs'>Make sure your project lead has a permission for create an project.</span>
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
                                    <PopoverContent
                                        side="top"
                                        align="start"
                                        className="w-[200px] p-0"
                                    >
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
                                                                    {showViewAllMember && (
                                                                        <>
                                                                            <DottedSeparator className='mb-2' />
                                                                            <CommandItem
                                                                                className="cursor-pointer"
                                                                                onSelect={() => setShowAllMembers(true)}
                                                                            >
                                                                                View All Members
                                                                            </CommandItem>
                                                                        </>
                                                                    )

                                                                    }
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
                </CardContent>
            </Card>
        </section>
    )
}

export default ProjectDetail
