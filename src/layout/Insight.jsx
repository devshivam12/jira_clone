import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCcw, X } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FeedbackForm from './FeedbackForm'
import TooltipWrapper from '@/components/common/TooltipWrapper'

const previousSprint = [
    { title: "sprint_1", value: "SCRUM Sprint 1" },
    { title: "sprint_2", value: "SCRUM Sprint 2" }
]

const Insight = ({ openInsight, setOpenInsight }) => {
    const [open, setOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(previousSprint[0].value)
    const [selectedFeedback, setSelectedFeedback] = useState("")
    return (
        <Card 
        className='flex flex-col rounded-sm bg-neutral-100 shadow-neutral-200  overflow-y-auto max-h-[350px]'
        style={{
            scrollbarWidth: 'none',  /* Firefox */
            msOverflowStyle: 'none',  /* IE and Edge */
        }}
        > 
            <CardHeader className="py-2 px-2" >
                <CardTitle className='flex items-center justify-between text-neutral-800'>
                    Backlog Insights
                    <div className='flex items-center font-normal text-neutral-500 text-sm'>
                        <TooltipWrapper content="refresh">
                            <RefreshCcw className='flex items-center justify-center w-9 h-9 py-0 px-2 rounded-sm hover:bg-neutral-200 cursor-pointer' />
                        </TooltipWrapper>



                        <TooltipWrapper content="close">
                            <X
                                onClick={() => setOpenInsight(false)}
                                className='flex items-center justify-center w-9 h-9 py-0 px-2 rounded-sm hover:bg-neutral-200 cursor-pointer'
                            />
                        </TooltipWrapper>

                    </div>
                </CardTitle>
                <div className='my-1'>
                    <p className='text-neutral-500 text-sm font-normal'>Use these insights to plan your next sprint.</p>
                </div>
                <div className='flex items-center'>
                    <span className='text-neutral-500 font-semibold text-sm '>Sprint:</span>
                    <Select
                        defaultValue={selectedValue} onValueChange={setSelectedValue}
                    >
                        <SelectTrigger className="border-none shadow-none w-28">
                            <SelectValue placeholder="Select Sprint">
                                {previousSprint.find(sprint => sprint.value === selectedValue)?.title}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-28 pt-0 bg-white shadow-sm rounded-md">
                            <SelectGroup>
                                {previousSprint.map((sprint, index) => (
                                    <SelectItem key={index} value={sprint.value}>
                                        {sprint.title}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 px-2 [&::-webkit-scrollbar]:hidden">
                <Card className="border-none bg-neutral-200 rounded-sm shadow-none outline-none">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-neutral-700 font-normal text-md">
                            Sprint commitment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className=" pb-2 px-3">
                        <p className='text-neutral-600 font-normal text-xs text-justify'>
                            Add estimates to plan sprints with more accuracy
                            This insight compares how much effort was allocated to a sprint against how much was completed, so you can plan sprints more effectively.
                        </p>

                    </CardContent>
                </Card>
                <Card className="border-none bg-neutral-200 rounded-sm shadow-none outline-none">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-neutral-700 font-normal text-md">
                            Issue type breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className=" pb-2 px-3">
                        <p className='text-neutral-600 font-normal text-xs text-justify'>
                            Your top issue type to focus on in this sprint.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-neutral-200 rounded-sm shadow-none outline-none">
                    <CardHeader className="py-2 shadow-none px-3">
                        <CardTitle className="shadow-none">
                            <FeedbackForm />
                        </CardTitle>
                    </CardHeader>
                </Card>
            </CardContent>
        </Card>
    )
}

export default Insight
