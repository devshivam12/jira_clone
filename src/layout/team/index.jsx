import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import React from 'react'

const Team = () => {
  return (
    <div className=''>
      {/* Title */}
      <div className='flex items-center justify-between'>
        <h1 className="text-neutral-500 text-2xl font-semibold">Team</h1>
        <div className='flex items-center gap-2'>
          <Button variant="outline">Manage users</Button>
          <Button variant="outline">Create team</Button>
          <Button variant="teritary">Add people</Button>
        </div>
      </div>
      <div className='w-full mt-7'>
        <div className='flex items-center justify-between space-x-1 relative'>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search size={15} className="text-neutral-500" />
          </div>
          <Input
            type="text"
            placeholder="Search teams and members"
            className="px-8 pl-8 py-6 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 hover:bg-neutral-100"
          />
        </div>
      </div>

      <div>
        
      </div>
    </div>
  )
}

export default Team
