
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Button, buttonVariants } from './button';
import { Skeleton } from './skeleton';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';

/*
Accessibility
*/

export const KanbanBoardContext = createContext(undefined);

function useDndMonitor(monitor) {
    const context = useContext(KanbanBoardContext);
    if (!context) {
        throw new Error('useDndMonitor must be used within a DndMonitorProvider');
    }

    const { registerMonitor, unregisterMonitor } = context;

    useEffect(() => {
        registerMonitor(monitor);
        return () => {
            unregisterMonitor(monitor);
        };
    }, [monitor, registerMonitor, unregisterMonitor]);
}

export function useDndEvents() {
    const context = useContext(KanbanBoardContext);

    if (!context) {
        throw new Error('useDndEvents must be used within a DndMonitorProvider');
    }

    const { activeIdRef, draggableDescribedById, triggerEvent } = context;

    const onDragStart = useCallback(
        (activeId) => {
            activeIdRef.current = activeId;
            triggerEvent('onDragStart', activeId);
        },
        [triggerEvent, activeIdRef],
    );

    const onDragMove = useCallback(
        (activeId, overId) => {
            triggerEvent('onDragMove', activeId, overId);
        },
        [triggerEvent],
    );

    const onDragOver = useCallback(
        (activeId, overId) => {
            // If the activeId is not provided, use the activeId from the ref.
            const actualActiveId = activeId || activeIdRef.current;
            triggerEvent('onDragOver', actualActiveId, overId);
        },
        [triggerEvent, activeIdRef],
    );

    const onDragEnd = useCallback(
        (activeId, overId) => {
            triggerEvent('onDragEnd', activeId, overId);
        },
        [triggerEvent],
    );

    const onDragCancel = useCallback(
        (activeId) => {
            triggerEvent('onDragCancel', activeId);
        },
        [triggerEvent],
    );

    return {
        draggableDescribedById,
        onDragStart,
        onDragMove,
        onDragOver,
        onDragEnd,
        onDragCancel,
    };
}

export const defaultScreenReaderInstructions = `
  To pick up a draggable item, press the space bar.
  While dragging, use the arrow keys to move the item.
  Press space again to drop the item in its new position, or press escape to cancel.
  `;

export const defaultAnnouncements = {
    onDragStart(activeId) {
        return `Picked up draggable item ${activeId}.`;
    },
    onDragOver(activeId, overId) {
        if (overId) {
            return `Draggable item ${activeId} was moved over droppable area ${overId}.`;
        }

        return `Draggable item ${activeId} is no longer over a droppable area.`;
    },
    onDragEnd(activeId, overId) {
        if (overId) {
            return `Draggable item ${activeId} was dropped over droppable area ${overId}`;
        }

        return `Draggable item ${activeId} was dropped.`;
    },
    onDragCancel(activeId) {
        return `Dragging was cancelled. Draggable item ${activeId} was dropped.`;
    },
};

export function KanbanBoardLiveRegion({
    announcement,
    ariaLiveType = 'assertive',
    className,
    id,
    ref,
    ...props
}) {
    return (
        <div
            aria-live={ariaLiveType}
            aria-atomic
            className={cn(
                'clip-[rect(0_0_0_0)] clip-path-[inset(100%)] fixed top-0 left-0 -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap',
                className,
            )}
            id={id}
            ref={ref}
            role="status"
            {...props}
        >
            {announcement}
        </div>
    );
}

export function KanbanBoardHiddenText({
    id,
    value,
    className,
    ref,
    ...props
}) {
    return (
        <div id={id} className={cn('hidden', className)} ref={ref} {...props}>
            {value}
        </div>
    );
}

export function useAnnouncement() {
    const [announcement, setAnnouncement] = useState('');
    const announce = useCallback((value) => {
        if (value != undefined) {
            setAnnouncement(value);
        }
    }, []);

    return { announce, announcement };
}

