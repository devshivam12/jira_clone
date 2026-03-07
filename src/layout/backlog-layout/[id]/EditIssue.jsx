import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'

import { Check, ChevronDown, ChevronUp, Flag, Link, Pen, Plus, Share2, ThumbsUp, X, Image as ImageIcon, Search, AlignLeft, Send, AlertCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { DottedSeparator } from '@/components/dotted-separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import WorkSelector from '@/components/common/WorkSelector'
import { useProjectData } from '@/hooks/useProjectData'
import { taskApi, useAddVotesMutation, useGetTaskByIdQuery, useGetTaskVotesMutation, useUpdateIssueMutation } from '@/redux/graphql_api/task'
import CommonDropdownMenu from '@/components/common/CommonDropdownMenu'
import LabelSelector from '@/components/common/LabelSelector'
import RichTextEditor from '@/components/ui/richTextEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommentComponent from '@/components/common/CommentComponent'
import { useUserData } from '@/hooks/useUserData'
import { Controller, useForm } from 'react-hook-form'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import { useDispatch } from 'react-redux'
import { Skeleton } from '@/components/ui/skeleton'
import AddFlag from '@/components/common/AddFlag'

const EditIssue = ({ issue }) => {
    const { control, handleSubmit, setValue, watch, reset, getValues } = useForm({
        defaultValues: {
            taskNumber: 0,
            task_status: "",
            importance: "",
            description: "",
            assigneeDetail: {},
            reporterDetail: {},
            creatorDetail: {},
            teamDetail: {},
            sprintDetail: {},
            labels: [],
            project_key: "",
            summary: "",
            work_type: ""
        }
    })
    const [vote, setVote] = useState({})
    const [taskDetail, setTaskDetail] = useState({})
    const [voteDetail, setVoteDetail] = useState([])
    const [isScrolled, setIsScrolled] = useState(false)
    const { userData } = useUserData()
    const { currentProject, workType, importance, workFlow } = useProjectData()
    const [searchParams, setSearchParams] = useSearchParams()
    const taskId = searchParams.get('issueId')

    const { data: getTask, isFetching: taskFetching } = useGetTaskByIdQuery({
        operationName: "getTaskDetail",
        variables: {
            taskId: taskId
        }
    }, {
        skip: !taskId,
    })
    const task = getTask?.data?.getTaskDetail?.data
    useEffect(() => {
        if (task) {
            reset({
                taskNumber: task.taskNumber,
                summary: task?.summary,
                description: task?.description,
                task_status: task?.task_status,
                work_type: task?.work_type,
                project_key: task?.project_key,
                labels: task?.labels,
                assigneeDetail: task?.assigneeDetail,
                reporterDetail: task?.reporterDetail,
                creatorDetail: task?.creatorDetail,
                importance: task?.importance,
                teamDetail: task?.teamDetail,
                sprintDetail: task?.sprintDetail
            })
            setTaskDetail({
                projectKey: task?.project_key,
                taskNumber: task?.taskNumber,
                work_type: task?.work_type
            })

            setVote({
                count: task?.vote?.count,
                hasVoted: task?.vote?.hasVoted
            })
        }
    }, [task, taskId, reset])
    const dispatch = useDispatch()
    const [updateTask, { isLoading: taskSubmit }] = useUpdateIssueMutation()
    const [getVotes, { isLoading: voteLoading }] = useGetTaskVotesMutation()
    const [addVotes, { isLoading: addVoteLoading }] = useAddVotesMutation()
    const summaryRef = useRef(null)

    const [openParent, setOpenParent] = useState(false)
    const [expandDetails, setExpandDetails] = useState(true)
    const [openCommand, setOpenCommand] = useState(false)
    const commandRef = useRef(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isEditingSummary, setIsEditingSummary] = useState(false)
    const [tempSummary, setTempSummary] = useState("")
    const [activeDropdown, setActiveDropdown] = useState(null)
    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false)
    const [currentFlagTask, setCurrentFlagTask] = useState(null)


    const taskTypes = useMemo(() => workFlow.map((status, index) => ({
        id: index + 1,
        name: status.name,
        value: status.slug,
        color: status.color
    })), [workFlow]);

    const importanceTypes = useMemo(() => importance?.map((imp, index) => ({
        id: index + 1,
        name: imp.name,
        value: imp.slug,
        color: imp.color
    })), [importance])


    const handleUpdateTask = useCallback(async (key, value, fullDetail) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: taskId,
                    key: key,
                    value: value,
                    ...(fullDetail !== undefined && { fullDetail })
                }
            }
            const response = await updateTask(payload).unwrap()
            // Unflag functionality can rely on this directly
            if (key === 'isFlagged' && value === false) {
                ShowToast.success("Flag removed successfully")
            }
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    }, [taskId, userData, currentProject, updateTask])

    const toggleTaskStatusDropdown = useCallback((isOpen) => {
        if (isOpen) setActiveDropdown('task_status');
        else setActiveDropdown(null);
    }, [])

    const toggleImportanceDropdown = useCallback((isOpen) => {
        if (isOpen) setActiveDropdown('importance');
        else setActiveDropdown(null);
    }, [])

    useEffect(() => {
        summaryRef.current = getValues("summary")
    }, [])

    const changeTaskStatus = useCallback((status) => {
        handleUpdateTask('task_status', status)
    }, [handleUpdateTask])

    const changeImportance = useCallback((imp) => {
        handleUpdateTask('importance', imp)
    }, [handleUpdateTask])

    const changleAssignee = useCallback((ass) => {
        handleUpdateTask('assigneeId', ass?._id || null, ass || null)
    }, [handleUpdateTask])

    const changeLables = useCallback((label) => {
        handleUpdateTask('labels', label)
    }, [handleUpdateTask])

    const changeTeam = useCallback((team) => {
        handleUpdateTask('teamId', team?._id || null, team || null)
    }, [handleUpdateTask])

    const changeReporter = useCallback((report) => {
        handleUpdateTask('reporterId', report?._id || null, report || null)
    }, [handleUpdateTask])

    const data_f_vote = useCallback((v) => {
        const fullName = v?.first_name + " " + v?.last_name
        return (
            <div className='flex items-center gap-x-2'>
                <ManageAvatar
                    firstName={v?.fist_name}
                    lastName={v?.last_name}
                    image={v?.image}
                    size='sm'
                />
                <span>{fullName}</span>
            </div>
        )
    }, [])

    const handleToggleVote = useCallback(async () => {
        const isRemoving = vote.hasVoted
        try {
            const payload = {
                operationName: "addVote",
                variables: {
                    taskId: taskId,
                    memberId: userData?.memberId,
                    isRemove: isRemoving
                }
            }

            const result = await addVotes(payload).unwrap()

            if (result?.data?.addVote?.status === true) {
                // console.log("cxxcxc", typeof taskId)
                dispatch(
                    taskApi.util.updateQueryData(
                        'getTaskById',
                        { operationName: "getTaskDetail", variables: { taskId: taskId } },
                        (draft) => {
                            // console.log("Draft as JSON:", JSON.parse(JSON.stringify(draft)))
                            if (draft?.data?.getTaskDetail?.data?.vote) {
                                // console.log("console.log(draft.data.getTaskDetail.data.vote)", console.log(draft.data.getTaskDetail.data.vote))
                                draft.data.getTaskDetail.data.vote.count =
                                    isRemoving ? Math.max(0, draft.data.getTaskDetail.data.vote.count - 1)
                                        : draft.data.getTaskDetail.data.vote.count + 1
                                draft.data.getTaskDetail.data.vote.hasVoted = !isRemoving
                            }
                        }
                    )
                )

            }
        } catch (error) {
            console.error("Error toggling vote:", error)
            ShowToast.error(`Failed to ${isRemoving ? 'remove' : 'add'} vote: ${error?.message || 'Unknown error'}`)
        }
    }, [vote.hasVoted, taskId, userData?.memberId, addVotes])

    const fetchVotes = useCallback(async () => {
        try {
            const payload = {
                operationName: "getVote",
                variables: {
                    taskId: taskId
                }
            }
            const result = await getVotes(payload).unwrap()
            const votes = result?.data?.getVote?.data
            if (votes.length > 0) {
                const formattedVotes = votes.map(v => ({
                    id: v?._id,
                    label: data_f_vote(v)
                }));

                const match = userData?.memberId
                // console.log("match", match)
                const mResult = vote?.hasVoted ? true : false

                const menuItems = [
                    {
                        id: vote.hasVoted ? 'remove-vote' : 'add-vote',
                        label: vote.hasVoted ? 'Remove vote' : 'Add vote',
                        danger: vote.hasVoted,
                        onSelect: () => handleToggleVote()
                    },
                    { type: 'separator' },
                    ...formattedVotes
                ];
                // console.log("menuItems", menuItems)
                setVoteDetail(menuItems);
            }
        } catch (error) {
            // console.log("error", error)
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    }, [taskId, getVotes, data_f_vote, vote.hasVoted, handleToggleVote])

    const handleVoteOpen = useCallback((open) => {
        if (open && voteDetail.length === 0) {
            fetchVotes()
        }
    }, [voteDetail.length, fetchVotes])

    const handleSprintChange = useCallback((selectedSprint) => {
        handleUpdateTask(
            'sprintId',
            selectedSprint?._id || null,
            selectedSprint || null
        )
    }, [handleUpdateTask])

    const workItemMenuItems = [
        {
            id: task?.flagDetail?.isFlagged ? 'remove-flag' : 'add-flag',
            label: task?.flagDetail?.isFlagged ? 'Remove flag' : 'Add flag',
            onSelect: () => {
                if (task?.flagDetail?.isFlagged) {
                    handleUpdateTask('isFlagged', false)
                } else {
                    setCurrentFlagTask({
                        _id: taskId,
                        workType: task?.work_type,
                        project_key: task?.project_key,
                        taskNumber: task?.taskNumber,
                        summary: task?.summary
                    })
                    setIsFlagDialogOpen(true)
                }
            }
        },
        {
            id: vote.hasVoted ? 'remove-vote' : 'add-vote',
            label: vote.hasVoted ? 'Remove vote' : 'Add vote',
            danger: vote.hasVoted,
            onSelect: handleToggleVote
        },
        { type: 'separator' },
        {
            id: 'add-parent',
            label: "Add parent"
        },
        {
            id: 'clone',
            label: 'Clone'
        },
        {
            id: 'move',
            label: 'Move'
        },
        {
            id: 'archive',
            label: 'Archive'
        },
        {
            id: 'delete',
            label: 'Delete'
        },
        { type: 'separator' },
        {
            id: 'export-excel',
            label: 'Export excel'
        },
        {
            id: 'export-pdf',
            label: 'Export pdf'
        }
    ];

    const workRelatItem = [
        {
            id: 'create-sub-task',
            label: 'Create subtask',
        },
        {
            id: 'add-to-sprint',
            label: 'Add to sprint',
            type: 'submenu',
            content: (
                <DynamicDropdownSelector
                    slug="sprint"
                    onChange={(sprint, { onClose } = {}) => {
                        handleSprintChange(sprint);
                        onClose?.();
                    }}
                    label="Select sprint"
                    showDropdown
                />
            )
        },
        {
            id: 'link-work-item',
            label: 'Link work item',
        },
        { type: 'separator' },
        {
            id: 'add-attachement',
            label: 'Add atachement',
        },
        {
            id: 'add-weblink',
            label: 'Add weblink',
        },
    ];

    const renderIcon = useCallback((item) => {
        let work = workType.find(t => t.slug === item)
        if (item && work) {
            return <div className={`w-6 h-6 rounded-md flex items-center justify-center ${work.color}`}>
                <img
                    src={work.icon}
                    className="w-4 h-4 filter brightness-0 invert"
                />
            </div>
        }
    }, [workType])

    const handleClose = () => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.delete("issueId");
            return params;
        })
    }

    const handleClickOutside = (event) => {
        if (commandRef.current && !commandRef.current.contains(event.target)) {
            setOpenCommand(false);
        }
    };
    const handleSelectEpic = useCallback((selectedParent) => {
        handleUpdateTask('parentId', selectedParent._id || null, selectedParent || null)
        setOpenParent(false)
    }, [handleUpdateTask])

    const handleRemoveEpic = () => {
        handleUpdateTask('parentId', null)
    }
    // console.log("openParent", openParent)
    useEffect(() => {
        if (openCommand) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [openCommand]);

    const handleScrollEffect = (e) => {
        const scrolled = e.target.scrollTop > 0
        if (scrolled !== isScrolled) {
            setIsScrolled(scrolled)
        }
    }

    if (taskFetching || (!task && taskId)) {
        return (
            <Card className="flex flex-col h-full rounded-none bg-white shadow-none border-none">
                <div className={`sticky top-0 bg-white z-10`}>
                    <CardHeader className="m-0 pb-0 px-0 pt-2 bg-white">
                        <CardTitle>
                            <div className='flex items-center justify-between px-2 pb-1'>
                                <div className='hover:bg-neutral-200/40 cursor-pointer px-2 py-2 rounded-md'>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className='flex items-center gap-2 pr-1'>
                                    <Skeleton className="h-8 w-14" />
                                    <Skeleton className="h-8 w-10" />
                                    <Skeleton className="h-8 w-10" />
                                    <Skeleton className="h-8 w-10" />
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </div>
                <DottedSeparator className="h-px my-1 bg-neutral-200" />
                <CardContent className="mt-0 w-full overflow-y-auto px-4 lg:px-6 py-6 flex-grow flex flex-col gap-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-sm" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-10 w-4/5" />
                    </div>

                    <div className='flex items-center gap-3'>
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-10" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-28 w-full" />
                    </div>

                    <Skeleton className="h-14 w-full mt-4" />

                    <div className='mt-2 flex flex-col gap-4'>
                        <Skeleton className="h-4 w-16" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <form action="">
            <Card className="flex flex-col h-full rounded-none bg-white shadow-none relative border-none">
                <div className={`sticky top-0 bg-white z-10 ${isScrolled ? 'shadow-sm' : ''}`}>
                    <CardHeader className="m-0 pb-0 px-0 pt-2 bg-white">
                        <CardTitle >
                            <div className='flex items-center justify-between px-2 h-12'>
                                <div className='hover:bg-neutral-200/40 cursor-pointer px-2 py-2 rounded-md group flex items-center h-full'>
                                    {task?.parentDetail === null && (
                                        <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <div className="cursor-pointer flex items-center">
                                                    <p className='flex items-center gap-2'>
                                                        <Plus className='flex items-center justify-center w-3 h-3 font-normal text-neutral-500 cursor-pointer' />
                                                        <span className='text-xs text-neutral-500'>
                                                            Add epic
                                                        </span>
                                                    </p>
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-64 p-0"
                                                align="end"
                                                sideOffset={8}
                                                onClick={(e) => e.stopPropagation()}
                                                forceMount={true}
                                            >
                                                <DynamicDropdownSelector
                                                    slug={'parent'}
                                                    onChange={handleSelectEpic}
                                                    label={"Select epic"}
                                                    showDropdown={true}
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <div className='flex items-center h-full gap-1'>
                                    {vote.count > 0 && (
                                        <div className="flex justify-center items-center">
                                            <CommonDropdownMenu
                                                triggerIcon={
                                                    <Button
                                                        size="sm"
                                                        variant="teritary"
                                                        type="button"
                                                        disabled={addVoteLoading}
                                                    >
                                                        <ThumbsUp size={18} className={vote.hasVoted ? 'fill-blue-600 text-blue-600' : ''} />
                                                        <span className={vote.hasVoted ? 'text-blue-600' : ''}>
                                                            {vote.count}
                                                        </span>
                                                    </Button>
                                                }
                                                items={voteDetail}
                                                isLoading={voteLoading}
                                                onOpenChange={handleVoteOpen}
                                            />
                                        </div>
                                    )}

                                    {task?.flagDetail?.isFlagged && (
                                        <div className="flex justify-center items-center">
                                            <Popover modal={false}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        type="button"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Flag size={20} fill="currentColor" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    align="end"
                                                    side="bottom"
                                                    sideOffset={12}
                                                    className="w-80 p-0 border border-red-100/80 shadow-xl rounded-xl overflow-hidden bg-white z-[60]"
                                                >
                                                    <div className="bg-red-50/80 px-4 py-3 border-b border-red-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Flag size={16} className="text-red-500" fill="currentColor" />
                                                            <h4 className="text-sm font-semibold text-red-900">
                                                                Flagged
                                                            </h4>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2.5 text-xs text-red-700 hover:text-red-800 hover:bg-white border border-transparent hover:border-red-200 shadow-sm"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleUpdateTask("isFlagged", false);
                                                            }}
                                                        >
                                                            Remove flag
                                                        </Button>
                                                    </div>
                                                    <div className="p-4 text-sm bg-white">
                                                        {(task.flagDetail?.flaggedBy?.first_name || task.flagDetail?.flaggedAt) && (
                                                            <div className="mb-3 flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-neutral-500">
                                                                {task.flagDetail?.flaggedBy?.first_name && (
                                                                    <span className="font-medium text-neutral-700">
                                                                        By {task.flagDetail.flaggedBy.first_name} {task.flagDetail.flaggedBy.last_name ?? ""}
                                                                    </span>
                                                                )}
                                                                {task.flagDetail?.flaggedAt && task.flagDetail?.flaggedBy?.first_name && (
                                                                    <span>•</span>
                                                                )}
                                                                {task.flagDetail?.flaggedAt && (
                                                                    <span>{format(new Date(task.flagDetail.flaggedAt), "MMM d, yyyy")}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {task.flagDetail?.reason ? (
                                                            <div
                                                                className="text-neutral-600 leading-relaxed break-words"
                                                                dangerouslySetInnerHTML={{ __html: task.flagDetail.reason }}
                                                            />
                                                        ) : (
                                                            <span className="text-neutral-500 italic">No reason provided</span>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                    <div className="flex justify-center items-center">
                                        <Button variant="ghost" size="icon" type="button" className="text-neutral-500 hover:text-neutral-700">
                                            <Share2 size={20} />
                                        </Button>
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <CommonDropdownMenu items={workItemMenuItems} />
                                    </div>
                                    <div className="flex justify-center items-center">
                                        <Button variant="ghost" size="icon" type="button" onClick={handleClose} className="text-neutral-500 hover:text-neutral-700">
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                </div>
                <DottedSeparator className="h-px my-1 bg-neutral-200" />
                <CardContent
                    className="mt-0 w-full overflow-y-auto px-4 lg:px-6 py-4 flex-grow"
                    onScroll={handleScrollEffect}
                >
                    <div className='flex flex-col gap-5 [&::-webkit-scrollbar]:hidden"'>
                        <div className='flex flex-col gap-2'>
                            <div className="flex items-center cursor-pointer hover:underline group">
                                <span className="text-neutral-500 font-normal text-base flex items-center gap-x-2">
                                    {renderIcon(taskDetail?.work_type)}
                                    {taskDetail?.projectKey} - {taskDetail?.taskNumber}

                                    {/* Hover icon */}
                                    <TooltipWrapper content={"Copy link"}>
                                        <Button variant='default' size="icon" type="button">
                                            <Link
                                                size={16}
                                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            />
                                        </Button>
                                    </TooltipWrapper>
                                </span>
                            </div>
                        </div>



                        {task?.parentDetail && (
                            <div className="flex items-center cursor-pointer hover:underline group">
                                <span className="text-neutral-500 font-normal text-base flex items-center gap-x-2">
                                    {renderIcon('epic')}
                                    {task.parentDetail.summary}

                                    <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <DropdownMenu open={openParent} onOpenChange={setOpenParent} modal={false}>
                                            <TooltipWrapper content={"Change parent"}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant='default' size="icon" type="button"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Pen size={16}
                                                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipWrapper>

                                            <DropdownMenuContent
                                                className="w-64 p-0"
                                                align="end"
                                                sideOffset={8}
                                                onClick={(e) => e.stopPropagation()}
                                                forceMount
                                            >
                                                <DynamicDropdownSelector
                                                    slug={"parent"}
                                                    onChange={handleSelectEpic}
                                                    label={"Select epic"}
                                                    showDropdown
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <TooltipWrapper content={"Remove parent"}>
                                            <Button
                                                variant='default' size="icon" type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveEpic();
                                                }}
                                            >
                                                <X size={16}
                                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                            </Button>
                                        </TooltipWrapper>
                                    </div>
                                </span>
                            </div>
                        )}

                        <div className='w-full'>
                            <Controller
                                name="summary"
                                control={control}
                                render={({ field }) => (
                                    !isEditingSummary ? (
                                        <div
                                            className="text-2xl font-semibold text-neutral-800 py-2 px-3 hover:bg-neutral-200/50 rounded-md cursor-text transition-all min-h-[48px] break-words border border-transparent"
                                            onClick={() => {
                                                setTempSummary(field.value);
                                                setIsEditingSummary(true);
                                                setTimeout(() => summaryRef.current?.focus(), 50);
                                            }}
                                        >
                                            {field.value || "Your summary"}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 w-full">
                                            <Input
                                                ref={(e) => {
                                                    field.ref(e);
                                                    summaryRef.current = e;
                                                }}
                                                value={tempSummary}
                                                onChange={(e) => setTempSummary(e.target.value)}
                                                placeholder="Your summary"
                                                className="text-2xl font-semibold text-neutral-800 border-2 border-blue-500 h-auto py-2 px-3 shadow-none focus-visible:ring-0 transition-all bg-white"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        field.onChange(tempSummary);
                                                        handleUpdateTask('summary', tempSummary);
                                                        setIsEditingSummary(false);
                                                    } else if (e.key === 'Escape') {
                                                        setIsEditingSummary(false);
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-md bg-white hover:bg-neutral-100 shadow-sm border border-neutral-200 text-neutral-600 hover:text-neutral-900"
                                                    onClick={() => {
                                                        field.onChange(tempSummary);
                                                        handleUpdateTask('summary', tempSummary);
                                                        setIsEditingSummary(false);
                                                    }}
                                                >
                                                    <Check size={16} strokeWidth={2.5} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-md bg-white hover:bg-neutral-100 shadow-sm border border-neutral-200 text-neutral-600 hover:text-neutral-900"
                                                    onClick={() => setIsEditingSummary(false)}
                                                >
                                                    <X size={16} strokeWidth={2.5} />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                )}
                            />
                        </div>
                        <div className='flex items-center flex-wrap gap-3'>

                            <div className="flex items-center justify-center">
                                <Controller
                                    name='task_status'
                                    control={control}
                                    render={({ field }) => (
                                        <WorkSelector
                                            initialValue={field.value}
                                            key={field.value}
                                            value={field.value}
                                            workTypes={taskTypes}
                                            open={activeDropdown === 'task_status'}
                                            onOpenChange={toggleTaskStatusDropdown}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                if (val) changeTaskStatus(val);
                                            }}
                                        />
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-center">
                                <Controller
                                    name='importance'
                                    control={control}
                                    render={({ field }) => (
                                        <WorkSelector
                                            initialValue={field.value}
                                            value={field.value}
                                            key={field.value}
                                            workTypes={importanceTypes}
                                            open={activeDropdown === 'importance'}
                                            onOpenChange={toggleImportanceDropdown}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                if (val) changeImportance(val);
                                            }}
                                        />
                                    )}
                                />
                            </div>
                            <div className='border border-input bg-neutral-50 shadow-none rounded-md hover:bg-accent hover:text-accent-foreground text-neutral-500'>
                                <CommonDropdownMenu triggerIcon={<Plus size={18} />} triggerTooltip='Add or create related work' items={workRelatItem} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-neutral-600 font-medium text-sm ml-1">Description</Label>

                            {!isEditing ? (
                                <div
                                    onClick={() => setIsEditing(true)}
                                    className="min-h-[60px] py-3 px-3 border border-neutral-200 hover:border-neutral-400/50 rounded-md transition cursor-pointer hover:bg-neutral-100/50"
                                >
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            field.value ? (
                                                <div
                                                    className="text-neutral-500  px-2 font-normal text-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: field.value }}
                                                />
                                            ) : (
                                                <span className="text-neutral-400">Add a description....</span>
                                            )
                                        )}
                                    />
                                </div>
                            ) : (
                                <div className="mt-2 overflow-hidden animate-in fade-in duration-200">
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="mt-2 border rounded-md overflow-hidden">
                                                <RichTextEditor
                                                    content={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Add description..."
                                                    minHeight="150px"
                                                />
                                            </div>
                                        )}
                                    />
                                    <div className="flex justify-end gap-2 p-2 bg-neutral-50 border-t">
                                        <Button
                                            variant="default"
                                            type="button"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="teritary"
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                const value = getValues("description")
                                                handleUpdateTask("description", value)
                                                setIsEditing(false)
                                            }}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className='mt-6 shadow-sm border-neutral-200 rounded-md'>
                        <CardHeader
                            className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer bg-neutral-100/80 border-b border-neutral-200 hover:bg-neutral-200/50 transition-colors"
                            onClick={() => setExpandDetails((prev) => !prev)}
                        >
                            <span className='text-neutral-700 font-medium text-base'>
                                Details
                            </span>
                            {expandDetails === true ? <ChevronDown className='text-neutral-500 h-5 w-5' /> : <ChevronUp className='text-neutral-500 h-5 w-5' />}
                        </CardHeader>
                        {expandDetails && (
                            <CardContent className="bg-neutral-200/10 py-5 px-4 flex flex-col gap-6 relative rounded-b-md">
                                <div className='flex flex-col gap-1.5'>
                                    <Label className='text-sm text-neutral-600 font-medium'>
                                        Assignee
                                    </Label>
                                    <Controller
                                        name="assigneeDetail"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicDropdownSelector
                                                slug={'member'}
                                                value={field.value}
                                                onChange={changleAssignee}
                                                label={"Select assignee"}
                                            />
                                        )}
                                    />
                                </div>

                                <div className='flex flex-col gap-1.5 w-full'>
                                    <Label className='text-sm text-neutral-600 font-medium'>
                                        Labels
                                    </Label>
                                    <Controller
                                        name='labels'
                                        control={control}
                                        render={({ field }) => (
                                            <LabelSelector
                                                onChange={changeLables}
                                                value={field.value}
                                            />
                                        )}
                                    />
                                </div>

                                <div className='flex flex-col gap-1.5'>
                                    <Label className='text-sm text-neutral-600 font-medium'>
                                        Team
                                    </Label>
                                    <Controller
                                        name="teamDetail"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicDropdownSelector
                                                slug={'team'}
                                                onChange={changeTeam}
                                                value={field.value}
                                                label={"Choose a team"}
                                            />
                                        )}
                                    />
                                </div>

                                {/* For Report  */}

                                <div className='flex flex-col gap-1.5'>
                                    <Label className='text-sm text-neutral-600 font-medium'>
                                        Reporter
                                    </Label>
                                    <Controller
                                        name="reporterDetail"
                                        control={control}
                                        render={({ field }) => (
                                            <DynamicDropdownSelector
                                                slug={'member'}
                                                value={field.value}
                                                onChange={changeReporter}
                                                label={"Add repoter"}
                                            />
                                        )}
                                    />
                                </div>

                            </CardContent>

                        )
                        }
                    </Card>

                    <div className='mt-8'>
                        <Label className="text-neutral-500">Activity</Label>
                        <Tabs>
                            <TabsList>
                                <TabsTrigger value='comments'>
                                    Comments
                                </TabsTrigger>

                                <TabsTrigger value='history'>
                                    History
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value='comments'>
                                <CommentComponent userData={userData} />
                                {/* <HistoryComponent /> */}
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
            {currentFlagTask && (
                <AddFlag
                    isOpen={isFlagDialogOpen}
                    setIsOpen={setIsFlagDialogOpen}
                    taskInfo={currentFlagTask}
                    isFlagged={true}
                    onConfirm={(reason) => {
                        handleUpdateTask('isFlagged', true, currentFlagTask._id)
                        setIsFlagDialogOpen(false)
                        setCurrentFlagTask(null)
                    }}
                    onCancel={() => {
                        setIsFlagDialogOpen(false)
                        setCurrentFlagTask(null)
                    }}
                />
            )}
        </form >
    )
}

export default EditIssue
