import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { ChevronRight, Flag, MoreHorizontal, Pencil } from 'lucide-react';
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

import { useSearchParams } from 'react-router-dom';
import AddFlag from '../common/AddFlag';

const IssueRow = ({ issue, projectData, onUpdateTask, rowClick }) => {
    const [taskId, setTaskId] = useState(issue?._id || null)
    const { currentProject, workType, importance, workFlow } = projectData
    const [openAssignee, setOpenAssignee] = useState(false)
    const [currentAssignee, setCurrentAssignee] = useState(issue?.assigneeDetail || {})
    const [summaryValue, setSummaryValue] = useState(issue?.summary || '')
    const [isEditingSummary, setIsEditingSummary] = useState(false)

    const [isAddFlagOpen, setIsFlagOpen] = useState(false)
    const [isFlagged, setIsFlagged] = useState(false)

    const [taskInfo, setTaskInfo] = useState({
        _id: issue?._id,
        workType: issue?.work_type,
        project_key: issue?.project_key,
        taskNumber: issue?.taskNumber,
        summary: issue?.summary
    })

    const addFlagRef = useRef(null)

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
                    onSelect: (e) => {
                        e?.stopPropagation?.();
                        console.log('Move to backlog')
                    }
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
            id: `${issue?.isFlagged === true || issue?.isFlagged === 'true' ? 'remove-flag' : 'add-flag'}`,
            label: `${issue?.isFlagged === true || issue?.isFlagged === 'true' ? 'Remove flag' : 'Add flag'}`,
            onSelect: (e) => {
                e?.stopPropagation?.();
                if (issue?.isFlagged === true || issue?.isFlagged === 'true') {
                    addFlagRef.current?.handleAddFlag(false)
                } else {
                    // Open popup to add flag
                    setIsFlagOpen(true)
                    setIsFlagged(true)
                }
            }
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
            await onUpdateTask('summary', trimmedSummary, taskId);
        } catch (error) {
            setSummaryValue(issue.summary);
            ShowToast.error("Failed to update summary.");
        } finally {
            setIsEditingSummary(false);
        }
    }, [summaryValue, issue.summary, taskId, onUpdateTask]);
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
            onUpdateTask('assigneeId', assignee, taskId)
        }
    }
    const handleSummaryBlur = (e) => {
        e.stopPropagation()
        saveSummaryAndClose()
    }
    const changeImportance = (imp) => {
        onUpdateTask("importance", imp, taskId)
    }
    const changeTaskStatus = (status) => {
        onUpdateTask("task_status", status, taskId)
    }
    const hasAssignee = Object.keys(currentAssignee).length > 0

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

    return (
        <TableRow
            className={`group cursor-pointer transition-colors
            ${issue?.isFlagged
                    ? 'bg-red-50/60 shadow-[inset_0_0_0_1px_theme(colors.red.500)]'
                    : 'hover:bg-gray-50'}
          `}
            onClick={(e) => rowClick(e, issue._id)}
        >

            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">
                <div className="flex items-center justify-start text-neutral-500 ">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${matchWorkType.color}`}>
                        <img
                            src={matchWorkType.icon}
                            loading="lazy"
                            alt={matchWorkType.name}
                            className="w-4 h-4 filter brightness-0 invert"
                            decoding="async"
                        />
                    </div>
                    <div className='underline hover:text-blue-600 text-base font-semibold'>
                        <span className={`inline-block w-2 h-2 rounded-full`} />
                        <span className="font-medium">{issue?.project_key}-{issue?.taskNumber}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="w-auto p-2">
                <div className="flex items-center text-sm font-semibold text-neutral-500" data-no-row-click>
                    {isEditingSummary ? (
                        <Input
                            value={summaryValue}
                            onChange={handleSummaryChange}
                            onKeyDown={handleSummaryKeyDown}
                            onBlur={handleSummaryBlur}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="h-8"
                        />
                    ) : (
                        <>
                            <span
                                className="truncate max-w-full"
                                title={issue?.summary}
                            >
                                {issue?.summary}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="ml-2 w-6 h-6 opacity-0 group-hover:opacity-100"
                                onClick={handleSummaryClick}
                            >
                                <Pencil className="w-3 h-3" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>


            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">

                <div className="flex items-center justify-start" data-no-row-click>
                    <WorkSelector
                        initialValue={issue?.task_status}
                        workTypes={taskTypes}
                        onChange={changeTaskStatus}
                    />
                </div>
            </TableCell>

            <TableCell className="w-[160px] min-w-[160px] max-w-[160px] p-2">

                <div className="flex items-center justify-start" data-no-row-click>
                    <WorkSelector
                        initialValue={issue?.importance}
                        workTypes={importanceType}
                        onChange={changeImportance}
                    />
                </div>
            </TableCell>

            <TableCell className="w-[60px] min-w-[60px] max-w-[60px] text-center p-2">
                <div
                    data-no-row-click
                    className="flex justify-center items-center"
                >
                    {issue?.isFlagged && (
                        <div>
                            <Flag
                                className="text-red-500"
                                size={14}
                                fill="currentColor"
                            />
                        </div>
                    )}
                </div>
            </TableCell>


            <TableCell className="w-[80px] min-w-[80px] max-w-[80px] text-center p-2">

                <div className="flex items-center justify-center" data-no-row-click>
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



            <TableCell className="w-[56px] min-w-[56px] max-w-[56px] text-center p-2">
                <div data-no-row-click onClick={(e) => e.stopPropagation()}>

                    <CommonDropdownMenu items={workItemMenuItems} />
                    <AddFlag ref={addFlagRef} isOpen={isAddFlagOpen} setIsOpen={setIsFlagOpen} taskInfo={taskInfo} isFlagged={isFlagged} />
                </div>
            </TableCell>
        </TableRow>
    );
};

export default React.memo(IssueRow);