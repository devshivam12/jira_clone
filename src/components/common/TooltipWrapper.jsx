import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

const TooltipWrapper = ({ children, content, delay = 100, className }) => {
    return (
        <TooltipProvider delayDuration={delay}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent className={className}>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipWrapper
