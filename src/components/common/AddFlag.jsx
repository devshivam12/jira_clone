import React, { forwardRef, useImperativeHandle } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/Button'
import RichTextEditor from '../ui/richTextEditor'
import { useProjectData } from '@/hooks/useProjectData'
import ShowToast from './ShowToast'
import { useAddFlagMutation } from '@/redux/graphql_api/miscData'
import { useForm, Controller } from 'react-hook-form'
import ButtonLoader from '../ui/buttonLoader'
import { useDispatch, useSelector } from 'react-redux'
import { taskApi } from '@/redux/graphql_api/task'

const AddFlag = forwardRef(({ isOpen, setIsOpen, taskInfo, isFlagged }, ref) => {
    const taskQuery = useSelector((state) => state.taskSlice.taskListQuery)
    console.log("taskQuery", taskQuery)
    const [addFlag, { isLoading }] = useAddFlagMutation()
    const { workType } = useProjectData()
    const dispatch = useDispatch()
    const matchWorkType = workType.find(
        type => type.slug === taskInfo?.workType
    )

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            reason: ''
        }
    })

    const handleAddFlag = async (data, isFlagged) => {
        try {
            console.log("taskInfo", taskInfo)
            const payload = {
                operationName: "addFlag",
                variables: {
                    taskId: taskInfo?._id,
                    flagPayload: {
                        isFlagged: isFlagged,
                        ...(isFlagged === 'true' || isFlagged === true ? { reason: data.reason } : {})
                    }
                }
            }

            const response = await addFlag(payload).unwrap()
            console.log("response", response)
            if (response?.data?.addFlag?.status === true) {
                reset()
                setIsOpen(false)
                dispatch(
                    taskApi.util.updateQueryData(
                        'getBacklogList',
                        { operationName: "getBacklogData", variables: { taskId: taskId } },
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
            }
        } catch (error) {
            ShowToast.error("Something went wrong on our end. Please try again shortly.")
            console.log("error", error)
        }
    }

    useImperativeHandle(ref, () => ({
        handleAddFlag: (flagStatus) => handleAddFlag({}, flagStatus)
    }))

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                reset()
            }
            setIsOpen(open)
        }}>
            <DialogContent className="sm:max-w-2xl">

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-x-2 flex-wrap">
                        <span className="text-neutral-500 font-medium">Add Flag</span>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${matchWorkType?.color}`}>
                            <img
                                src={matchWorkType?.icon}
                                className="w-3 h-3 filter brightness-0 invert"
                            />
                        </div>

                        <span className="text-neutral-500 text-base font-medium">
                            {taskInfo?.project_key} - {taskInfo?.taskNumber}
                        </span>

                        <span className="text-neutral-500 text-base font-medium">
                            {taskInfo?.summary?.length > 20
                                ? taskInfo.summary.slice(0, 20) + "..."
                                : taskInfo?.summary}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit((data) => handleAddFlag(data, isFlagged))}>

                    <div className="mt-2">
                        <Controller
                            name="reason"
                            control={control}
                            rules={{
                                required: "Flag description is required",
                                minLength: {
                                    value: 10,
                                    message: "Please enter at least 10 characters"
                                }
                            }}
                            render={({ field }) => (
                                <RichTextEditor
                                    content={field.value}
                                    onChange={field.onChange}
                                    placeholder="Write flag description..."
                                    minHeight="150px"
                                />
                            )}
                        />

                        {errors.reason && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.reason.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>

                        <ButtonLoader
                            type="submit"
                            variant="teritary"
                            size="sm"
                            isLoading={isLoading}
                        >
                            Add Flag
                        </ButtonLoader>
                    </div>

                </form>

            </DialogContent>
        </Dialog>
    )
})

export default AddFlag
