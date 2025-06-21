import React from 'react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider
} from "../../components/ui/tooltip";
import { TooltipArrow } from '@radix-ui/react-tooltip';

const TooltipWrapper = ({
    children,
    content,
    delay = 50,
    className = "",
    direction = "top",
    width =' auto'
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
        <TooltipProvider delayDuration={delay} >
            <Tooltip >
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    className="bg-neutral-500 text-white px-3 py-2 rounded-md shadow-lg text-justify"
                    style={{ width: width === "auto" ? "max-content" : width }}
                >
                    {content}
                    <TooltipArrow
                        className="fill-neutral-500"
                        width={11}  // Optional: control arrow size
                        height={5}
                    />
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TooltipWrapper;