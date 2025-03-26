import { DottedSeparator } from '@/components/dotted-separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'
import React from 'react'

const fields = [
    { title: "Issue type", swtich_id: "issue_type" },
    { title: "Issue key", swtich_id: "issue_key" },
    { title: "Epic", swtich_id: "epic" },
    { title: "Status", swtich_id: "status" },
    { title: "Assigne", swtich_id: "assigne" }
]

const BacklogLayoutSetting = ({ backlogSetting, setBacklogSetting, setShowEpic }) => {
    return (
        <div className='w-full h-full'>

            <Card className="flex flex-col rounded-sm bg-neutral-100 w-[300px] overflow-y-auto h-auto shadow-none border border-neutral-300">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-neutral-800">
                        View Settings
                        <X
                            className='flex items-center justify-center w-9 h-9 py-0 px-2 rounded-sm hover:bg-neutral-200 font-normal text-neutral-500 cursor-pointer'
                            onClick={() => setBacklogSetting(prev => !prev)}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent className="shadow-none">
                    <div className='flex items-center justify-between'>
                        <p className='text-neutral-500 text-sm font-semibold'>Epic panel</p>
                        <Switch id="show-epic" onClick={() => setShowEpic(prev => !prev)} />
                    </div>
                    <DottedSeparator className="my-5" />

                    <div>
                        <p className='font-semibold text-md mb-4'>Fields</p>
                    </div>

                    <div>
                        {
                            fields.map((field, index) => (
                                <div key={index} className='flex items-center justify-between space-y-4'>
                                    <p className='text-neutral-500 text-sm font-semibold'>
                                        {field.title}
                                    </p>
                                    <Switch id={field.swtich_id} />
                                </div>
                            ))
                        }
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

export default BacklogLayoutSetting
