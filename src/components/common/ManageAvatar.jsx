import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const ManageAvatar = ({ firstName, lastName, image, size = '' }) => {
    const sizeClasses = {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        
    };

    const fontSizeClass = {
        xs: 'text-normal',
        sm: 'text-base',
        md: 'text-2xl',
        lg: 'text-2xl',
    }

    const initials = `${firstName?.charAt(0)?.toUpperCase() || ''}${lastName?.charAt(0)?.toUpperCase() || ''}`;

    return (
        <Avatar className={sizeClasses[size] || sizeClasses.md}>
            {image ? (
                <AvatarImage 
                    src={image} 
                    alt={`${firstName} ${lastName}`} 
                    className="object-cover w-full h-full"
                />
            ) : null}
            <AvatarFallback className={`bg-neutral-200 text-neutral-600 font-medium flex items-center justify-center 
          ${fontSizeClass[size] || fontSizeClass.md}`}>
                {initials}
            </AvatarFallback>
        </Avatar>
    )
}

export default ManageAvatar