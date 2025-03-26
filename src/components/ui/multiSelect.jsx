import { memo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "./badge";
import { DottedSeparator } from "../dotted-separator";

const MultiSelect = memo(({ options, setOptions, selectedValues, setSelectedValues }) => {
  // const [options, setOptions] = useState([]);

  // const [selectedValues, setSelectedValues] = useState([]);
  const [newOption, setNewOption] = useState("");

  const handleItemClick = (value) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleAddOption = (e) => {
    e.preventDefault();
    if (newOption.trim() === "") return;
    const newEntry = { value: newOption.toLowerCase(), label: newOption };

    // Check if the option already exists
    if (!options.some((opt) => opt.value === newEntry.value)) {
      setOptions([...options, newEntry]);
    }

    setNewOption(""); // Clear input field, but DON'T auto-select
  };

  console.log("options", options)

  return (
    <div className="w-full">
      {/* Dropdown Button */}
      <Popover className="relative z-50">
        <PopoverTrigger asChild className="flex items-center justify-start w-full px-2 py-4">
          <Button variant="default" className="w-full flex flex-wrap items-start h-full px-3 py-2 rounded-sm text-neutral-500 justify-start"
          >
            {
              selectedValues?.length === 0 ? (
                <span className="text-neutral-500">
                  None
                </span>
              ) :
                (
                  <div className="flex flex-wrap gap-2 w-full">
                    {
                      selectedValues?.map((value) => {
                        const selectedOption = options?.find((option) => option.value === value);
                        return (
                          <div
                            key={value}
                            className=""
                          >
                            <Badge
                              className="flex shadow-none border border-neutral-400 items-center gap-2 px-2 py-2 bg-neutral-200 text-neutral-500 hover:bg-neutral-300"
                            >{selectedOption?.label}
                              <X
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleItemClick(value)
                                }}
                                size={14}
                                className="cursor-pointer"
                              />
                            </Badge>
                          </div>
                        );
                      })
                    }
                  </div>
                )

            }

          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 z-[1000] pointer-events-auto" side="bottom" align="start" sideOffset={4} forceMount>
          {/* Input to Add Custom Values */}
          <form className="mt-2 z-50 relative" onSubmit={handleAddOption}>
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add new option..."
              className="border border-neutral-500 z-[100] pointer-events-auto px-3 py-2 rounded-md transition focus:outline-none focus:ring-none"
            />
            <div className="flex items-center justify-end mt-2 gap-1">
              <Button variant="default" type="submit" className="w-8 cursor-pointer h-8 px-2 py-1 bg-neutral-200 rounded-sm">
                <Check size={16} />
              </Button>
              <Button 
              variant="default" 
              className="w-8 cursor-pointer h-8 px-2 py-1 bg-neutral-200 rounded-sm"
              onClick={() => setNewOption("")}
              >
                <X size={16} />
              </Button>
            </div>
          </form>
          <DottedSeparator className="mt-2" />
          {/* Scrollable Area for Selecting Options */}
          <ScrollArea className="max-h-60 overflow-y-auto mt-2">
            {options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-2">
                <Checkbox
                  checked={selectedValues?.includes(option.value)}
                  onCheckedChange={() => handleItemClick(option.value)}
                />
                <label className="cursor-pointer">{option.label}</label>
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default MultiSelect