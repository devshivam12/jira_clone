import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import EpicImage from '../../assets/epic-image.svg'
import InlineCreateTaskRow from '@/components/data-table/inline-create-task-row'

const Epic = ({ showEpic, setShowEpic, projectData }) => {
    const { currentProject, workFlow, importance } = projectData || {};
    const currentProjectId = currentProject?._id;

    const [showCreateRow, setShowCreateRow] = useState(false);

    const taskTypes = useMemo(() =>
        (workFlow || []).map((status, index) => ({
            id: index + 1,
            name: status.name,
            value: status.slug,
            color: status.color
        })),
        [workFlow]
    );

    const importanceTypes = useMemo(() =>
        (importance || []).map((imp, index) => ({
            id: index + 1,
            name: imp.name,
            value: imp.slug,
            color: imp.color
        })),
        [importance]
    );

    return (
        <div className='w-full h-full'>
            <Card className="w-full sm:max-w-md lg:w-[250px] h-auto bg-neutral-100 shadow-sm rounded-lg py-2 px-3 border border-neutral-200">
                <div className="flex items-center justify-between">
                    <CardHeader className="px-0 py-0">
                        <CardTitle className="font-semibold text-neutral-700">
                            Epic
                        </CardTitle>
                    </CardHeader>
                    <X
                        className="cursor-pointer p-1 rounded-md hover:bg-neutral-200 hover:text-neutral-700 hover:scale-105"
                        onClick={() => setShowEpic(prev => !prev)}
                    />

                </div>
                <CardContent className="overflow-y-auto max-h-[350px]" style={{
                    scrollbarWidth: 'none',  /* Firefox */
                    msOverflowStyle: 'none',  /* IE and Edge */
                }}>
                    <div className='w-24 mt-10 mx-auto'>
                        <img src={EpicImage} />
                    </div>
                    <div className="text-center mt-8">
                        <p className='text-neutral-700 font-normal text-sm'>
                            Plan and prioritize large chunks of work.
                            <br className='my-2' />
                            Create your first epic to start capturing and breaking down work for your team.
                        </p>
                    </div>

                    {showCreateRow ? (
                        <div className='mt-6 rounded-md border border-neutral-200 bg-white'>
                            <InlineCreateTaskRow
                                projectId={currentProjectId}
                                workType="epic"
                                statusOptions={taskTypes}
                                importanceOptions={importanceTypes}
                                onClose={() => setShowCreateRow(false)}
                            />
                        </div>
                    ) : (
                        <div
                            className='mt-10 cursor-pointer py-2 px-2 hover:bg-neutral-200 rounded-sm'
                            onClick={() => setShowCreateRow(true)}
                        >
                            <p className='flex items-center justify-center gap-2'>
                                <Plus className='text-neutral-500' size={20} />
                                <span className='text-sm '>Create Epic</span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default Epic