export const KanbanBoardAccessibility = ({
    announcements = defaultAnnouncements,
    container,
    hiddenTextDescribedById,
    screenReaderInstructions = defaultScreenReaderInstructions,
}) => {
    const { announce, announcement } = useAnnouncement();
    const liveRegionId = useId();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useDndMonitor(
        useMemo(
            () => ({
                onDragStart(activeId) {
                    announce(announcements.onDragStart(activeId));
                },
                onDragMove(activeId, overId) {
                    if (announcements.onDragMove) {
                        announce(announcements.onDragMove(activeId, overId));
                    }
                },
                onDragOver(activeId, overId) {
                    announce(announcements.onDragOver(activeId, overId));
                },
                onDragEnd(activeId, overId) {
                    announce(announcements.onDragEnd(activeId, overId));
                },
                onDragCancel(activeId) {
                    announce(announcements.onDragCancel(activeId));
                },
            }),
            [announce, announcements],
        ),
    );

    if (!mounted) {
        return null;
    }

    const markup = (
        <>
            <KanbanBoardHiddenText
                id={hiddenTextDescribedById}
                value={screenReaderInstructions}
            />
            <KanbanBoardLiveRegion id={liveRegionId} announcement={announcement} />
        </>
    );

    return container ? createPortal(markup, container) : markup;
};

export const KanbanBoardProvider = ({
    announcements,
    screenReaderInstructions,
    container,
    children,
}) => {
    const draggableDescribedById = useId();
    const monitorsReference = useRef([]);
    const activeIdReference = useRef('');

    const registerMonitor = useCallback(
        (monitor) => {
            monitorsReference.current.push(monitor);
        },
        [],
    );

    const unregisterMonitor = useCallback(
        (monitor) => {
            monitorsReference.current = monitorsReference.current.filter(
                m => m !== monitor,
            );
        },
        [],
    );

    const triggerEvent = useCallback(
        (eventType, activeId, overId) => {
            for (const monitor of monitorsReference.current) {
                const handler = monitor[eventType];
                if (handler) {
                    handler(activeId, overId);
                }
            }
        },
        [],
    );

    const contextValue = useMemo(
        () => ({
            activeIdRef: activeIdReference,
            draggableDescribedById,
            registerMonitor,
            unregisterMonitor,
            triggerEvent,
        }),
        [
            activeIdReference,
            draggableDescribedById,
            registerMonitor,
            unregisterMonitor,
            triggerEvent,
        ],
    );

    return (
        <KanbanBoardContext.Provider value={contextValue}>
            {children}
            <KanbanBoardAccessibility
                announcements={announcements}
                screenReaderInstructions={screenReaderInstructions}
                container={container}
                hiddenTextDescribedById={draggableDescribedById}
            />
        </KanbanBoardContext.Provider>
    );
};

/*
Constants
*/

const DATA_TRANSFER_TYPES = {
    CARD: 'kanban-board-card',
};

const KANBAN_BOARD_CIRCLE_COLORS_MAP = {
    primary: 'bg-kanban-board-circle-primary',
    gray: 'bg-kanban-board-circle-gray',
    red: 'bg-kanban-board-circle-red',
    yellow: 'bg-kanban-board-circle-yellow',
    green: 'bg-kanban-board-circle-green',
    cyan: 'bg-kanban-board-circle-cyan',
    blue: 'bg-kanban-board-circle-blue',
    indigo: 'bg-kanban-board-circle-indigo',
    violet: 'bg-kanban-board-circle-violet',
    purple: 'bg-kanban-board-circle-purple',
    pink: 'bg-kanban-board-circle-pink',
};

export const KANBAN_BOARD_CIRCLE_COLORS = Object.keys(
    KANBAN_BOARD_CIRCLE_COLORS_MAP,
);

/*
Board
*/

