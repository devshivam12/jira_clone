import { Controller } from 'react-hook-form'

import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector'
import LabelSelector from '@/components/common/LabelSelector'
import { Label } from '@/components/ui/label'

// Assignee, labels, team and reporter. These four are the same on the drawer
// and on the full page, only the box around them changes, so they live here and
// each screen supplies its own wrapper.
const TaskPeopleFields = ({
    control,
    changeAssignee,
    changeLabels,
    changeTeam,
    changeReporter
}) => {
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm text-neutral-600 font-medium">Assignee</Label>
                <Controller
                    name="assigneeDetail"
                    control={control}
                    render={({ field }) => (
                        <DynamicDropdownSelector
                            slug="member"
                            value={field.value}
                            onChange={changeAssignee}
                            label="Select assignee"
                        />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
                <Label className="text-sm text-neutral-600 font-medium">Labels</Label>
                <Controller
                    name="labels"
                    control={control}
                    render={({ field }) => (
                        <LabelSelector onChange={changeLabels} value={field.value} />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-sm text-neutral-600 font-medium">Team</Label>
                <Controller
                    name="teamDetail"
                    control={control}
                    render={({ field }) => (
                        <DynamicDropdownSelector
                            slug="team"
                            value={field.value}
                            onChange={changeTeam}
                            label="Choose a team"
                        />
                    )}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-sm text-neutral-600 font-medium">Reporter</Label>
                <Controller
                    name="reporterDetail"
                    control={control}
                    render={({ field }) => (
                        <DynamicDropdownSelector
                            slug="member"
                            value={field.value}
                            onChange={changeReporter}
                            label="Add repoter"
                        />
                    )}
                />
            </div>
        </>
    )
}

export default TaskPeopleFields
