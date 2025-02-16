import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

const progressTask = [
  { title: "Progress", color: "bg-neutral-500", value: "0" },
  { title: "In progress", color: "bg-blue-500", value: "1" },
  { title: "Done", color: "bg-green-500", value: "2" },
];

const CreateBacklog = () => {
  const [isExpand, setIsExpand] = useState(false);
  const [createIssue, setCreateIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const inputRef = useRef(null);
  const selectRef = useRef(null);

  const showInputBox = () => {
    setCreateIssue(true);
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if the click is outside both the input container and the select dropdown
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) && // Not inside input container
        selectRef.current &&
        !selectRef.current.contains(event.target) // Not inside select dropdown
      ) {
        setCreateIssue(false); // Close the input box
      }
    }

    if (createIssue) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [createIssue]);

  return (
    <Card className="w-full bg-neutral-100 shadow-sm rounded-lg p-4 min-h-[100px] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardHeader
          onClick={() => setIsExpand(prev => !prev)}
          className="p-0 cursor-pointer w-full transition-all duration-300"
        >
          <CardTitle className="flex items-center gap-2 w-full text-neutral-700 font-medium text-md transition hover:text-neutral-900">
            {isExpand ? (
              <ChevronDown size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            ) : (
              <ChevronRight size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            )}
            <span>Backlog</span>
            <span className="text-xs text-neutral-500 font-normal">(0 issues)</span>
          </CardTitle>
        </CardHeader>

        <div className='flex items-center gap-4'>
          {/* Status Indicators */}
          <div className="flex gap-x-2">
            {progressTask.map((item, index) => (
              <div key={index} className={`w-6 h-6 flex items-center justify-center text-white text-sm font-light ${item.color} rounded-full shadow-md`}>
                {item.value}
              </div>
            ))}
          </div>
          <div>
            <Button variant="teritary" className="font-semibold text-sm">
              Create sprint
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {isExpand && (
        <CardContent className="flex flex-col items-center transition-all duration-300 p-0 mt-4">
          {/* Description */}
          <div className='w-full border-2 border-dashed border-neutral-300 p-4 rounded-lg'>
            <div className='flex items-center justify-center min-h-16'>
              <p className="text-neutral-700 font-normal text-sm">
                Your backlog is empty
              </p>
            </div>
          </div>

          {/* Create Issue Button */}
          {!createIssue ? (
            <div className="mt-6 w-full">
              <Button
                variant="default"
                className="w-full flex items-center justify-start"
                onClick={showInputBox}
              >
                <Plus className="mr-2" size={20} />
                <span className="text-sm">Create issue</span>
              </Button>
            </div>
          ) : (
            <div className="mt-6 w-full" ref={inputRef}>
              {/* Issue Type Selector & Input Field */}
              <div className='flex items-center justify-start gap-2'>
                <div ref={selectRef} data-select-dropdown>
                  <Select>
                    <SelectTrigger className="w-full px-5 py-2 rounded-md hover:bg-neutral-100 transition focus:outline-none">
                      <SelectValue placeholder="Select Epic" />
                    </SelectTrigger>
                    <SelectContent className="w-full mt-2 bg-white shadow-sm rounded-md border border-neutral-300 z-10">
                      <SelectGroup>
                        <SelectLabel>Issue Type</SelectLabel>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="text"
                  className="w-full flex items-center justify-start"
                  placeholder="What needs to be done"
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CreateBacklog;