export function KanbanBoard({
    className,
    ref,
    ...props
}) {
    return (
        <div
            className={cn(
                'flex h-full flex-grow items-start gap-x-2 overflow-x-auto py-1',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardExtraMargin({
    className,
    ref,
    ...props
}) {
    return (
        <div
            className={cn('h-1 w-8 flex-shrink-0', className)}
            ref={ref}
            {...props}
        />
    );
}

/*
Column
*/

export const kanbanBoardColumnClassNames =
    'w-64 flex-shrink-0 rounded-lg border flex flex-col border-border bg-sidebar py-2 max-h-full';

export function KanbanBoardColumn({
    className,
    columnId,
    onDropOverColumn,
    ref,
    ...props
}) {
    const [isDropTarget, setIsDropTarget] = useState(false);
    const { onDragEnd, onDragOver } = useDndEvents();

    return (
        <section
            aria-labelledby={`column-${columnId}-title`}
            className={cn(
                kanbanBoardColumnClassNames,
                isDropTarget && 'border-primary',
                className,
            )}
            onDragLeave={() => {
                setIsDropTarget(false);
            }}
            onDragOver={event => {
                if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
                    event.preventDefault();
                    setIsDropTarget(true);
                    onDragOver('', columnId);
                }
            }}
            onDrop={event => {
                const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
                onDropOverColumn?.(data);
                onDragEnd(JSON.parse(data).id, columnId);
                setIsDropTarget(false);
            }}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardColumnSkeleton() {
    return (
        <section className={cn(kanbanBoardColumnClassNames, 'h-full py-0')}>
            <Skeleton className="h-full w-full" />
        </section>
    );
}

export function KanbanBoardColumnHeader({
    className,
    ref,
    ...props
}) {
    return (
        <div
            className={cn('flex items-center justify-between px-2 py-1', className)}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardColumnTitle({
    className,
    columnId,
    ref,
    ...props
}) {
    return (
        <h2
            className={cn(
                'text-muted-foreground inline-flex items-center text-sm font-medium',
                className,
            )}
            ref={ref}
            id={`column-${columnId}-title`}
            {...props}
        />
    );
}

export function KanbanBoardColumnIconButton({
    className,
    ref,
    ...props
}) {
    return (
        <Button
            className={cn('text-muted-foreground size-6', className)}
            variant="ghost"
            size="icon"
            ref={ref}
            {...props}
        />
    );
}

export function KanbanColorCircle({
    className,
    color = 'primary',
    ref,
    ...props
}) {
    return (
        <div
            className={cn(
                'mr-2 size-2 rounded-full',
                KANBAN_BOARD_CIRCLE_COLORS_MAP[color],
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardColumnList({
    className,
    ref,
    ...props
}) {
    return (
        <ul
            className={cn('min-h-0.5 flex-grow overflow-y-auto', className)}
            ref={ref}
            {...props}
        />
    );
}

export const kanbanBoardColumnListItemClassNames =
    '-mb-[2px] border-b-2 border-t-2 border-b-transparent border-t-transparent px-2 py-1 last:mb-0';

export function KanbanBoardColumnListItem({
    cardId,
    className,
    onDropOverListItem,
    ref,
    ...props
}) {
    const [dropDirection, setDropDirection] = useState('none');
    const { onDragOver, onDragEnd } = useDndEvents();

    return (
        <li
            className={cn(
                kanbanBoardColumnListItemClassNames,
                dropDirection === 'top' && 'border-t-primary',
                dropDirection === 'bottom' && 'border-b-primary',
                className,
            )}
            onDragLeave={() => {
                setDropDirection('none');
            }}
            onDragOver={event => {
                if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
                    event.preventDefault();
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    const midpoint = (rect.top + rect.bottom) / 2;
                    setDropDirection(event.clientY <= midpoint ? 'top' : 'bottom');
                    onDragOver('', cardId);
                }
            }}
            onDrop={event => {
                event.stopPropagation();
                const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
                onDropOverListItem?.(data, dropDirection);

                onDragEnd(JSON.parse(data).id, cardId);
                setDropDirection('none');
            }}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardColumnFooter({
    className,
    ref,
    ...props
}) {
    return (
        <div
            className={cn('flex items-center justify-between px-2 pt-1', className)}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardColumnButton({
    className,
    ref,
    ...props
}) {
    return (
        <Button
            className={cn(
                'bg-sidebar text-primary hover:text-primary/80 w-full justify-start',
                className,
            )}
            variant="outline"
            size="sm"
            ref={ref}
            {...props}
        />
    );
}

/*
Card
*/

const kanbanBoardCardClassNames =
    'rounded-lg border border-border bg-background p-3 text-start text-foreground shadow-sm';

export function KanbanBoardCard({
    className,
    data,
    isActive = false,
    ref,
    ...props
}) {
    const [isDragging, setIsDragging] = useState(false);
    const { draggableDescribedById, onDragStart } = useDndEvents();

    return (
        <button
            aria-describedby={draggableDescribedById}
            aria-roledescription="draggable"
            className={cn(
                kanbanBoardCardClassNames,
                'focus-visible:ring-ring inline-flex w-full cursor-grab touch-manipulation flex-col gap-1 focus-visible:ring-1 focus-visible:outline-none',
                isDragging
                    ? 'cursor-grabbing active:cursor-grabbing'
                    : 'group relative',
                isActive && 'rotate-1 transform shadow-lg',
                className,
            )}
            draggable
            onDragStart={event => {
                setIsDragging(true);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData(
                    DATA_TRANSFER_TYPES.CARD,
                    JSON.stringify(data),
                );
                event.currentTarget.blur();

                onDragStart(data.id);
            }}
            onDragEnd={() => {
                setIsDragging(false);
            }}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardCardTitle({
    className,
    ref,
    ...props
}) {
    return (
        <h3 className={cn('text-sm font-medium', className)} ref={ref} {...props} />
    );
}

export function KanbanBoardCardDescription({
    className,
    ref,
    ...props
}) {
    return (
        <p
            className={cn(
                'text-card-foreground text-xs leading-5 whitespace-pre-wrap',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

export function KanbanBoardCardTextarea({
    className,
    onChange,
    value,
    ref: externalReference,
    ...props
}) {
    const internalReference = useRef(null);

    const adjustTextareaHeight = () => {
        if (internalReference.current) {
            internalReference.current.style.height = 'auto';
            internalReference.current.style.height = `${internalReference.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, []);

    useEffect(() => {
        if (value === '') {
            adjustTextareaHeight();
        }
    }, [value]);

    function handleChange(event) {
        onChange?.(event);
        adjustTextareaHeight();
    }

    useImperativeHandle(externalReference, () => internalReference.current);

    return (
        <Textarea
            className={cn(
                kanbanBoardCardClassNames,
                'min-h-min resize-none overflow-hidden text-xs leading-5',
                className,
            )}
            onChange={handleChange}
            rows={1}
            value={value}
            ref={internalReference}
            {...props}
        />
    );
}

export function KanbanBoardCardButtonGroup({
    className,
    disabled = false,
    ref,
    ...props
}) {
    return (
        <div
            ref={ref}
            className={cn(
                'bg-background absolute top-2.5 right-2.5 z-40 hidden items-center',
                !disabled && 'group-focus-within:flex group-hover:flex',
                className,
            )}
            {...props}
        />
    );
}

export function KanbanBoardCardButton({
    className,
    ref: externalReference,
    ...props
}) {
    const internalReference = useRef(null);

    useImperativeHandle(externalReference, () => internalReference.current);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            internalReference.current?.click();
        }
    };

    return (
        <div
            className={cn(
                buttonVariants({ size: 'icon', variant: 'ghost' }),
                'border-border size-5 border hover:cursor-default [&_svg]:size-3.5',
                className,
            )}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            ref={internalReference}
            {...props}
        />
    );
}