import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { BadgePlus, ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCreateLabelsMutation, useGetLabelQuery } from "@/redux/graphql_api/miscData";
import { ScrollArea } from "../ui/scroll-area";

const LabelSelector = ({onChange}) => {
    const [createLabel] = useCreateLabelsMutation()

    const [inputValue, setInputValue] = useState("");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [hasFocused, setHasFocused] = useState(false)
    const [page, setPage] = useState(1);
    const scrollRef = useRef(null);
    const observerRef = useRef(null);
    const debounceTimerRef = useRef(null);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(inputValue.trim());
            setPage(1);
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputValue]);

    const { data: getLabels, isFetching, refetch } = useGetLabelQuery({
        search: debouncedSearch,
        page,
        limit: 10
    }, {
        refetchOnMountOrArgChange: false,
        refetchOnReconnect: true,
        skip: !hasFocused
    });

    const availableLabels = useMemo(() => {
        return getLabels?.data?.getClientLabels?.labels?.map(item => ({
            id: item?._id,
            name: item?.value
        })) || [];
    }, [getLabels]);

    const hasMore = getLabels?.data?.getClientLabels?.hasMore || false;

    // ✅ Check if exact match exists in available labels (case-insensitive)
    const exactMatchExists = useMemo(() => {
        if (!inputValue.trim()) return false;
        const searchTerm = inputValue.trim().toLowerCase();
        return availableLabels.some(label =>
            label?.name?.toLowerCase() === searchTerm
        );
    }, [inputValue, availableLabels]);

    // ✅ Filter out already selected labels
    const filteredLabels = useMemo(() => {
        if (!availableLabels) return [];
        return availableLabels.filter((label) =>
            !selectedLabels.includes(label.name)
        );
    }, [availableLabels, selectedLabels]);

    const handleSelect = useCallback((name) => {
        if (!selectedLabels.includes(name)) {
            setSelectedLabels((prev) => [...prev, name]);
        }
        onChange?.(selectedLabels)
        setInputValue("");
        setIsOpen(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [selectedLabels, onChange]);

    const handleRemove = useCallback((name) => {
        setSelectedLabels((prev) => prev.filter((l) => l !== name));
        setTimeout(() => inputRef.current?.focus(), 0);
        onChange?.(null)
    }, [onChange]);

    const handleCreateNew = useCallback(async () => {
        const newLabelName = inputValue.trim();
        if (!newLabelName || exactMatchExists) return;

        try {
            await createLabel(newLabelName).unwrap();
            setSelectedLabels((prev) => [...prev, newLabelName]);
            setInputValue("");
            setPage(1);
            // Refetch to get the newly created label
            refetch();
        } catch (error) {
            console.error("Failed to create label:", error);
        } finally {
            setIsOpen(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [inputValue, exactMatchExists, createLabel, refetch]);

    const lastLabelRef = useCallback((node) => {
        if (isFetching) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        });

        if (node) observerRef.current.observe(node);
    }, [isFetching, hasMore]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // ✅ Determine what to show in dropdown
    const shouldShowCreateButton = inputValue.trim() &&
        !exactMatchExists &&
        !isFetching &&
        filteredLabels.length === 0;

    const getItemClassName = (item) => {
        const isSelected = selectedLabels.includes(item.name)
        return [
            "flex items-center gap-x-5 py-2 px-6 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium",
            "hover:bg-neutral-200/20 hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-neutral-400 hover:before:rounded-full",
            isSelected && "bg-neutral-200/40 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border font-semibold"
        ].filter(Boolean).join(" ");
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className="flex flex-wrap items-center gap-2 border border-neutral-300 rounded-md cursor-text px-2 py-0.5 w-[300px]"
                    onClick={() => {
                        if (!hasFocused) {
                            setHasFocused(true);
                        }
                        setIsOpen(true);
                        inputRef.current?.focus();
                    }}
                >
                    {selectedLabels.map((label) => (
                        <Badge
                            key={label}
                            className="flex items-center gap-1 px-0.5 py-0.5"
                            variant="borderGradient"
                        >
                            {label}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-neutral-300"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(label);
                                }}
                            />
                        </Badge>
                    ))}
                    <div className="flex items-center relative w-[300px]">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            placeholder={selectedLabels.length === 0 ? "Select label" : ""}
                            className="flex-1 bg-transparent outline-none py-1 px-2 my-1 min-w-[120px] text-sm text-neutral-700 placeholder:text-neutral-400"
                        />
                        {isFetching ? (
                            <div className="flex items-center pr-2">
                                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            </div>
                        ) : (
                            <ChevronDown
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 pointer-events-none"
                            />
                        )}
                    </div>

                </div>
            </PopoverTrigger>

            <PopoverContent className="w-[300px] z-50 p-0">
                {isFetching && page === 1 ? (
                    // ✅ Initial loading state
                    <div className="py-8 flex items-center justify-center">
                        <span className="text-neutral-500 textfont-semibold">Searching....</span>
                    </div>
                ) : filteredLabels.length > 0 ? (
                    // ✅ Show filtered labels
                    <ScrollArea
                        ref={scrollRef}
                        className={`${filteredLabels.length > 5 ? 'h-40' : 'max-h-40'}`}
                    >
                        {filteredLabels.map((label, index) => {
                            const isLast = filteredLabels.length === index + 1;
                            return (
                                <div
                                    ref={isLast ? lastLabelRef : null}
                                    key={label.id}
                                    className={getItemClassName(label)}
                                    onMouseDown={() => handleSelect(label.name)}
                                >
                                    <span className="text-neutral-500 font-medium">
                                        {label.name}
                                    </span>
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
                    // ✅ Show create new button only when appropriate
                    <div className="p-2 bg-neutral-100 cursor-pointer text-sm text-neutral-600 flex items-center justify-between">
                        <span className="text-neutral-900 font-normal">
                            Create new label{" "}
                            <span className="font-medium text-neutral-500">"{inputValue.trim()}"</span>
                        </span>
                        <Button
                            type="button"
                            size="icon"
                            variant="teritary"
                            onClick={handleCreateNew}
                        >
                            <BadgePlus className="text-xs font-medium" />
                        </Button>
                    </div>
                ) : (
                    // ✅ No results found
                    <div className="py-4 bg-neutral-100 cursor-pointer text-sm text-neutral-500 font-normal flex items-center justify-center">
                        <span>{inputValue.trim() && "No matches found"}</span>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default LabelSelector;