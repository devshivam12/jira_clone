import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '@/lib/utils'

const WorkspaceAvatar = ({ image, name, className }) => {
    if (image) {
        return (
            <div className={cn(
                "size-10 relative rounded-md overflow-hidden flex",
                className
            )}>
                <img src={image} alt={name} fill className="object-cover" />
            </div>
        )
    }
    return (
        <Avatar className={
            cn("size-10 rounded-md", className)
        }>
            <AvatarFallback className="text-white bg-blue-600 rounded-md font-semibold text-lg uppercase">
                {name[0]}
            </AvatarFallback>
        </Avatar>
    )
}

export default WorkspaceAvatar
