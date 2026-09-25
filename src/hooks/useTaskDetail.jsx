import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'

import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import ManageAvatar from '@/components/common/ManageAvatar'
import ShowToast from '@/components/common/ShowToast'
import { buildTaskUrl } from '@/lib/taskLink'
import {
    taskApi,
    useAddVotesMutation,
    useDeleteTaskMutation,
    useGetTaskByIdQuery,
    useGetTaskVotesMutation,
    useUpdateIssueMutation
} from '@/redux/graphql_api/task'

import { useProjectData } from './useProjectData'
import { useUserData } from './useUserData'

const DEFAULT_FORM_VALUES = {
    taskNumber: 0,
    task_status: "",
    importance: "",
    description: "",
    dueDate: null,
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

// Everything a work item editor needs: the task itself, the form that holds the
// editable fields, and every action that can change it.
//
// Two screens share this. The drawer beside the backlog and timeline, and the
// dedicated page at /dashboard/:project_slug/:template_slug/view/:task_id. They
// look very different but behave the same, so the behaviour lives here and each
// screen only decides how to lay it out. A change to how a field saves is then
// made once instead of twice.
//
// `onAfterDelete` runs once the work item has been archived. The drawer uses it
// to drop the `issueId` param, the page uses it to go back to the list.
export const useTaskDetail = (taskId, { onAfterDelete } = {}) => {
    const dispatch = useDispatch()
    const { userData } = useUserData()
    const { currentProject, projectSlug, templateSlug, workType, importance, workFlow } = useProjectData()

    const { control, setValue, watch, reset, getValues } = useForm({
        defaultValues: DEFAULT_FORM_VALUES
    })

    const { data: getTask, isFetching: taskFetching } = useGetTaskByIdQuery({
        operationName: "getTaskDetail",
        variables: { taskId: taskId }
    }, {
        skip: !taskId,
    })
    const task = getTask?.data?.getTaskDetail?.data

    const [updateTask, { isLoading: taskSubmit }] = useUpdateIssueMutation()
    const [getVotes, { isLoading: voteLoading }] = useGetTaskVotesMutation()
    const [addVotes, { isLoading: addVoteLoading }] = useAddVotesMutation()
    const [deleteTask, { isLoading: deleteLoading }] = useDeleteTaskMutation()

    const [vote, setVote] = useState({})
    const [voteDetail, setVoteDetail] = useState([])
    const [taskDetail, setTaskDetail] = useState({})

    // Which of the two inline pickers in the action row is open. Only one at a
    // time, so a click on the other one closes the first.
    const [activeDropdown, setActiveDropdown] = useState(null)
    const [openParent, setOpenParent] = useState(false)
    const [expandDetails, setExpandDetails] = useState(true)

    const [isEditing, setIsEditing] = useState(false)
    const [isEditingSummary, setIsEditingSummary] = useState(false)
    const [tempSummary, setTempSummary] = useState("")
    const summaryRef = useRef(null)

    const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false)
    const [currentFlagTask, setCurrentFlagTask] = useState(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Kept in a ref so a caller can pass an inline arrow without making every
    // action below rebuild on each render.
    const afterDeleteRef = useRef(onAfterDelete)
    useEffect(() => {
        afterDeleteRef.current = onAfterDelete
    }, [onAfterDelete])

    // A different work item was opened, so anything half edited belongs to the
    // previous one and has to go.
    useEffect(() => {
        setIsEditing(false)
        setIsEditingSummary(false)
        setTempSummary("")
        setVoteDetail([])
    }, [taskId])

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
                sprintDetail: task?.sprintDetail,
                dueDate: task?.dueDate ?? null
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

    const taskTypes = useMemo(() => (workFlow || []).map((status, index) => ({
        id: index + 1,
        name: status.name,
        value: status.slug,
        color: status.color
    })), [workFlow])

    const importanceTypes = useMemo(() => (importance || []).map((imp, index) => ({
        id: index + 1,
        name: imp.name,
        value: imp.slug,
        color: imp.color
    })), [importance])

    // Label shown in the header when the task sits inside an epic, e.g. "PROJ-3 Login flow".
    const parentHeaderLabel = useMemo(() => {
        const parent = task?.parentDetail
        if (!parent) return ""
        const parentKey = parent.taskNumber && task?.project_key
            ? `${task.project_key}-${parent.taskNumber}`
            : ""
        return [parentKey, parent.summary].filter(Boolean).join(" ")
    }, [task?.parentDetail, task?.project_key])

    const taskKey = useMemo(() => {
        if (!taskDetail?.projectKey || taskDetail?.taskNumber == null) return ""
        return `${taskDetail.projectKey}-${taskDetail.taskNumber}`
    }, [taskDetail?.projectKey, taskDetail?.taskNumber])

    // Address of the dedicated page for this work item. Null until the project
    // slugs are known, which is what the caller checks before showing a link.
    const taskUrl = useMemo(
        () => buildTaskUrl(projectSlug, templateSlug, taskId),
        [projectSlug, templateSlug, taskId]
    )

    // Small square icon for a work type, drawn from the project template.
    const renderIcon = useCallback((item) => {
        const work = (workType || []).find(t => t.slug === item)
        if (item && work) {
            return (
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${work.color}`}>
                    <img src={work.icon} className="w-4 h-4 filter brightness-0 invert" />
                </div>
            )
        }
        return null
    }, [workType])

    // Every field edit goes through here. One key and one value at a time, which
    // is what the updateTask mutation expects. `fullDetail` is the whole object
    // behind an id (the member, the team, the epic) and is used only to patch
    // the cache so the change shows straight away.
    //
    // The response is handed back for the few fields the server can refuse on
    // its own terms (a due date before the start date, for one): those come back
    // as a normal reply carrying a status, not as a thrown error, so the caller
    // has to read it. Most callers ignore it.
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
            const result = await updateTask(payload).unwrap()
            // Unflag functionality can rely on this directly
            if (key === 'isFlagged' && value === false) {
                ShowToast.success("Flag removed successfully")
            }
            return result?.data?.updateTask
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
            return null
        }
    }, [taskId, updateTask])

    const toggleTaskStatusDropdown = useCallback((isOpen) => {
        setActiveDropdown(isOpen ? 'task_status' : null)
    }, [])

    const toggleImportanceDropdown = useCallback((isOpen) => {
        setActiveDropdown(isOpen ? 'importance' : null)
    }, [])

    const changeTaskStatus = useCallback((status) => {
        handleUpdateTask('task_status', status)
    }, [handleUpdateTask])

    const changeImportance = useCallback((imp) => {
        handleUpdateTask('importance', imp)
    }, [handleUpdateTask])

    const changeAssignee = useCallback((ass) => {
        handleUpdateTask('assigneeId', ass?._id || null, ass || null)
    }, [handleUpdateTask])

    const changeLabels = useCallback((label) => {
        handleUpdateTask('labels', label)
    }, [handleUpdateTask])

    const changeTeam = useCallback((team) => {
        handleUpdateTask('teamId', team?._id || null, team || null)
    }, [handleUpdateTask])

    const changeReporter = useCallback((report) => {
        handleUpdateTask('reporterId', report?._id || null, report || null)
    }, [handleUpdateTask])

    // `value` is an ISO string, or null when the date is cleared, and `previous`
    // is what the field held before the pick. The server turns down a due date
    // that lands before the task's start date, and says so in the reply rather
    // than by failing the request, so the answer has to be read: on a refusal
    // the message is shown and the field goes back to the old date instead of
    // sitting there looking saved.
    const changeDueDate = useCallback(async (value, previous = null) => {
        const response = await handleUpdateTask('dueDate', value)
        if (response && response.status !== 200) {
            ShowToast.error(response.message || "Could not save the due date")
            setValue('dueDate', previous)
        }
    }, [handleUpdateTask, setValue])

    const handleSprintChange = useCallback((selectedSprint) => {
        handleUpdateTask('sprintId', selectedSprint?._id || null, selectedSprint || null)
    }, [handleUpdateTask])

    const handleSelectEpic = useCallback((selectedParent) => {
        handleUpdateTask('parentId', selectedParent?._id || null, selectedParent || null)
        setOpenParent(false)
    }, [handleUpdateTask])

    const handleRemoveEpic = useCallback(() => {
        handleUpdateTask('parentId', null)
    }, [handleUpdateTask])

    const handleSaveSummary = useCallback((value) => {
        handleUpdateTask('summary', value)
        setIsEditingSummary(false)
    }, [handleUpdateTask])

    const handleSaveDescription = useCallback(() => {
        handleUpdateTask('description', getValues("description"))
        setIsEditing(false)
    }, [handleUpdateTask, getValues])

    const openFlagDialog = useCallback(() => {
        setCurrentFlagTask({
            _id: taskId,
            workType: task?.work_type,
            project_key: task?.project_key,
            taskNumber: task?.taskNumber,
            summary: task?.summary
        })
        setIsFlagDialogOpen(true)
    }, [taskId, task?.work_type, task?.project_key, task?.taskNumber, task?.summary])

    const closeFlagDialog = useCallback(() => {
        setIsFlagDialogOpen(false)
        setCurrentFlagTask(null)
    }, [])

    const confirmFlag = useCallback(() => {
        handleUpdateTask('isFlagged', true, taskId)
        closeFlagDialog()
    }, [handleUpdateTask, taskId, closeFlagDialog])

    const removeFlag = useCallback(() => {
        handleUpdateTask('isFlagged', false)
    }, [handleUpdateTask])

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
                dispatch(
                    taskApi.util.updateQueryData(
                        'getTaskById',
                        { operationName: "getTaskDetail", variables: { taskId: taskId } },
                        (draft) => {
                            if (draft?.data?.getTaskDetail?.data?.vote) {
                                draft.data.getTaskDetail.data.vote.count =
                                    isRemoving
                                        ? Math.max(0, draft.data.getTaskDetail.data.vote.count - 1)
                                        : draft.data.getTaskDetail.data.vote.count + 1
                                draft.data.getTaskDetail.data.vote.hasVoted = !isRemoving
                            }
                        }
                    )
                )
                // The list of voters behind the count is now out of date.
                setVoteDetail([])
            }
        } catch (error) {
            ShowToast.error(`Failed to ${isRemoving ? 'remove' : 'add'} vote: ${error?.message || 'Unknown error'}`)
        }
    }, [vote.hasVoted, taskId, userData?.memberId, addVotes, dispatch])

    const renderVoterRow = useCallback((v) => {
        const fullName = [v?.first_name, v?.last_name].filter(Boolean).join(" ")
        return (
            <div className='flex items-center gap-x-2'>
                <ManageAvatar
                    firstName={v?.first_name}
                    lastName={v?.last_name}
                    image={v?.image}
                    size='sm'
                />
                <span>{fullName}</span>
            </div>
        )
    }, [])

    const fetchVotes = useCallback(async () => {
        try {
            const payload = {
                operationName: "getVote",
                variables: { taskId: taskId }
            }
            const result = await getVotes(payload).unwrap()
            const votes = result?.data?.getVote?.data
            if (votes?.length > 0) {
                const formattedVotes = votes.map(v => ({
                    id: v?._id,
                    label: renderVoterRow(v)
                }))

                setVoteDetail([
                    {
                        id: vote.hasVoted ? 'remove-vote' : 'add-vote',
                        label: vote.hasVoted ? 'Remove vote' : 'Add vote',
                        danger: vote.hasVoted,
                        onSelect: () => handleToggleVote()
                    },
                    { type: 'separator' },
                    ...formattedVotes
                ])
            }
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    }, [taskId, getVotes, renderVoterRow, vote.hasVoted, handleToggleVote])

    const handleVoteOpen = useCallback((open) => {
        if (open && voteDetail.length === 0) {
            fetchVotes()
        }
    }, [voteDetail.length, fetchVotes])

    const handleDeleteTask = useCallback(async (reason) => {
        try {
            const payload = {
                operationName: "deleteTask",
                variables: { taskId: taskId, reason: reason }
            }
            const response = await deleteTask(payload).unwrap()
            if (response?.data?.deleteTask?.status === 200) {
                ShowToast.success("Task moved to archive")
                setIsDeleteDialogOpen(false)
                afterDeleteRef.current?.()
            } else {
                ShowToast.error(response?.data?.deleteTask?.message || "Could not delete the task")
            }
        } catch (error) {
            ShowToast.error(`Something is wrong, Please check after sometime ${error}`)
        }
    }, [taskId, deleteTask])

    const handleCopyLink = useCallback(async () => {
        if (!taskUrl) {
            ShowToast.error("The project is still loading, please try again")
            return
        }
        try {
            await navigator.clipboard.writeText(taskUrl)
            ShowToast.success("Link copied")
        } catch {
            // The clipboard is blocked outside a secure context, so the user
            // gets told rather than seeing nothing happen.
            ShowToast.error("Could not copy the link")
        }
    }, [taskUrl])

    // The three dot menu in the header. Same list on both screens.
    const workItemMenuItems = useMemo(() => ([
        {
            id: task?.flagDetail?.isFlagged ? 'remove-flag' : 'add-flag',
            label: task?.flagDetail?.isFlagged ? 'Remove flag' : 'Add flag',
            onSelect: () => {
                if (task?.flagDetail?.isFlagged) removeFlag()
                else openFlagDialog()
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
            id: 'copy-link',
            label: 'Copy link',
            onSelect: handleCopyLink
        },
        {
            id: 'add-parent',
            label: task?.parentDetail ? "Change parent" : "Add parent",
            type: 'submenu',
            content: (
                <DynamicDropdownSelector
                    slug="parent"
                    onChange={(parent, { onClose } = {}) => {
                        handleSelectEpic(parent)
                        onClose?.()
                    }}
                    label="Select epic"
                    showDropdown
                />
            )
        },
        { id: 'clone', label: 'Clone' },
        { id: 'move', label: 'Move' },
        { id: 'archive', label: 'Archive' },
        {
            id: 'delete',
            label: 'Delete',
            danger: true,
            onSelect: () => setIsDeleteDialogOpen(true)
        },
        { type: 'separator' },
        { id: 'export-excel', label: 'Export excel' },
        { id: 'export-pdf', label: 'Export pdf' }
    ]), [
        task?.flagDetail?.isFlagged,
        task?.parentDetail,
        vote.hasVoted,
        removeFlag,
        openFlagDialog,
        handleToggleVote,
        handleCopyLink,
        handleSelectEpic
    ])

    // The plus button next to status and priority.
    const workRelatItem = useMemo(() => ([
        { id: 'create-sub-task', label: 'Create subtask' },
        {
            id: 'add-to-sprint',
            label: 'Add to sprint',
            type: 'submenu',
            content: (
                <DynamicDropdownSelector
                    slug="sprint"
                    onChange={(sprint, { onClose } = {}) => {
                        handleSprintChange(sprint)
                        onClose?.()
                    }}
                    label="Select sprint"
                    showDropdown
                />
            )
        },
        { id: 'link-work-item', label: 'Link work item' },
        { type: 'separator' },
        { id: 'add-attachement', label: 'Add atachement' },
        { id: 'add-weblink', label: 'Add weblink' }
    ]), [handleSprintChange])

    return {
        // data
        task,
        taskDetail,
        taskKey,
        taskUrl,
        taskFetching,
        taskSubmit,
        currentProject,
        projectSlug,
        templateSlug,
        userData,
        parentHeaderLabel,

        // form
        control,
        getValues,
        setValue,
        watch,

        // project template lists
        taskTypes,
        importanceTypes,
        renderIcon,

        // status and priority pickers
        activeDropdown,
        toggleTaskStatusDropdown,
        toggleImportanceDropdown,

        // summary editing
        isEditingSummary,
        setIsEditingSummary,
        tempSummary,
        setTempSummary,
        summaryRef,
        handleSaveSummary,

        // description editing
        isEditing,
        setIsEditing,
        handleSaveDescription,

        // details card
        expandDetails,
        setExpandDetails,

        // parent epic
        openParent,
        setOpenParent,
        handleSelectEpic,
        handleRemoveEpic,

        // field changes
        handleUpdateTask,
        changeTaskStatus,
        changeImportance,
        changeAssignee,
        changeLabels,
        changeTeam,
        changeReporter,
        changeDueDate,
        handleSprintChange,

        // votes
        vote,
        voteDetail,
        voteLoading,
        addVoteLoading,
        handleToggleVote,
        handleVoteOpen,

        // flag
        isFlagDialogOpen,
        setIsFlagDialogOpen,
        currentFlagTask,
        openFlagDialog,
        closeFlagDialog,
        confirmFlag,
        removeFlag,

        // delete
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        handleDeleteTask,
        deleteLoading,

        // menus and links
        workItemMenuItems,
        workRelatItem,
        handleCopyLink
    }
}

export default useTaskDetail
