import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DottedSeparator } from '@/components/dotted-separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Epic from './Epic';
import Sprint from './Sprint';
import CreateBacklog from './CreateBacklog';
import { Search } from 'lucide-react';

const randomData = [
  { first_name: "Shivam" },
  { first_name: "Mittal" },
  { first_name: "SM" }
];

const Backlog = () => {
  const [isExpand, setIsExpand] = useState(false);
  const [showEpic, setShowEpic] = useState(false);

  return (
    <div>
      {/* Title */}
      <h1 className="text-neutral-500 text-2xl font-semibold mb-4">Backlog</h1>

      {/* Search & Avatars */}
      <div>
        <div className="flex items-center gap-x-4">
          {/* Search Box */}
          <div className='flex items-center justify-between space-x-1 relative'>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search size={15} className="text-neutral-500" />
            </div>
            <Input
              type="text"
              placeholder="Search"
              className={`px-8 pl-8 w-40 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 hover:bg-neutral-100 ${isExpand ? 'w-52' : 'w-40'}`}
              onFocus={() => setIsExpand(true)}
              onBlur={() => setIsExpand(false)}
            />
          </div>

          {/* Multiple Avatars */}
          <div className="flex -space-x-1">
            {randomData.map((user, index) => (
              <Avatar key={index} className="size-10 border border-neutral-300 hover:opacity-75 transition">
                <AvatarFallback className="bg-neutral-200 font-medium text-neutral-600 flex items-center justify-center cursor-pointer">
                  {user.first_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Select Dropdown for Epic */}
          <div>
            <Select>
              <SelectTrigger className="w-full px-5 py-2 rounded-md hover:bg-neutral-100 transition focus:outline-none">
                <SelectValue placeholder="Epic" />
                <SelectContent className="w-full mt-2 bg-white shadow-sm rounded-md border border-neutral-300 z-10">
                  <div className="p-3">
                    <p className="text-neutral-600 font-medium text-sm">Your project has no Epic</p>
                  </div>
                  <DottedSeparator className="my-1" />
                  <div className="flex items-center gap-x-2 p-3">
                    <Switch id="show-epic" onClick={() => setShowEpic(prev => !prev)} />
                    <Label htmlFor="show-epic" className="text-sm font-medium text-neutral-800">Show Epic</Label>
                  </div>
                </SelectContent>
              </SelectTrigger>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex justify-between my-7">
        <div>{showEpic && <Epic />}</div>
        <div className="space-y-6 w-full overflow-y-auto max-h-[350px]">
          <div className='w-full'>
            <Sprint />
          </div>
          <div className='w-full'>
            <CreateBacklog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backlog;
