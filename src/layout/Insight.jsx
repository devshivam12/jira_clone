import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCcw } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FeedbackForm from './FeedbackForm'
import TooltipWrapper from '@/components/common/TooltipWrapper'
import SidePanel from '@/components/common/SidePanel'

const previousSprint = [
    { title: "sprint_1", value: "SCRUM Sprint 1" },
    { title: "sprint_2", value: "SCRUM Sprint 2" }
]

const Insight = ({ openInsight, setOpenInsight }) => {
    const [selectedValue, setSelectedValue] = useState(previousSprint[0].value)

    const refreshAction = (
        <TooltipWrapper content="Refresh">
            <button
                aria-label="Refresh insights"
                className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
                <RefreshCcw size={17} />
            </button>
        </TooltipWrapper>
    );

    return (
        <SidePanel title="Backlog Insights" onClose={() => setOpenInsight(false)} actions={refreshAction}>
            <div className="p-5 space-y-4">
                <div>
                    <p className='text-neutral-500 text-sm font-normal'>Use these insights to plan your next sprint.</p>
                </div>

                <div className='flex items-center gap-2'>
                    <span className='text-neutral-500 font-semibold text-sm'>Sprint:</span>
                    <Select defaultValue={selectedValue} onValueChange={setSelectedValue}>
                        <SelectTrigger className="h-9 w-36 bg-neutral-100 border-none shadow-none rounded-md">
                            <SelectValue placeholder="Select Sprint">
                                {previousSprint.find(sprint => sprint.value === selectedValue)?.title}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-36 pt-0 bg-white shadow-sm rounded-md">
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

                <Card className="border border-neutral-200 bg-neutral-50 rounded-lg shadow-none">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-neutral-700 font-medium text-sm">
                            Sprint commitment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-3">
                        <p className='text-neutral-600 font-normal text-xs text-justify'>
                            Add estimates to plan sprints with more accuracy.
                            This insight compares how much effort was allocated to a sprint against how much was completed, so you can plan sprints more effectively.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 bg-neutral-50 rounded-lg shadow-none">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-neutral-700 font-medium text-sm">
                            Issue type breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-3">
                        <p className='text-neutral-600 font-normal text-xs text-justify'>
                            Your top issue type to focus on in this sprint.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 bg-neutral-50 rounded-lg shadow-none">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="shadow-none">
                            <FeedbackForm />
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </SidePanel>
    )
}

export default Insight
