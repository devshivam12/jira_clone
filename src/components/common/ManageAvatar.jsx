import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import TooltipWrapper from '../common/TooltipWrapper';

const ManageAvatar = ({ 
    firstName, 
    lastName, 
    image, 
    size = '', 
    fallbackIcon = false, 
    avatarContent = '',
    showTooltip = true, // Control whether to show tooltip
    tooltipContent = '', // Custom tooltip content
}) => {
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

    const iconSizeClass = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
    };

    const initials = `${firstName?.charAt(0)?.toUpperCase() || ''}${lastName?.charAt(0)?.toUpperCase() || ''}`;
    const getTooltipText = () => {
        // If custom tooltip content is provided, use it
        if (tooltipContent) {
            return tooltipContent;
        }

        // Generate from firstName and lastName
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        
        if (fullName) {
            return fullName;
        }

        // If no name data, don't show tooltip
        return null;
    };

    const tooltipText = getTooltipText();

    // Avatar component JSX
    const avatarComponent = (
        <Avatar className={sizeClasses[size] || sizeClasses.md}>
            {image ? (
                <AvatarImage
                    src={image}
                    alt={`${firstName || ''} ${lastName || ''}`}
                    className="object-cover w-full h-full"
                />
            ) : null}
            <AvatarFallback className={`bg-neutral-200 text-neutral-600 font-medium flex items-center justify-center 
                ${fontSizeClass[size] || fontSizeClass.md}`}>
                {
                    initials ? (
                        initials
                    ) : fallbackIcon ? (
                        <User size={iconSizeClass[size] || iconSizeClass.md} className="text-neutral-500" />
                    ) : (
                        'U'
                    )
                }
            </AvatarFallback>
        </Avatar>
    );

    // Conditionally wrap with tooltip
    if (showTooltip && tooltipText) {
        return (
            <TooltipWrapper content={tooltipText} direction='bottom'>
                {avatarComponent}
            </TooltipWrapper>
        );
    }

    // Return avatar without tooltip
    return avatarComponent;
}

export default ManageAvatar;