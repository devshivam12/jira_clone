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
        <div className="flex items-center gap-2 lg:gap-3 ml-auto sm:ml-4">
            <div className="hidden sm:flex w-24 md:w-36 lg:w-48 xl:w-56 h-[6px] lg:h-[8px] rounded-full overflow-hidden bg-neutral-200/60 dark:bg-neutral-800 shadow-inner">
                {segments.map((segment, index) => {
                    const isHex = segment.color?.startsWith('#');
                    return (
                        <TooltipWrapper key={segment.id} content={`${segment.name}: ${segment.count} issue${segment.count !== 1 ? 's' : ''}`} disableFocusListener>
                            <div 
                                style={{ 
                                    width: `${segment.percentage}%`,
                                    backgroundColor: isHex ? segment.color : undefined,
                                    boxShadow: isHex ? `0 0 8px ${segment.color}80` : undefined,
                                }} 
                                className={`h-full transition-all duration-500 ease-out hover:brightness-110 border-r border-white/20 last:border-r-0 ${!isHex ? (segment.color || 'bg-gray-400') : ''}`}
                            />
                        </TooltipWrapper>
                    );
                })}
            </div>
            
            <TooltipWrapper content={`${doneCount} done out of ${totalCount} total`} disableFocusListener>
                <div className="hidden sm:flex items-center justify-center text-[11px] lg:text-[12px] font-semibold text-neutral-600 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm px-2 py-0.5 rounded-md backdrop-blur-sm whitespace-nowrap">
                    <span className="text-emerald-600 dark:text-emerald-500">{doneCount}</span>
                    <span className="mx-[2px] text-neutral-400 font-light">/</span>
                    <span className="text-neutral-500">{totalCount}</span>
                </div>
            </TooltipWrapper>

            <TooltipWrapper content={`${totalCount} total task${totalCount !== 1 ? 's' : ''}`} disableFocusListener>
                <div className="flex sm:hidden items-center justify-center h-7 w-7 text-[12px] font-bold text-neutral-700 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-sm rounded-full">
                    {totalCount}
                </div>
            </TooltipWrapper>
        </div>
    );
});

StatusBar.displayName = 'StatusBar';
export default StatusBar;
