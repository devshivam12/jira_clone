import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Plus, X, Pen, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '../../components/ui/select'

const progressTask = [
  { title: "Progress", color: "bg-neutral-500", value: "0" },
  { title: "In progress", color: "bg-blue-500", value: "1" },
  { title: "Done", color: "bg-green-500", value: "2" },
];

const Sprint = () => {
  const [isExpand, setIsExpand] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [startDate, setStartDate] = useState()
  const [endDate, setEndDate] = useState()
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [createIssue, setCreateIssue] = useState(false)


  const handleCardHeaderClick = (e) => {
    if (!e.target.closest('.drawer-trigger')) {
      setIsExpand((prev) => !prev);
    }
  };

  const handleDurationChange = (value) => {
    setSelectedDuration(value === selectedDuration ? null : value);
  };

  return (
    <Card className="w-full bg-neutral-100 shadow-sm rounded-lg p-4 min-h-[100px] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardHeader
          onClick={handleCardHeaderClick} // Handle header click
          className={`p-0 cursor-pointer ${isExpand ? 'w-full' : 'w-full'} transition-all duration-300`}
        >
          <CardTitle className="flex items-center gap-2 w-full text-neutral-700 font-medium text-md transition hover:text-neutral-900">
            {isExpand ? (
              <ChevronDown size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            ) : (
              <ChevronRight size={17} className="text-neutral-500 transition-transform duration-200 hover:scale-110" />
            )}
            <div className='flex items-center gap-3'>
              <span>SCRUM Sprint 1</span>

              {/* Drawer trigger with stopPropagation to prevent the card expansion */}
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <span
                    className="flex items-center gap-2 text-neutral-500 font-normal text-sm hover:bg-neutral-200 py-1 px-2 cursor-pointer drawer-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Pen size={12} /> Add dates
                  </span>
                </DrawerTrigger>
                <DrawerContent className="w-1/3 m-auto" onClick={(e) => e.stopPropagation()}>
                  <DrawerHeader className="text-left mt-2">
                    <DrawerTitle className="mb-2">Edit sprint: SCRUM Sprint 1</DrawerTitle>
                    <DrawerDescription className="">
                      Required fields are marked with an asterisk *.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-5 ">
                    <form action="" className=" space-y-3">
                      <div className='w-1/2'>
                        <div>
                          <Label>Sprint name</Label>
                          <Input type="text" placeholder="Enter sprint name" />
                        </div>

                        <div>
                          <Label>
                            Duration
                          </Label>
                          <Select >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Custome" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="1 week">1 Week</SelectItem>
                                <SelectItem value="2 weeks">2 Weeks</SelectItem>
                                <SelectItem value="3 weeks">3 Weeks</SelectItem>
                                <SelectItem value="4 weeks">4 Weeks</SelectItem>
                                <SelectItem value="custome">Custome</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Start date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Input
                                type="text"
                                placeholder="Enter start date"
                                value={startDate ? format(startDate, "PPP") : null}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                        </div>

                        <div>
                          <Label>End date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Input
                                type="text"
                                placeholder="Enter end date"
                                value={endDate ? format(endDate, "PPP") : null}
                              />
                            </PopoverTrigger>
                            <PopoverContent>
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>


                      </div>

                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">Sprint goal</Label>
                        <Textarea placeholder="Type your description here." id="message" className="min-h-24" />
                      </div>
                    </form>
                  </div>
                  <DrawerFooter className="pt-2">
                    <div className='flex items-center justify-end gap-2'>
                      <DrawerClose asChild >
                        <Button variant="secondary">Cancel</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="teritary">Update</Button>
                      </DrawerClose>
                    </div>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <span className="text-xs text-neutral-500 font-normal">(0 issues)</span>
            </div>
          </CardTitle>
        </CardHeader>

        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="flex gap-x-2">
            {progressTask.map((item, index) => (
              <div
                key={index}
                className={`w-6 h-6 flex items-center justify-center text-white text-sm font-light ${item.color} rounded-full shadow-md`}
              >
                {item.value}
              </div>
            ))}
          </div>
          <div>
            <Button variant="teritary" className="font-semibold text-sm">
              Start sprint
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {isExpand && (
        <CardContent className="flex flex-col items-center transition-all duration-300 p-0 my-2">
          {/* Description */}
          <div className="w-full border-2 border-dashed border-neutral-300 p-4 rounded-lg">
            <div className="flex items-center justify-center min-h-32">
              <p className="text-neutral-700 font-normal text-sm">
                Your backlog is empty
              </p>
            </div>
          </div>
          {/* Create Epic Button */}
          <div className="mt-6 w-full">
            <Button variant="default" className="w-full flex items-center justify-start">
              <Plus className="mr-2" size={20} />
              <span className="text-sm">Create issue</span>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default Sprint;
