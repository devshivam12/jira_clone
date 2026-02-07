import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ChevronDown, ChevronUp, Link, Pen, Plus, Share, Share2, ThumbsUp, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { DottedSeparator } from '@/components/dotted-separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import WorkSelector from '@/components/common/WorkSelector'
import { useProjectData } from '@/hooks/useProjectData'
import { taskApi, useAddVotesMutation, useGetTaskByIdQuery, useGetTaskVotesMutation, useUpdateIssueMutation } from '@/redux/graphql_api/task'
import CommonDropdownMenu from '@/components/common/CommonDropdownMenu'
import LabelSelector from '@/components/common/LabelSelector'
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommentComponent from '@/components/common/CommentComponent'
import { useUserData } from '@/hooks/useUserData'
import { Controller, useForm } from 'react-hook-form'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import { useDispatch } from 'react-redux'

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
        skip: !taskId
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
    }, [task, reset])
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


    const handleUpdateTask = useCallback(async (key, value) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: taskId,
                    key: key,
                    value: value,
                    changeBy: userData.member_id,
                    projectId: currentProject?._id
                }
            }
            console.log("payload", payload)
            const response = await updateTask(payload).unwrap()
            console.log("response", response)
        } catch (error) {
            console.log("error", error)
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    })

    useEffect(() => {
        summaryRef.current = getValues("summary")
    }, [])

    const changeTaskStatus = (status) => {
        handleUpdateTask('task_status', status)
    }

    const changeImportance = (imp) => {
        handleUpdateTask('importance', imp)
    }
    const changleAssignee = (ass) => {
        console.log("assassassass", ass)
        handleUpdateTask('assigneeId', ass)
    }
    const changeLables = (label) => {
        handleUpdateTask('labels', label)
    }
    const changeTeam = (team) => {
        handleUpdateTask('teamId', team)
    }
    const changeReporter = (report) => {
        handleUpdateTask('reporterId', report)
    }

    const data_f_vote = (v) => {
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
    }

    const fetchVotes = async () => {
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
                console.log("match", match)
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
                console.log("menuItems", menuItems)
                setVoteDetail(menuItems);
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    }

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
                console.log("cxxcxc", typeof taskId)
                dispatch(
                    taskApi.util.updateQueryData(
                        'getTaskById',
                        { operationName: "getTaskDetail", variables: { taskId: taskId } },
                        (draft) => {
                            // console.log("Draft as JSON:", JSON.parse(JSON.stringify(draft)))
                            if (draft?.data?.getTaskDetail?.data?.vote) {
                                console.log("console.log(draft.data.getTaskDetail.data.vote)", console.log(draft.data.getTaskDetail.data.vote))
                                draft.data.getTaskDetail.data.vote.count =
                                    isRemoving ? Math.max(0, draft.data.getTaskDetail.data.vote.count - 1)
                                        : draft.data.getTaskDetail.data.vote.count + 1
                                draft.data.getTaskDetail.data.vote.hasVoted = !isRemoving
                            }
                        }
                    )
                )

                // ShowToast.success(isRemoving ? 'Vote removed successfully' : 'Vote added successfully')
            }
        } catch (error) {
            console.error("Error toggling vote:", error)
            ShowToast.error(`Failed to ${isRemoving ? 'remove' : 'add'} vote: ${error?.message || 'Unknown error'}`)
        }
    }, [vote.hasVoted, taskId, userData?.memberId, addVotes, fetchVotes])

    // const handleAdd_RemoveVote = async (flag) => {
    //     try {
    //         const payload = {
    //             operationName: "addVote",
    //             variables: {
    //                 taskId: taskId,
    //                 memberId: userData?.memberId,
    //                 isRemove: flag
    //             }
    //         }

    //         const result = await addVotes(payload).unwrap()
    //         if(result?.data?.addVote?.status === true){
    //             setVote((prev) => ({
    //                 count: flag ? prev.count - 1 : prev.count + 1,
    //                 hasVoted: !flag 
    //             }));
    //             fetchVotes()
    //         }

    //     } catch (error) {
    //         console.log("error", error)
    //         ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
    //     }
    // }

    const handleVoteOpen = useCallback((open) => {
        if (open && voteDetail.length === 0) {
            fetchVotes()
        }
    }, [voteDetail.length, fetchVotes])


    const workItemMenuItems = [
        {
            id: 'add-flag',
            label: 'Add flag',
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

    const renderIcon = (item) => {
        console.log("item-------", item)
        let work = workType.find(t => t.slug === item)
        console.log("work", work)
        if (item) {
            return <div className={`w-6 h-6 rounded-md flex items-center justify-center ${work.color}`}>
                <img
                    src={work.icon}
                    className="w-4 h-4 filter brightness-0 invert"
                />
            </div>
        }
    }

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
    const handleSelectEpic = (selectedParent) => {
        console.log("selectedParent", selectedParent)
        setOpenParent(false)
    }
    console.log("openParent", openParent)
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
        const isScrolled = e.target.scrollTop > 0
        if (isScrolled !== isScrolled) {
            setIsScrolled(isScrolled)
        }
    }
    return (
        <form action="">
            <Card className="flex flex-col h-full rounded-none bg-neutral-50 shadow-none">
                <div className={`sticky top-0 bg-neutral-100 z-10 ${isScrolled ? 'shadow-sm' : ''}`}>
                    <CardHeader className="m-0 pb-0 px-0 pt-2 bg-neutral-50">
                        <CardTitle >
                            <div className='flex items-center justify-between px-2'>
                                <div
                                    className='hover:bg-neutral-200/40 cursor-pointer px-2 py-2 rounded-md'
                                >
                                    <DropdownMenu open={openParent} onOpenChange={setOpenParent}>
                                        <DropdownMenuTrigger asChild>
                                            <div
                                                // onClick={handlEpicClick}
                                                className="cursor-pointer"
                                            >
                                                <p className='flex items-center gap-2'>
                                                    <Pen className='flex items-center justify-center w-3 h-3 font-normal text-neutral-500 cursor-pointer' />
                                                    <span
                                                        className='text-xs text-neutral-500'
                                                    >
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
                                </div>
                                <div className='flex items-center'>
                                <div className="w-14 flex justify-center overflow-hidden rounded-md" >
                                        {vote.count > 0 && (
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
                                        )
                                            // : (
                                            //     <TooltipWrapper content={vote.hasVoted ? "Remove vote" : "Add vote"}>
                                            //         <Button
                                            //             variant='default'
                                            //             size='icon'
                                            //             type='button'
                                            //             onClick={handleToggleVote}
                                            //             disabled={addVoteLoading}
                                            //         >
                                            //             <ThumbsUp size={20} className={vote.hasVoted ? 'fill-current' : ''} />
                                            //         </Button>
                                            //     </TooltipWrapper>
                                            // )
                                        }
                                    </div>


                                    {/* </div> */}
                                    <div className="w-10 flex justify-center">
                                        <Button variant="default" size="icon" type="button">
                                            <Share2 size={20} />
                                        </Button>
                                    </div>
                                    <div className="w-10 flex justify-center">
                                        <CommonDropdownMenu items={workItemMenuItems} />

                                    </div>
                                    <div className="w-10 flex justify-center">
                                        <Button variant="default" size="icon" type="button" onClick={handleClose}>
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
                    className="mt-0 w-full overflow-y-auto px-2 flex-grow"
                    onScroll={handleScrollEffect}
                >
                    <div className='space-y-2 [&::-webkit-scrollbar]:hidden"'>
                        <div className='mt-2'>
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
                        <div className='my-[0.8rem] pb-0'>
                            <Controller
                                name="summary"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="text"
                                        placeholder="Your summary"
                                        // className="text-2xl font-semibold text-neutral-500 border-none h-auto py-2 focus:ring-0"
                                        className="text-2xl font-semibold text-neutral-500 border-none h-auto py-3 px-2 shadow-none focus-visible:ring-1 hover:bg-neutral-200/40 transition-all"
                                        onFocus={() => {
                                            summaryRef.current = field.value; // store old value
                                        }}
                                        onBlur={(e) => {
                                            field.onBlur()
                                            const newValue = e.target.value
                                            if (newValue !== summaryRef.current) {
                                                handleUpdateTask('summary', e.target.value)
                                            }
                                        }}
                                    />
                                )}
                            />
                        </div>
                        <div className='flex items-center gap-2 mt-2'>

                            <div className="flex items-center justify-center">
                                <Controller
                                    name='task_status'
                                    control={control}
                                    render={({ field }) => (
                                        <WorkSelector
                                            initialValue={field.value}
                                            workTypes={taskTypes}
                                            onChange={changeTaskStatus}
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
                                            workTypes={importanceTypes}
                                            onChange={changeImportance}
                                        />
                                    )}
                                />
                            </div>
                            <div className='border border-input bg-neutral-50 shadow-none rounded-md hover:bg-accent hover:text-accent-foreground text-neutral-500'>
                                <CommonDropdownMenu triggerIcon={<Plus size={18} />} triggerTooltip='Add or create related work' items={workRelatItem} />
                            </div>
                        </div>
                        <div>
                            <Label className="text-neutral-500">Description</Label>

                            {!isEditing ? (
                                <div
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 min-h-[40px] py-2 border-none rounded-md transition cursor-pointer hover:bg-neutral-200/40"
                                >
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            field.value ? (
                                                <div
                                                    className="text-neutral-500 px-2 font-normal text-sm max-w-none"
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
                                                <CKEditor
                                                    editor={ClassicEditor}
                                                    data={field.value}
                                                    onChange={(event, editor) => {
                                                        field.onChange(editor.getData());
                                                    }}
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
                                                const value = watch("description")
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

                    <Card className='mt-4 shadow-none rounded-md  '>
                        <CardHeader
                            className="py-3 px-2 cursor-pointer bg-neutral-200 border border-neutral-300"
                            onClick={() => setExpandDetails((prev) => !prev)}
                        >
                            <CardTitle className="flex items-center justify-between">
                                <span className='text-neutral-500 font-semibold'>
                                    Details
                                </span>
                                {expandDetails === true ? <ChevronDown className='text-neutral-600' /> : <ChevronUp className='text-neutral-600' />}
                            </CardTitle>
                        </CardHeader>
                        {expandDetails && (
                            <CardContent className="bg-neutral-100 py-3 px-2 border border-neutral-300 text-neutral-500 space-y-2 relative">
                                <div
                                    className='space-y-2 '
                                >
                                    <Label className='text-sm text-neutral-500 gap-2'>
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

                                <div className='space-y-2 w-full'>
                                    <Label className='text-sm text-neutral-500 gap-2'>
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

                                <div className='space-y-2 '>
                                    <Label className='text-sm text-neutral-500 gap-2'>
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

                                <div className='space-y-2'>
                                    <Label className='text-sm text-neutral-500 gap-2'>
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
                </CardContent >
            </Card >
        </form >
    )
}

export default EditIssue
