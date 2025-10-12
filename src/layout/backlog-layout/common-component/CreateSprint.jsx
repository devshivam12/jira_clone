import React, { useEffect, useRef, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useCreateSprintMutation, useGetSprintByIdQuery, useUpdateSprintMutation } from '@/redux/graphql_api/sprint';
import ShowToast from '@/components/common/ShowToast';
import ButtonLoader from '@/components/ui/buttonLoader';
import { Loader2 } from 'lucide-react';

const formatTimeFromISO = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const CreateSprint = ({ isOpen, onClose, sprintId = null }) => {
  console.log("sprintId", sprintId)
  const { allProjects, currentProject } = useProjectData()
  const { userData } = useUserData()
  console.log("userData", userData)

  const [createSprint, { isLoading: createSprintLoading, isSuccess }] = useCreateSprintMutation()
  const [updateSprint, { isLoading: updateSprintLoading }] = useUpdateSprintMutation()

  const { data: getSprintDetails, isLoading: sprintLoading, isFetching, error: fetchingSprint } = useGetSprintByIdQuery(sprintId, {
    skip: !isOpen || sprintId === null
  })

  console.log("getSprintDetails", getSprintDetails)
  const sprint = getSprintDetails?.data?.getSprintById
  console.log("sprint", sprint)
  console.log("api is fail", fetchingSprint)
  const [duration, setDuration] = useState("custom")
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [startTimeSearch, setStartTimeSearch] = useState("")
  const [endTimeSearch, setEndTimeSearch] = useState("")
  const defaultStartTime = "12:00 AM";
  const defaultEndTime = "12:00 PM"
  const isInitialRender = useRef()
  const projectOptions = allProjects.map((item) => {
    return {
      value: item._id,
      label: item.name,
      icon: item.project_icon,
      isDefault: item._id === currentProject._id
    }
  })
  console.log("projectOptions", projectOptions)

  const { register, setValue, watch, getValues, handleSubmit, control, formState: { errors }, reset } = useForm({
    defaultValues: {
      projectId: currentProject?._id || "",
      name: "",
      startDate: null,
      endDate: null,
      expectedStartTime: null,
      expectedEndTime: null,
      goal: ""
    }
  });

  const durationOptions = [
    { value: "custom", label: "Custom", isDefault: true },
    { value: "1-week", label: "1 Week" },
    { value: "2-week", label: "2 Week" },
    { value: "3-week", label: "3 Week" },
    { value: "4-week", label: "4 Week" },
  ]
  console.log("durationOptions", durationOptions)
  const startDateWatcher = useWatch({ control, name: "startDate" });
  const endDateWatcher = useWatch({ control, name: "endDate" })

  useEffect(() => {
    if (sprint && sprintId) {

      reset({
        projectId: sprint?.projectId,
        name: sprint?.name,
        goal: sprint?.goal,
        startDate: sprint?.startDate ? new Date(sprint?.startDate) : null,
        endDate: sprint?.endDate ? new Date(sprint?.endDate) : null,
        expectedStartTime: formatTimeFromISO(sprint?.startDate),
        expectedEndTime: formatTimeFromISO(sprint?.endDate),
      });
    }
  }, [sprint, sprintId, reset]);

  useEffect(() => {
    if (currentProject?._id) {
      // setProjectValue(currentProject._id);
      setValue("projectId", currentProject._id);
    }
  }, [currentProject, setValue]);


  useEffect(() => {
    if (duration !== "custom" && startDateWatcher) {
      const baseDate = new Date(startDateWatcher);
      const newEndDate = new Date(baseDate);

      let daysToAdd = 0;
      if (duration === "1-week") daysToAdd = 7;
      else if (duration === "2-week") daysToAdd = 14;
      else if (duration === "3-week") daysToAdd = 21;
      else if (duration === "4-week") daysToAdd = 28;

      if (daysToAdd > 0) {
        newEndDate.setDate(baseDate.getDate() + daysToAdd);
        setValue("endDate", newEndDate, { shouldValidate: true });
      }
    }

    if (startDateWatcher && !getValues("expectedStartTime")) {
      setValue("expectedStartTime", defaultStartTime, { shouldValidate: true, shouldDirty: true })
    }

    if (endDateWatcher && !getValues("expectedEndTime")) {
      setValue("expectedEndTime", defaultEndTime, { shouldDirty: true, shouldValidate: true })
    }

  }, [duration, startDateWatcher, setValue, getValues, endDateWatcher]);


  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (duration === "custom") {
      setValue("endDate", null);
      setValue("expectedEndTime", null);
    }
  }, [duration, setValue])

  const onSubmit = async (data) => {
    console.log("Form data submitted (raw):", data);

    const combineDateTime = (dateObj, timeStr) => {
      if (!dateObj || !timeStr) return null;

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }

      const hoursStr = String(hours).padStart(2, '0');
      const minutesStr = String(minutes).padStart(2, '0');

      return `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00.000Z`;
    };

    try {
      const allVariables = {
        name: data.name,
        projectId: data.projectId,
        startDate: combineDateTime(data.startDate, data.expectedStartTime),
        endDate: combineDateTime(data.endDate, data.expectedEndTime),
        createdBy: userData.member_id,
        goal: data.goal,
      };

      if (sprintId && sprint) {
        const { projectId, createdBy, ...updatedVariables } = allVariables
        const payload = {
          operationName: "updateSprint",
          variables: {
            sprintId: sprintId,
            ...updatedVariables
          }
        };

        const updateResult = await updateSprint(payload).unwrap();
        console.log("updateSprint", updateResult);
        console.log("updateResult?.data?.updateSprint?.statusCode", updateResult?.data?.updateSprint?.statusCode)
        if (updateResult?.data?.updateSprint?.statusCode === 200 && updateResult?.data?.updateSprint?.success === true) {
          ShowToast.success(updateResult?.data?.updateSprint?.message, 2000);
          onClose();
        } else {
          ShowToast.error(updateResult?.data?.updateSprint?.message, 2000);
        }
      } else {
        const payload = {
          operationName: "createSprint",
          variables: allVariables
        }
        const result = await createSprint(payload);
        console.log("result for creating a sprint", result);

        const responseData = result.data.data.createSprint;
        if (responseData.statusCode === 200 || responseData.statusCode === 201) {
          ShowToast.success(responseData.message, 2000);
          onClose();
        } else {
          ShowToast.error(responseData.message, 2000);
        }
      }
    } catch (error) {
      console.log("Error submitting sprint:", error);
      ShowToast.error(error.message || "An unexpected error occurred.", 2000);
    }
  };

  const timeOptions = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const date = new Date(2000, 0, 1, hour, minute);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  const handleCancel = () => {
    if (!sprintId) { // Only reset if we are in "create" mode
      reset();
    }
    onClose(); // Always close the dialog
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleCancel()
      }}>
        <DialogContent className="sm:max-w-[600px] pointer-events-auto px-0 transition-none bg-neutral-100">
          <DialogHeader className="sticky top-0 px-4 pb-4 border-b">
            <DialogTitle className="text-neutral-500">Create</DialogTitle>
          </DialogHeader>
          {
            isFetching ? (
              <div className="flex items-center justify-center">
                <Loader2 className={cn(
                  "mr-2 animate-spin h-10 w-10 text-neutral-500"
                )} />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <ScrollArea className="h-72 ">

                  <div className="grid px-4 ">
                    {
                      !sprintId && (
                        <div className="flex items-start flex-col gap-y-2 mb-4">
                          <Label className={cn("text-neutral-600 text-sm font-normal", errors.projectId && "text-red-500")}>
                            Project <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="projectId"
                            control={control}
                            rules={{ required: "Project is required" }}
                            render={({ field }) => (
                              <AutoComplete
                                options={projectOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select project..."
                                searchPlaceholder="Search project..."
                                emptyMessage="No Project Found."
                                width='300px'
                              />
                            )}
                          />
                          {errors.projectId && <p className="text-red-600 font-medium text-xs">{errors.projectId.message}</p>}
                        </div>
                      )
                    }

                    <div className="flex items-start flex-col gap-y-2 mb-4">
                      <Label className="text-neutral-600 text-sm font-normal">
                        Sprint name
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Sprint name"
                        className="w-[300px] border-neutral-400/40 hover:bg-neutral-200/20"
                        {...register("name", { required: "Sprint name is required." })}
                      />
                      {errors.name && <p className="text-red-600 font-medium text-xs">{errors.name.message}</p>}
                    </div>

                    {!sprintId && (
                      <div className="flex items-start flex-col gap-y-2 mb-4">
                        <Label className="text-neutral-600 text-sm font-normal">
                          Duration

                        </Label>
                        <AutoComplete
                          options={durationOptions}
                          value={duration}
                          onChange={setDuration}
                          placeholder="Select duration time..."
                          searchPlaceholder="Search duration..."
                          emptyMessage="No Duration Found."
                          width='300px'
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-y-2 mb-4">
                      <Label className="text-neutral-600 text-sm font-normal">Start date <span className="text-red-500">*</span></Label>
                      <div className="flex w-[300px] border border-neutral-300 rounded-md overflow-hidden">
                        <Controller
                          name="startDate"
                          control={control}
                          rules={{ required: "Start date is required" }}
                          render={({ field }) => (
                            <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                              <PopoverTrigger asChild>
                                <button type="button" className="flex-1 p-2 text-neutral-600 font-normal text-left hover:bg-neutral-200/40">
                                  {field.value ? new Date(field.value).toLocaleDateString("en-US") : "03/03/2003"}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value ? new Date(field.value) : null} onSelect={(date) => { field.onChange(date); setOpenStartDate(false); }} />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        <div className="border-l border-neutral-300"></div>
                        <Controller
                          name="expectedStartTime"
                          control={control}
                          render={({ field }) => (
                            <Popover open={openStartTime} onOpenChange={setOpenStartTime}>
                              <PopoverTrigger asChild>
                                <button type="button" className="w-[140px] text-neutral-500 font-normal p-2 text-left hover:bg-neutral-200/40">
                                  {field.value || "12:00 AM/PM"}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[180px] p-0" align="start">
                                <div className="p-2 border-b bg-neutral-100">
                                  <Input
                                    placeholder="Search time..."
                                    value={startTimeSearch}
                                    onChange={(e) => setStartTimeSearch(e.target.value)}
                                    className="h-8 bg-neutral-100"
                                  />
                                </div>
                                <ScrollArea className="h-[15rem] bg-neutral-100">
                                  {timeOptions
                                    .filter(time => time.toLowerCase().includes(startTimeSearch.toLowerCase()))
                                    .map((time, i) => (
                                      <div
                                        key={i}
                                        onClick={() => { field.onChange(time); setOpenStartTime(false); setStartTimeSearch(""); }}
                                        className={cn(
                                          "relative px-3 py-2 cursor-pointer hover:bg-neutral-200",
                                          field.value === time && "bg-neutral-200/30 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border"
                                        )}>
                                        {time}
                                      </div>
                                    ))}
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      {errors.startDate && <p className="text-red-600 font-medium text-xs">{errors.startDate.message}</p>}
                    </div>

                    <div className="flex flex-col gap-y-2 mb-4">
                      <Label className="text-neutral-600 text-sm font-normal">End date <span className="text-red-500">*</span></Label>
                      <div className={cn("flex w-[300px] border border-neutral-300 rounded-md overflow-hidden", duration !== "custom" && "bg-neutral-200/30 cursor-not-allowed")}>
                        <Controller
                          name="endDate"
                          control={control}
                          rules={{
                            required: "End date is required.",
                            validate: value => {
                              const startDate = watch("startDate");
                              if (startDate && value) {
                                return new Date(value) >= new Date(startDate) || "End date cannot be before start date."
                              }
                              return true;
                            }
                          }}
                          render={({ field }) => (
                            <Popover open={openEndDate} onOpenChange={(open) => duration === "custom" && setOpenEndDate(open)}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex-1 p-2 text-left text-neutral-600 font-normal hover:bg-neutral-200/40 disabled:hover:bg-transparent"
                                  disabled={duration !== "custom" || !startDateWatcher}
                                  title={!startDateWatcher ? "Please select a start date first" : ""}
                                >
                                  {endDateWatcher ? new Date(endDateWatcher).toLocaleDateString("en-US") : "03/03/2003"}
                                </button>
                              </PopoverTrigger>
                              {duration === "custom" && (
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : null}
                                    onSelect={(date) => { field.onChange(date); setOpenEndDate(false); }}
                                    disabled={(date) => startDateWatcher && date < new Date(new Date(startDateWatcher).setHours(0, 0, 0, 0))}
                                  />
                                </PopoverContent>
                              )}
                            </Popover>
                          )}
                        />
                        <div className="border-l border-neutral-300"></div>
                        <Controller
                          name="expectedEndTime"
                          control={control}
                          render={({ field }) => (
                            <Popover open={openEndTime} onOpenChange={(open) => duration === "custom" && setOpenEndTime(open)}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-[140px] p-2 text-left text-neutral-500 font-normal hover:bg-neutral-200/40 disabled:hover:bg-transparent"
                                  disabled={duration !== "custom" || !startDateWatcher}
                                  title={!startDateWatcher ? "Please select a start date first" : ""}
                                >
                                  {field.value || "12:00 AM/PM"}
                                </button>
                              </PopoverTrigger>
                              {duration === "custom" && (
                                <PopoverContent className="w-[180px] p-0" align="start">
                                  <div className="p-2 border-b bg-neutral-100">
                                    <Input
                                      placeholder="Search time..."
                                      value={endTimeSearch}
                                      onChange={(e) => setEndTimeSearch(e.target.value)}
                                      className="h-8 bg-neutral-100"
                                    />
                                  </div>
                                  <ScrollArea className="h-[15rem] bg-neutral-100">
                                    {timeOptions
                                      .filter(time => time.toLowerCase().includes(endTimeSearch.toLowerCase()))
                                      .map((time, i) => (
                                        <div
                                          key={i}
                                          onClick={() => { field.onChange(time); setOpenEndTime(false); setEndTimeSearch(""); }}
                                          className={cn(
                                            "relative px-3 py-2 cursor-pointer hover:bg-neutral-200",
                                            field.value === time && "bg-neutral-200/30 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border"
                                          )}>
                                          {time}
                                        </div>
                                      ))}
                                  </ScrollArea>
                                </PopoverContent>
                              )}
                            </Popover>
                          )}
                        />
                      </div>
                      {errors.endDate && <p className="text-red-600 font-medium text-xs">{errors.endDate.message}</p>}
                    </div>



                    <div className="flex items-start flex-col gap-y-2 mb-4">
                      <Label className="text-neutral-600 text-sm font-normal">
                        Sprint goal
                      </Label>
                      <Textarea
                        id="message"
                        className="shadow-sm border border-neutral-300 hover:bg-neutral-200/20"
                        {...register('goal')}
                      />
                    </div>

                  </div>
                </ScrollArea>
                <DialogFooter className="px-4 border-t pt-4 mb-0">
                  {
                    (!sprintId && sprint) ? (
                      <div className='flex items-center justify-end gap-2'>
                        <ButtonLoader
                          variant="default"
                          type="button"
                          onClick={handleCancel}
                          className="w-full"
                        >
                          Cancle
                        </ButtonLoader>
                        <ButtonLoader
                          variant="teritary"
                          type="submit"
                          isLoading={createSprintLoading}
                          // size="md"
                          className="w-full"
                        >
                          Create
                        </ButtonLoader>

                      </div>
                    ) : (
                      <div className='flex items-center justify-end gap-2'>
                        <ButtonLoader
                          variant="default"
                          type="button"
                          // size="sm"
                          onClick={handleCancel}
                          className="w-full"
                        >
                          Cancle
                        </ButtonLoader>
                        <ButtonLoader
                          variant="teritary"
                          type="submit"
                          isLoading={updateSprintLoading}
                          // size="md"
                          className="w-full"
                        >
                          Update
                        </ButtonLoader>

                      </div>
                    )
                  }
                </DialogFooter>
              </form>
            )
          }
        </DialogContent>
      </Dialog >
    </>
  );
};

export default CreateSprint;