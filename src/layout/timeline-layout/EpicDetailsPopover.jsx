import React, { useMemo, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateIssueMutation } from "@/redux/graphql_api/task";
import { useUpdateDependenciesMutation } from "@/redux/graphql_api/timeline";
import ShowToast from "@/components/common/ShowToast";
import { EPIC_COLOR_SWATCHES } from "./epicColors";

// Rendered inside a Popover anchored to an EpicBar. Lets the user recolor
// the bar and edit which other epics it depends on.
const EpicDetailsPopover = ({ epic, allEpics, onChanged, onClose }) => {
  const [updateIssue] = useUpdateIssueMutation();
  const [updateDependencies] = useUpdateDependenciesMutation();
  const [search, setSearch] = useState("");

  const selectedDependencyIds = useMemo(
    () => new Set((epic.dependsOn || []).map((d) => d._id)),
    [epic.dependsOn]
  );

  const dependencyOptions = useMemo(
    () => (allEpics || []).filter((e) => e._id !== epic._id),
    [allEpics, epic._id]
  );

  const handleColorSelect = async (color) => {
    if (color === epic.color) return;
    try {
      await updateIssue({
        operationName: "updateTask",
        variables: { taskId: epic._id, key: "color", value: color },
      }).unwrap();
      onChanged?.();
    } catch (error) {
      ShowToast.error(error?.message || "Could not update color");
    }
  };

  const toggleDependency = async (depId) => {
    const next = selectedDependencyIds.has(depId)
      ? [...selectedDependencyIds].filter((id) => id !== depId)
      : [...selectedDependencyIds, depId];

    try {
      const result = await updateDependencies({
        operationName: "updateDependencies",
        variables: { taskId: epic._id, dependsOn: next },
      }).unwrap();
      const response = result?.data?.updateDependencies;
      if (response?.status !== 200) {
        ShowToast.error(response?.message || "Could not update dependencies");
        return;
      }
      onChanged?.();
    } catch (error) {
      ShowToast.error(error?.message || "Could not update dependencies");
    }
  };

  return (
    <div className="w-72">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-neutral-800 leading-snug">{epic.summary}</p>
        <button type="button" onClick={onClose} className="shrink-0 text-neutral-400 hover:text-neutral-600">
          <X size={14} />
        </button>
      </div>

      <div className="mb-3">
        <p className="text-xs font-medium text-neutral-500 mb-1.5">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {EPIC_COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => handleColorSelect(color)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                color,
                epic.color === color ? "border-neutral-800" : "border-transparent"
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1.5">Depends on</p>
        <Command className="border border-neutral-200 rounded-md">
          <CommandInput placeholder="Search epics..." value={search} onValueChange={setSearch} className="h-8 text-sm" />
          <CommandList className="max-h-40">
            <CommandEmpty className="py-3 text-xs text-neutral-500 text-center">No epics found</CommandEmpty>
            <CommandGroup>
              {dependencyOptions.map((opt) => (
                <CommandItem key={opt._id} onSelect={() => toggleDependency(opt._id)} className="text-sm">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedDependencyIds.has(opt._id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.summary}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};

export default EpicDetailsPopover;
