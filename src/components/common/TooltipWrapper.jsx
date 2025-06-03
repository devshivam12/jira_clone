import React from 'react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider
} from "@/components/ui/tooltip";

const TooltipWrapper = ({
    children,
    content,
    delay = 100,
    className = "",
    direction = "top" // default direction
}) => {
    // Map direction to side and align for the TooltipContent
    const directionMap = {
        top: { side: "top", align: "center" },
        bottom: { side: "bottom", align: "center" },
        left: { side: "left", align: "center" },
        right: { side: "right", align: "center" },
        "top-start": { side: "top", align: "start" },
        "top-end": { side: "top", align: "end" },
        "bottom-start": { side: "bottom", align: "start" },
        "bottom-end": { side: "bottom", align: "end" }
    };

    const { side, align } = directionMap[direction] || directionMap.top;

    return (
        <TooltipProvider delayDuration={delay}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    className={className}
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TooltipWrapper;