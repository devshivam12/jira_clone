import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectData } from '@/hooks/useProjectData';
import AutoComplete from '@/components/ui/autocomplete';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUserData } from '@/hooks/useUserData';
import { Controller, useForm, useWatch } from 'react-hook-form';
import ShowToast from '@/components/common/ShowToast';
import ButtonLoader from '@/components/ui/buttonLoader';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DottedSeparator } from '@/components/dotted-separator';
import { Badge } from '@/components/ui/badge';
import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector';
import { useGetAllMemberListQuery } from '@/redux/api/company/team';
import LabelSelector from '@/components/common/LabelSelector';
import { useCreateTaskMutation } from '@/redux/graphql_api/task';
import UtilityStaticDropdown from '@/components/common/UtilityDropdownSelector';

const CreateTask = ({ isOpen, onClose, allProjects, currentProject, workType, workFlow, templateData, userData }) => {

    // const { allProjects, currentProject, workType, workFlow, templateData } = useProjectData()
    console.log("templateData", templateData)
    // const { userData } = useUserData()
    console.log("userData", userData)

    const [createTask, { isLoading: taskLoading }] = useCreateTaskMutation()

    const [openETA, setOpenETA] = useState(false);
    const [leaderValue, setLeaderValue] = useState(null)
    const [reporterValue, setReporterValue] = useState(null)
    const [sprintValue, setSprintValue] = useState(null)
    const [parentValue, setParentValue] = useState(null)
    const [teamValue, setTeamValue] = useState(null)
    const [label, setLabel] = useState(null)
    const [projectId, setProjectId] = useState(currentProject._id)

    const [searchTerm, setSearchTerm] = useState('');
    const [localUserData, setLocalUserData] = useState(null);

    console.log("workType", workType)
    const projectOptions = allProjects.map((item) => {
        return {
            value: item._id,
            label: item.name,
            icon: item.project_icon,
            isDefault: item._id === currentProject._id
        }
    })
    console.log("projectOptions", projectOptions)
    const workTypeOptions = workType.map((item) => {
        return {
            value: item.slug,
            label: item.name,
            icon: item.icon,
            color: item.color,
            isDefault: item.slug === 'epic'
        }
    })

    const taskImportance = templateData?.fields?.importance.map((item) => {
        return {
            value: item.slug,
            label: item.name,
            color: item.color,
            isDefault: item.slug === 'high'
        }
    })
    console.log("taskImportance", taskImportance)
    const workFlowOptions = workFlow.map((item) => {
        return {
            value: item.slug,
            label: item.name,
            icon: item.icon,
            color: item.color,
            isDefault: item.slug === 'to_do'
        }
    })
    console.log("workFlowOptions", workFlowOptions)
    const { register, setValue, watch, getValues, handleSubmit, control, formState: { errors }, reset } = useForm({
        defaultValues: {
            projectId: currentProject?._id || "",
            work_type: "",
            task_status: "",
            summary: null,
            description: null,
            assigneeId: null,
            labels: [],
            teamId: null,
            sprintId: null,
            importance: "",
            createdBy: null,
            reporterId: null,
        }
    });
    const watchProjectId = useWatch({ control, name: 'projectId' })
    useEffect(() => {
        if (currentProject?._id) {
            const defaultProjectId = currentProject._id;
            setValue("projectId", defaultProjectId);
            setProjectId(defaultProjectId);
        }
    }, [currentProject, setValue]);

    useEffect(() => {
        if (!isOpen) {
            // Reset form
            reset({
                projectId: currentProject?._id || "",
                work_type: "",
                task_status: "",
                summary: null,
                description: null,
                assigneeId: null,
                labels: [],
                teamId: null,
                sprintId: null,
                importance: "",
                createdBy: null,
                reporterId: null,
            });

            // Reset local state
            setLeaderValue(null);
            setReporterValue(null);
            setSprintValue(null);
            setTeamValue(null);
            setLabel(null);
            setProjectId(currentProject._id);
            setOpenETA(false);
        }
    }, [isOpen, reset, currentProject]);

    const onSubmit = async (data) => {
        try {
            const taskData = {
                ...data,
                labels: label,
                assigneeId: leaderValue,
                reporterId: reporterValue,
                sprintId: sprintValue?._id,
                parentId : parentValue?._id,
                teamId: teamValue?._id,
                createdBy: userData?.member_id
            };
            const payload = {
                operationName: 'createTask',
                query: `mutation CreateTask(
                            $projectId: ID!
                            $work_type: String
                            $task_status: String
                            $summary: String
                            $assigneeId: String
                            $description: String
                            $labels: [String]
                            $teamId: String
                            $sprintId: String
                            $importance: String
                            $reporterId: String
                            $createdBy : String
                            $startDate: Date
                            $dueDate: Date
                        ){
                            createTask(
                            projectId: $projectId
                            work_type: $work_type
                            task_status: $task_status
                            summary: $summary
                            description: $description
                            labels: $labels
                            teamId: $teamId
                            sprintId: $sprintId
                            assigneeId: $assigneeId
                            importance: $importance
                            reporterId: $reporterId
                            createdBy: $createdBy
                            startDate: $startDate
                            dueDate: $dueDate
                        ) {
                            status
                            message
                            data {
                                    id
                                    name
                                    description
                                    status
                                    summary
                                    labels
                                }
                            }
                        }`,
                variables: taskData
            }
            console.log("taskData", taskData)
            const result = await createTask(payload).unwrap()
            console.log("result", result)
            console.log("result?.data?.data", result?.data)
            if (result?.data?.createTask?.status === 201) {
                ShowToast.success(result?.data?.createTask?.message)
                onClose()
            } else {
                ShowToast.error(result?.data?.createTask?.message)
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error(error?.message)
        }
    }
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px] pointer-events-auto px-0 transition-none bg-neutral-50">
                    <DialogHeader className="sticky top-0 px-4 pb-4 border-b">
                        <DialogTitle className="text-neutral-500 pb-0 mb-0">Create</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ScrollArea className="h-72 ">

                            <div className="grid px-4 ">
                                <div className='mb-4'>
                                    <Label className="text-neutral-600 text-sm font-light">
                                        Required fields are marked with an asterisk <span className="text-red-500">*</span>
                                    </Label>
                                </div>
                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className={cn("text-neutral-600 text-sm font-normal", errors.projectId && "text-red-500")}>
                                        Project <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="projectId"
                                        control={control}
                                        rules={{ required: "Project is required" }}
                                        render={({ field }) => (
                                            <UtilityStaticDropdown
                                                data={projectOptions}
                                                label="Select Project"
                                                onChange={(value) => {
                                                    field.onChange(value.value)
                                                    setProjectId(value?.value)
                                                }}
                                                iconType='avatar'
                                            />
                                        )}
                                    />
                                    {errors.projectId && <p className="text-red-600 font-medium text-xs">{errors.projectId.message}</p>}
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className={cn("text-neutral-600 text-sm font-normal", errors.work_type && "text-red-500")}>
                                        Work type <span className="text-red-500">*</span>
                                    </Label>
                                    {/* <div className={`w-7 h-7 rounded-md flex items-center justify-center ${epicColor}`}>
                                            <img
                                                src={epicIcon}
                                                className="w-4 h-4 filter brightness-0 invert"
                                            />
                                        </div> */}
                                    <Controller
                                        name="work_type"
                                        control={control}
                                        rules={{ required: "Work type is required" }}
                                        render={({ field }) => (
                                            <UtilityStaticDropdown
                                                data={workTypeOptions}
                                                label="Select work type"
                                                onChange={(value) => field.onChange(value.value)}
                                                iconType='icon'
                                            />
                                        )}
                                    />
                                    {errors.work_type && <p className="text-red-600 font-medium text-xs">{errors.work_type.message}</p>}
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className={cn("text-neutral-600 text-sm font-normal", errors.task_status && "text-red-500")}>
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="task_status"
                                        control={control}
                                        rules={{ required: "task status is required" }}
                                        render={({ field }) => (
                                            <UtilityStaticDropdown
                                                data={workFlowOptions}
                                                label="Select task status"
                                                onChange={(value) => {
                                                    field.onChange(value.value)
                                                }}
                                                iconType='contain'
                                            />
                                        )}
                                    />

                                    {errors.task_status && <p className="text-red-600 font-medium text-xs">{errors.task_status.message}</p>}
                                </div>


                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className={cn("text-neutral-600 text-sm font-normal", errors.importance && "text-red-500")}>
                                        Task importance <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="importance"
                                        control={control}
                                        rules={{ required: "Work type is required" }}
                                        render={({ field }) => (
                                            <UtilityStaticDropdown
                                                data={taskImportance}
                                                label="Select task importacne"
                                                onChange={(value) => field.onChange(value.value)}
                                                iconType='contain'
                                            />
                                        )}
                                    />
                                    {errors.importance && <p className="text-red-600 font-medium text-xs">{errors.importance.message}</p>}
                                </div>

                                <DottedSeparator className=" mt-4 mb-4" />

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Summary
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        // placeholder="Task name"
                                        className="border-neutral-400/40 hover:bg-neutral-200/20"
                                        {...register("summary", { required: "Summary is required" })}
                                    />
                                    {errors.summary && <p className="text-red-600 font-medium text-xs">{errors.summary.message}</p>}
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="message"
                                        className="shadow-sm border border-neutral-300 hover:bg-neutral-200/20"
                                        {...register('description')}
                                    />
                                </div>


                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Assignee
                                    </Label>
                                    <DynamicDropdownSelector
                                        slug={'member'}
                                        onChange={setLeaderValue}
                                        label={"Select assignee"}
                                        projectId={projectId}
                                    />
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Labels
                                    </Label>
                                    <LabelSelector onChange={setLabel} />
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Team
                                    </Label>
                                    <DynamicDropdownSelector
                                        slug={'team'}
                                        onChange={setTeamValue}
                                        label={"Choose a team"}
                                    />
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Parent
                                    </Label>
                                    <DynamicDropdownSelector
                                        slug={'parent'}
                                        onChange={setParentValue}
                                        label={"Select parent"}
                                        projectId={projectId}
                                    />
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Sprint
                                    </Label>
                                    <DynamicDropdownSelector
                                        slug={'sprint'}
                                        onChange={setSprintValue}
                                        label={"Select sprint"}
                                        projectId={watchProjectId}
                                    />
                                </div>


                                <div className="flex flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">Expected end date</Label>
                                    <div className="flex w-[300px] border border-neutral-300 rounded-md overflow-hidden">
                                        <Controller
                                            name="startDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover open={openETA} onOpenChange={setOpenETA}>
                                                    <PopoverTrigger asChild>
                                                        <button type="button" className="flex-1 p-2 text-neutral-600 font-normal text-left hover:bg-neutral-200/40">
                                                            {field.value ? new Date(field.value).toLocaleDateString("en-US") : "03/03/2003"}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value ? new Date(field.value) : null} onSelect={(date) => { field.onChange(date); setOpenETA(false); }} />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />

                                    </div>
                                </div>

                                <div className="flex items-start flex-col gap-y-2 mb-4">
                                    <Label className="text-neutral-600 text-sm font-normal">
                                        Reporter
                                    </Label>
                                    <DynamicDropdownSelector
                                        slug={'member'}
                                        onChange={setReporterValue}
                                        label={"Select reporter"}
                                        projectId={projectId}
                                    />
                                </div>

                            </div>
                        </ScrollArea>
                        <DialogFooter className="px-4 border-t pt-4 mb-0">
                            <div className='flex items-center justify-end gap-2'>
                                <ButtonLoader
                                    variant="default"
                                    type="button"
                                    // onClick={handleCancel}
                                    disable={taskLoading}
                                    className="w-full"
                                    onClick={() => onClose()}
                                >
                                    Cancle
                                </ButtonLoader>
                                <ButtonLoader
                                    variant="teritary"
                                    type="submit"
                                    isLoading={taskLoading}
                                    className="w-full"
                                >
                                    Create
                                </ButtonLoader>

                            </div>

                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >
        </>
    );
};

export default CreateTask;