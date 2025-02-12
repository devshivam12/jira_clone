import React from 'react'
import { RiAddCircleFill } from 'react-icons/ri'
import { useGetWorkSpaceDataQuery } from '@/redux/api/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import WorkspaceAvatar from './layout/WorkspaceAvatar'


const WorkspaceSwitcher = () => {
  const { data: workspace } = useGetWorkSpaceDataQuery()
  return (
    <div className="flex flex-col ">
      <div className="space-y-2">
        <div className='flex items-center justify-start gap-x-2'>
          <p className="text-xs uppercase text-neutral-500">Workspaces</p>
          <RiAddCircleFill className='size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition' />
        </div>
        <Select>
          <SelectTrigger className="w-full bg-neutral-200 font-medium p-1">
            <SelectValue placeholder="No workspace selected" />
            <SelectContent>
              {workspace?.data.map((workspaces, index) => (
                <SelectItem
                  key={index}
                  value={index}
                >
                  <div className='flex justify-center items-center gap-3 font-medium'>
                    <WorkspaceAvatar name={workspaces.workspace_name} image={workspaces.image} />
                    <span className='truncate'>
                      {workspaces.workspace_name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectTrigger>
        </Select>
      </div>
    </div>
  )
}

export default WorkspaceSwitcher
