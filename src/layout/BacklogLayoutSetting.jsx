import { DottedSeparator } from '@/components/dotted-separator'
import { Switch } from '@/components/ui/switch'
import { LayoutList, LayoutGrid } from 'lucide-react'
import React from 'react'
import SidePanel from '@/components/common/SidePanel'

const fields = [
    { title: "Issue type", swtich_id: "issue_type", defaultChecked: true },
    { title: "Issue key", swtich_id: "issue_key", defaultChecked: true },
    { title: "Epic", swtich_id: "epic", defaultChecked: false },
    { title: "Status", swtich_id: "status", defaultChecked: true },
    { title: "Assignee", swtich_id: "assignee", defaultChecked: true }
]

const BacklogLayoutSetting = ({ backlogSetting, setBacklogSetting, setShowEpic, showEpic, viewMode = 'list', setViewMode }) => {
    return (
        <SidePanel title="View settings" onClose={() => setBacklogSetting(false)}>
            <div className="p-5 space-y-6">

                {/* Layout View Toggle */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Layout</p>
                    <div className="flex p-1 bg-neutral-100 rounded-lg">
                        <button
                            onClick={() => setViewMode?.('list')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <LayoutList size={16} />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode?.('board')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <LayoutGrid size={16} />
                            Board
                        </button>
                    </div>
                </div>

                <DottedSeparator />

                {/* Epic Panel Toggle */}
                <div className="space-y-3">
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-neutral-800'>Epic panel</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Show epics alongside the backlog</p>
                        </div>
                        <Switch id="show-epic" checked={showEpic} onCheckedChange={(checked) => setShowEpic(checked)} />
                    </div>
                </div>

                <DottedSeparator />

                {/* Fields List */}
                <div className="space-y-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Fields</p>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={index} className='flex items-center justify-between group'>
                                <label htmlFor={field.swtich_id} className='text-sm font-medium text-neutral-700 cursor-pointer group-hover:text-neutral-900 transition-colors'>
                                    {field.title}
                                </label>
                                <Switch id={field.swtich_id} defaultChecked={field.defaultChecked} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SidePanel>
    )
}

export default BacklogLayoutSetting
