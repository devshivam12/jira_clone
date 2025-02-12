import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { DottedSeparator } from '@/components/dotted-separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


const randomData = [
  { first_name: "Shivam" },
  { first_name: "Mittal" },
  { first_name: "SM" }
];

// const usualData = [
//   {name : Epic}
// ]

const Backlog = () => {
  const [userData, setUserData] = useState(JSON.parse(localStorage.getItem("userData")) || {});
  const [isExpand, setIsExpand] = useState(false)

  return (
    <div>
      {/* Title */}
      <h1 className="text-neutral-500 text-2xl font-semibold mb-4">Backlog</h1>

      {/* Search & Avatars */}
      <div>
        <div className="flex items-center gap-x-4">
          {/* Search Box */}
          <Input
            type="text"
            placeholder="Search"
            className={`px-2 w-40 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition hover:bg-neutral-100 ${isExpand === true ? 'w-52 transition-all' : 'w-40 transition-all'}`}
            onFocus={() => setIsExpand(true)}
            onBlur={() => setIsExpand(false)}
          />

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
          {/* for showcasing epic */}

          <div>
            <Select>
              <SelectTrigger className="w-full hover:bg-neutral-100 font-medium px-10">
                <SelectValue placeholder="Epic" />
                <SelectContent className="py-2 px-5" >
                  <div>
                    <p className='text-neutral-600 font-normal text-sm'>Your project has no Epic</p>
                  </div>

                  <DottedSeparator className="my-1" />

                  <div>
                    <Switch id="show-epic" />
                    <Label htmlFor="show-epic">Show Epic</Label>
                  </div>
                </SelectContent>
              </SelectTrigger>
            </Select>
          </div>

          <div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Backlog;
