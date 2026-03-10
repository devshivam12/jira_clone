import React, { memo } from "react";
import TooltipWrapper from "./TooltipWrapper";

const StatusBar = memo(({ statusCount, taskTypes }) => {
    if (!statusCount) return null;

    let statusCountsMap = {};
    let totalCount = 0;

    if (Array.isArray(statusCount)) {
        statusCount.forEach(item => {
            const statusKey = item.status || item._id; // handling different possible keys
            const count = item.count;
            statusCountsMap[statusKey] = count;
            totalCount += count;
        });
    } else if (typeof statusCount === 'object') {
        Object.entries(statusCount).forEach(([key, count]) => {
            statusCountsMap[key] = count;
            totalCount += count;
        });
    }

    if (totalCount === 0) return null;

    const segments = taskTypes.map(type => {
        const count = statusCountsMap[type.value] || 0;
        return {
            ...type,
            count,
            percentage: (count / totalCount) * 100
        };
    }).filter(s => s.count > 0);

    const doneSegment = segments.find(s => s.value === 'done' || s.name?.toLowerCase() === 'done' || s.value === 'completed');
    const doneCount = doneSegment ? doneSegment.count : 0;

    return (
        <div className="flex items-center gap-3 ml-4">
            <div className="flex w-48 sm:w-56 h-[8px] rounded-full overflow-hidden bg-gray-200">
                {segments.map((segment, index) => {
                    const isHex = segment.color?.startsWith('#');
                    return (
                        <TooltipWrapper key={segment.id} content={`${segment.name}: ${segment.count} issue${segment.count !== 1 ? 's' : ''}`} disableFocusListener>
                            <div 
                                style={{ 
                                    width: `${segment.percentage}%`,
                                    backgroundColor: isHex ? segment.color : undefined
                                }} 
                                className={`h-full transition-all duration-300 hover:opacity-80 border-r border-white last:border-r-0 ${!isHex ? (segment.color || 'bg-gray-400') : ''}`}
                            />
                        </TooltipWrapper>
                    );
                })}
            </div>
            <div className="flex items-center text-[13px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-sm">
                <span className="text-neutral-700">{doneCount}</span>
                <span className="mx-0.5">/</span>
                <span>{totalCount}</span>
            </div>
        </div>
    );
});

StatusBar.displayName = 'StatusBar';
export default StatusBar;
