import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const ManageAvatar = ({ firstName, lastName, image }) => {

    console.log("firstName", firstName)
    console.log("lastName", lastName)
    const initials = `${firstName.charAt(0).toUpperCase() || ''}`;

    return (
        <Avatar className="h-8 w-8">
            {image ? (
                <AvatarImage 
                    src={image} 
                    alt={`${firstName} ${lastName}`} 
                    className="object-cover"
                />
            ) : null}
            <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-medium">
                {initials}
            </AvatarFallback>
        </Avatar>
    )
}

export default ManageAvatar
