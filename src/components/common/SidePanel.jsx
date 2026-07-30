import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared shell for the backlog right side panels (Insight, View settings, etc.)
// so every panel opens with the same structure: a sticky header with a title,
// optional extra actions and a close button, and a scrollable body.
const SidePanel = ({ title, onClose, actions, children, className, bodyClassName }) => {
    return (
        <div
            className={cn(
                "flex flex-col w-full h-full bg-white border-l border-neutral-200 shadow-sm overflow-hidden animate-in slide-in-from-right-8 duration-300",
                className
            )}
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <h2 className="text-[16px] font-semibold text-neutral-800">{title}</h2>
                <div className="flex items-center gap-1">
                    {actions}
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close panel"
                            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className={cn("flex-1 overflow-y-auto custom-scrollbar", bodyClassName)}>
                {children}
            </div>
        </div>
    );
};

export default SidePanel;
