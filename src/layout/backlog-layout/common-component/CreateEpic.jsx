import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectData } from '@/hooks/useProjectData';
import  AutoComplete  from '@/components/ui/autocomplete';

const CreateEpic = ({ isOpen, onClose }) => {
  const { allProjects, currentProject } = useProjectData()
  const [projectValue, setProjectValue] = useState("")
  const projectOptions = allProjects.map((item) => {
    return {
      value: item._id,
      label: item.name,
      icon: item.project_icon,
      isDefault: item._id === currentProject._id
    }
  })
  console.log("projectOptions", projectOptions)

  const [search, setSearch] = useState("")

  const filteredProjects = allProjects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] pointer-events-auto px-0 transition-none bg-neutral-100" forceMount>
          <DialogHeader className="sticky top-0 px-4 pb-4 border-b">
            <DialogTitle className="text-neutral-500">Create</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-72 ">

            <div className="grid px-4 ">
              <div className="flex items-start flex-col gap-y-2 mb-4">
                <Label className="text-neutral-600 text-sm font-normal">
                  Project
                  <span className="text-red-500">*</span>
                </Label>
                <AutoComplete
                  options={projectOptions}
                  value={projectValue}
                  onChange={setProjectValue}
                  placeholder="Select project..."
                  searchPlaceholder="Search project..."
                  emptyMessage="No Project Found."
                  width='300px'
                />
              </div>

              <div className="flex items-start flex-col gap-y-2 mb-4">
                <Label className="text-neutral-600 text-sm font-normal">
                  Sprint name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Sprint name"
                  className="w-72 border-neutral-400/40"
                />
              </div>

              <div className="flex items-start flex-col gap-y-2 mb-4">
                <Label className="text-neutral-600 text-sm font-normal">
                  Duration
                  <span className="text-red-500">*</span>
                </Label>
                <AutoComplete
                  options={projectOptions}
                  value={projectValue}
                  onChange={setProjectValue}
                  placeholder="Select project..."
                  searchPlaceholder="Search project..."
                  emptyMessage="No Project Found."
                  width='300px'
                />
              </div>
            </div>
          </ScrollArea>


          <DialogFooter className="px-6">
            <Button variant="teritary" type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
};

export default CreateEpic;