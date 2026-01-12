import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { ChevronRight, MoreHorizontal, Pencil } from 'lucide-react';
import WorkSelector from '../common/WorkSelector';
import { useProjectData } from '@/hooks/useProjectData';
import TooltipWrapper from '../common/TooltipWrapper';
import ManageAvatar from '../common/ManageAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from '../ui/button';
import CommonDropdownMenu from '../common/CommonDropdownMenu'
import DynamicDropdownSelector from '../common/DynamicDropdownSelector';
import { DottedSeparator } from '../dotted-separator';
import ShowToast from '../common/ShowToast';
import { useUpdateIssueMutation } from '@/redux/graphql_api/task';
import { Input } from '../ui/input';
import { useUserData } from '@/hooks/useUserData';
import { useSearchParams } from 'react-router-dom';

const IssueRow = ({ issue }) => {
    const [updateTask, { isLoading }] = useUpdateIssueMutation()
    const [taskId, setTaskId] = useState(issue?._id || null)
    const { currentProject, workType, importance, workFlow } = useProjectData()
    const { userData } = useUserData()
    const [openAssignee, setOpenAssignee] = useState(false)
    const [currentAssignee, setCurrentAssignee] = useState(issue?.assigneeDetail || {})
    const [summaryValue, setSummaryValue] = useState(issue?.summary || '')
    const [isEditingSummary, setIsEditingSummary] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()

    console.log("currentAssignee", currentAssignee)
    const matchWorkType = workType.find(type => type.slug === issue?.work_type)

    const importanceType = useMemo(() => importance.map((imp, index) => ({
        id: index + 1,
        name: imp.name,
        value: imp.slug,
        color: imp.color
    })), [importance]);

    const taskTypes = useMemo(() => workFlow.map((status, index) => ({
        id: index + 1,
        name: status.name,
        value: status.slug,
        color: status.color
    })), [workFlow]);


    const workItemMenuItems = [
        {
            id: 'move-work-item',
            type: 'submenu',
            label: 'Move work item',
            items: [
                {
                    id: 'backlog',
                    label: 'Move to Backlog',
                    onSelect: () => console.log('Move to backlog')
                },
                {
                    id: 'sprint',
                    label: 'Move to Sprint X',
                    onSelect: () => console.log('Move to sprint')
                },
                { type: 'separator' },
                {
                    id: 'project',
                    label: 'Move to Project Y',
                    onSelect: () => console.log('Move to project')
                }
            ]
        },
        { type: 'separator' },
        {
            id: 'copy-link',
            label: 'Copy link',
            onSelect: () => copyLinkKey(true, false, issue._id, issue.project_key, issue.taskNumber, issue.work_type)
        },
        {
            id: 'copy-key',
            label: 'Copy key',
            onSelect: () => copyLinkKey(false, true, issue._id, issue.project_key, issue.taskNumber, issue.work_type)
        },
        { type: 'separator' },
        {
            id: 'add-flag',
            label: 'Add flag',
            onSelect: () => console.log('Add flag')
        },
        {
            id: 'parent',
            label: 'Parent',
            onSelect: () => console.log('Parent')
        },
        {
            id: 'delete',
            label: 'Delete',
            danger: true,
            onSelect: () => console.log('Delete')
        }
    ];

    useEffect(() => {
        setSummaryValue(issue?.summary || '')
        setTaskId(issue?._id || null)
    }, [issue.summary, issue._id])
    const handleUpdateTask = useCallback(async (key, value, id) => {
        try {
            const payload = {
                operationName: "updateTask",
                variables: {
                    taskId: id,
                    key: key,
                    value: value,
                    changeBy: userData?.member_id
                }
            }
            const response = await updateTask(payload).unwrap()
            console.log("response", response)
            return response;
        } catch (error) {
            console.log("error", error)
            throw error;
        }
    }, [updateTask, userData?.member_id]);

    const handleSummaryClick = (e) => {
        e.stopPropagation();
        setIsEditingSummary(true)
    }
    const handleSummaryChange = (e) => {
        setSummaryValue(e.target.value)
    }
    const saveSummaryAndClose = useCallback(async () => {
        const trimmedSummary = summaryValue.trim();

        if (!trimmedSummary || trimmedSummary === issue.summary) {
            setSummaryValue(issue.summary);
            setIsEditingSummary(false);
            return;
        }

        try {
            await handleUpdateTask('summary', trimmedSummary, taskId);
        } catch (error) {
            setSummaryValue(issue.summary);
            ShowToast.error("Failed to update summary.");
        } finally {
            setIsEditingSummary(false);
        }
    }, [summaryValue, issue.summary, taskId, handleUpdateTask]);
    const handleSummaryKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveSummaryAndClose()
        }
    }
    const handleAvatarClick = (e) => {
        e.stopPropagation()
        setOpenAssignee((val) => !val)
    }
    const handleAssigneeChange = (selectedMember) => {
        setCurrentAssignee(selectedMember)
        setOpenAssignee(false)
        const assignee = selectedMember?._id
        if (assignee !== issue?.assigneeDetail?._id) {
            handleUpdateTask('assigneeId', assignee, taskId)
        }
    }
    const handleSummaryBlur = (e) => {
        e.stopPropagation()
        saveSummaryAndClose()
    }
    const changeImportance = (imp) => {
        handleUpdateTask("importance", imp, taskId)
    }
    const changeTaskStatus = (status) => {
        handleUpdateTask("task_status", status, taskId)
    }
    const hasAssignee = Object.keys(currentAssignee).length > 0
    // useMemo(() => {
    //     issue?.assigneeDetail ? setManageAssingee(issue?.assigneeDetail) : setManageAssingee(selectedAssingee)
    // },[selectedAssingee, issue?.assigneeDetail])
    const copyLinkKey = (isLink, isKey, issueId, projectKey, taskNumber, type) => {

        let textToCopy;
        const taskIdentifier = `${projectKey}-${taskNumber}`;
        let message = ''
        if (isLink) {

            const baseUrl = window.location.origin;
            textToCopy = `${baseUrl}/${taskIdentifier}/${issueId}`;
            message = `You’ve copied the link to the ${type.charAt(0).toUpperCase() + type.slice(1)} ${projectKey}-${taskNumber} to your clipboard`
        } else if (isKey) {
            textToCopy = taskIdentifier;
            message = 'Key successfully copied to your clipboard'
        } else {
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                ShowToast.info(message)
                console.log(`${isLink ? 'Link' : 'Key'} copied: ${textToCopy}`);
            })
            .catch(err => {
                ShowToast.warning(err)
                console.error('Failed to copy text: ', err);
            });
    };
    const handleRowClick = (issue) => {
        // e.stopPropagation()
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("issueId", issue._id);
            return newParams;
        });
    };
    return (
        <TableRow
            className="group hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(issue)}
        >
            <TableCell className="text-center py-3 w-[15%]">
                <div className="flex items-center justify-center text-neutral-500 ">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${matchWorkType.color}`}>
                        <img
                            src={matchWorkType.icon}
                            className="w-4 h-4 filter brightness-0 invert"
                        />
                    </div>
                    <div className='underline hover:text-blue-600 text-base font-semibold'>
                        <span className={`inline-block w-2 h-2 rounded-full`} />
                        <span className="font-medium">{issue?.project_key}-{issue?.taskNumber}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="p-3 w-[50%]">
                <div className="flex items-center text-sm font-semibold text-neutral-500">
                    {isEditingSummary ? (
                        <Input
                            value={summaryValue}
                            onChange={handleSummaryChange}
                            onKeyDown={handleSummaryKeyDown}
                            onBlur={handleSummaryBlur}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="text-sm font-semibold border border-neutral-300 h-8 focus:none ring-none"
                        />
                    ) : (
                        <>
                            <span className="truncate hover:underline">{issue?.summary}</span>
                            {/* Edit Button - Visible on Row Hover */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                                onClick={handleSummaryClick}
                                title="Edit Summary"
                            >
                                <Pencil className="w-3 h-3 text-neutral-500" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-center p-3 w-[10%]">
                <div className="flex items-center justify-center">
                    <WorkSelector
                        initialValue={issue?.task_status}
                        workTypes={taskTypes}
                        onChange={changeTaskStatus}
                    />
                </div>
            </TableCell>
            <TableCell className="text-center p-3 w-[15%]">
                <div className="flex items-center justify-center">
                    <WorkSelector
                        initialValue={issue?.importance}
                        workTypes={importanceType}
                        onChange={changeImportance}
                    />
                </div>
            </TableCell>
            <TableCell className="text-center p-3 w-[5%]">
                <div className="flex items-center justify-center">
                    {/* Assignee Dropdown with Avatar Trigger */}
                    <DropdownMenu open={openAssignee} onOpenChange={setOpenAssignee}>
                        <DropdownMenuTrigger asChild>
                            <div
                                onClick={handleAvatarClick}
                                className="cursor-pointer"
                            >
                                {hasAssignee ? (
                                    <ManageAvatar
                                        firstName={currentAssignee?.first_name}
                                        lastName={currentAssignee?.last_name}
                                        image={currentAssignee?.image}
                                        size='sm'
                                        tooltipContent={`${currentAssignee?.first_name} ${currentAssignee?.last_name}`}
                                        showTooltip={!openAssignee}
                                    />
                                ) : (
                                    <ManageAvatar
                                        fallbackIcon={true}
                                        size='sm'
                                        tooltipContent="Unassigned"
                                        showTooltip={!openAssignee}
                                    />
                                )}
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
                                slug={'member'}
                                onChange={handleAssigneeChange}
                                label={"Select assignee"}
                                projectId={currentProject?._id}
                                showDropdown={true}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
            <TableCell className="text-center p-3 w-[5%]">
                <CommonDropdownMenu items={workItemMenuItems} />
            </TableCell>
        </TableRow>
    );
};

export default IssueRow;