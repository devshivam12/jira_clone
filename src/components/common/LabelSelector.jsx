import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { BadgePlus, ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateLabelsMutation, useGetLabelQuery } from "@/redux/graphql_api/miscData";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const LabelItem = React.memo(({ label, isSelected, onSelect }) => {
    const handleClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(label.name);
    }, [label.name, onSelect]);

    return (
        <div
            className="flex items-center gap-x-3 py-2 px-4 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium hover:bg-neutral-100/50"
            onMouseDown={handleClick} // use onMouseDown to prevent popover blur
        >
            <Checkbox
                checked={isSelected}
                className="border-neutral-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                // prevent checkbox from stealing focus and causing re-renders
                onCheckedChange={() => onSelect(label.name)}
            />
            <span className="text-neutral-600 font-medium text-sm">
                {label.name}
            </span>
        </div>
    );
});

LabelItem.displayName = "LabelItem";

const LabelSelector = ({ onChange, value, className = "" }) => {
    const [createLabel] = useCreateLabelsMutation();
    const triggerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [selectedLabels, setSelectedLabels] = useState(() => value || []);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [hasFocused, setHasFocused] = useState(false);
    const [page, setPage] = useState(1);
    const [allLabels, setAllLabels] = useState([]);
    const observerRef = useRef(null);
    const debounceTimerRef = useRef(null);
    // Track if we should skip the value sync (i.e., we are managing internally)
    const isInternalChange = useRef(false);

    // Sync external value → internal state (only when value actually changes, not on every render)
    const prevValueRef = useRef(value);
    useEffect(() => {
        // Only sync if value changed externally (not from our own onChange call)
        if (!isInternalChange.current && value !== prevValueRef.current) {
            setSelectedLabels(value || []);
        }
        prevValueRef.current = value;
        isInternalChange.current = false;
    }, [value]);

    // Update popover width
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            setWidth(triggerRef.current.offsetWidth);
        }
    }, [isOpen, selectedLabels]);

    // Debounce search
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(inputValue.trim());
            setPage(1);
            setAllLabels([]); // reset accumulated list on new search
        }, 500);
        return () => clearTimeout(debounceTimerRef.current);
    }, [inputValue]);

    const { data: getLabels, isFetching, refetch } = useGetLabelQuery(
        { search: debouncedSearch, page, limit: 10 },
        {
            refetchOnMountOrArgChange: false,
            refetchOnReconnect: true,
            skip: !hasFocused,
        }
    );

    const pageLabels = useMemo(() => {
        return getLabels?.data?.getClientLabels?.labels?.map(item => ({
            id: item?._id,
            name: item?.value,
        })) || [];
    }, [getLabels]);

    const hasMore = getLabels?.data?.getClientLabels?.hasMore || false;

    // Accumulate pages
    useEffect(() => {
        if (pageLabels.length === 0) return;
        if (page === 1) {
            setAllLabels(pageLabels);
        } else {
            setAllLabels(prev => {
                const existingIds = new Set(prev.map(l => l.id));
                const newItems = pageLabels.filter(l => !existingIds.has(l.id));
                return [...prev, ...newItems];
            });
        }
    }, [pageLabels, page]);

    const exactMatchExists = useMemo(() => {
        if (!inputValue.trim()) return false;
        const searchTerm = inputValue.trim().toLowerCase();
        return allLabels.some(label => label?.name?.toLowerCase() === searchTerm);
    }, [inputValue, allLabels]);

    // Stable select handler — no external dependencies that cause loops
    const handleSelect = useCallback((name) => {
        setSelectedLabels(prev =>
            prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name]
        );
    }, []); // no deps needed — uses functional updater

    const handleRemove = useCallback((e, name) => {
        e.stopPropagation();
        setSelectedLabels(prev => {
            const updated = prev.filter(l => l !== name);
            isInternalChange.current = true;
            onChange?.(updated);
            return updated;
        });
    }, [onChange]);

    const handleCreateNew = useCallback(async () => {
        const newLabelName = inputValue.trim();
        if (!newLabelName || exactMatchExists) return;
        try {
            await createLabel(newLabelName).unwrap();
            setSelectedLabels(prev => [...prev, newLabelName]);
            setInputValue("");
            setPage(1);
            setAllLabels([]);
            refetch();
        } catch (error) {
            console.error("Failed to create label:", error);
        }
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [inputValue, exactMatchExists, createLabel, refetch]);

    const handleDone = useCallback(() => {
        isInternalChange.current = true;
        onChange?.(selectedLabels);
        setIsOpen(false);
        setInputValue("");
    }, [onChange, selectedLabels]);

    const handleReset = useCallback(() => {
        setSelectedLabels([]);
    }, []);

    // Only open/close — no onChange here to avoid the loop
    const handleOpenChange = useCallback((open) => {
        setIsOpen(open);
        if (open) {
            setHasFocused(true);
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setInputValue("");
        }
    }, []);

    const handleTriggerClick = useCallback(() => {
        setHasFocused(true);
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, []);

    // Infinite scroll via IntersectionObserver
    const lastLabelRef = useCallback((node) => {
        if (isFetching) return;
        if (observerRef.current) observerRef.current.disconnect();
        if (!node || !hasMore) return;

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.5 });

        observerRef.current.observe(node);
    }, [isFetching, hasMore]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => observerRef.current?.disconnect();
    }, []);

    const shouldShowCreateButton = inputValue.trim() && !exactMatchExists && !isFetching;

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <div
                    ref={triggerRef}
                    className={`flex flex-wrap flex-1 items-center gap-2 border border-neutral-300 rounded-md cursor-text px-2 py-0.5 relative transition-colors focus-within:border-neutral-400 w-full ${className}`}
                    onClick={handleTriggerClick}
                >
                    {selectedLabels.map(label => (
                        <Badge
                            key={label}
                            className="flex items-center gap-1 px-0.5 py-0.5"
                            variant="borderGradient"
                        >
                            {label}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-neutral-300"
                                onClick={(e) => handleRemove(e, label)}
                            />
                        </Badge>
                    ))}
                    <div className="flex items-center relative flex-1 min-w-[120px]">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => {
                                setInputValue(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            placeholder={selectedLabels.length === 0 ? "Select label" : ""}
                            className="flex-1 bg-transparent outline-none py-1 px-2 my-1 min-w-[120px] text-sm text-neutral-700 placeholder:text-neutral-400"
                        />
                        {isFetching ? (
                            <Loader2 className="h-4 w-4 animate-spin text-neutral-400 mr-2" />
                        ) : (
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 pointer-events-none" />
                        )}
                    </div>
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="p-0"
                style={{ width: width ? `${width}px` : "300px" }}
                // Prevent popover from closing when clicking inside
                onOpenAutoFocus={e => e.preventDefault()}
            >
                {isFetching && page === 1 ? (
                    <div className="py-8 flex items-center justify-center">
                        <span className="text-neutral-500 font-semibold">Searching...</span>
                    </div>
                ) : allLabels.length > 0 ? (
                    <ScrollArea className={allLabels.length > 5 ? "h-40" : "max-h-40"}>
                        {allLabels.map((label, index) => {
                            const isLast = index === allLabels.length - 1;
                            const isSelected = selectedLabels.includes(label.name);
                            return (
                                <div ref={isLast ? lastLabelRef : null} key={label.id}>
                                    <LabelItem
                                        label={label}
                                        isSelected={isSelected}
                                        onSelect={handleSelect}
                                    />
                                </div>
                            );
                        })}
                        {isFetching && page > 1 && (
                            <div className="p-2 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            </div>
                        )}
                    </ScrollArea>
                ) : shouldShowCreateButton ? (
                    <div className="p-2 bg-neutral-100 cursor-pointer text-sm text-neutral-600 flex items-center justify-between">
                        <span className="text-neutral-900 font-normal">
                            Create new label{" "}
                            <span className="font-medium text-neutral-500">"{inputValue.trim()}"</span>
                        </span>
                        <Button type="button" size="icon" variant="teritary" onClick={handleCreateNew}>
                            <BadgePlus className="text-xs font-medium" />
                        </Button>
                    </div>
                ) : (
                    <div className="py-4 bg-neutral-100 text-sm text-neutral-500 font-normal flex items-center justify-center">
                        <span>{inputValue.trim() ? "No matches found" : "Type to search"}</span>
                    </div>
                )}

                <div className="flex items-center justify-between p-2 border-t border-neutral-200 bg-neutral-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleReset}
                        className="text-neutral-500 hover:text-neutral-700"
                    >
                        Reset
                    </Button>
                    <Button size="sm" variant="teritary" onClick={handleDone} type="button">
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default LabelSelector;