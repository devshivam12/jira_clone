import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ManageAvatar from "@/components/common/ManageAvatar";
import { useGetAllMemberListQuery } from "@/redux/api/company/team";

import { ScrollArea } from "../ui/scroll-area";
import { useGetTeamDropdownQuery, useGetMemberDropdownQuery, useGetSprintDropdownQuery, useGetParentDropdownQuery } from "@/redux/graphql_api/miscData";

// Constants
const SELECT_TYPES = {
  MEMBER: 'member',
  TEAM: 'team',
  SPRINT: 'sprint',
  PARENT: 'parent'
};

const COMPONENT_CONFIG = {
  width: "300px",
  pageSize: 10,
  debounceDelay: 500,
  scrollThreshold: 50,
  maxHeight: "160px"
};

// Configuration object for different select types
const SELECT_CONFIG = {
  [SELECT_TYPES.MEMBER]: {
    placeholder: 'Select member',
    emptyMessage: 'No members found',
    getDisplayName: (item) => `${item.first_name} ${item.last_name}`,
    getAvatarProps: (item) => ({
      firstName: item.first_name,
      lastName: item.last_name,
      image: item.image
    })
  },
  [SELECT_TYPES.TEAM]: {
    placeholder: 'Select team',
    emptyMessage: 'No teams found',
    getDisplayName: (item) => item.team_name,
    getAvatarProps: (item) => ({
      firstName: item.team_name,
      image: item.team_icon
    })
  },
  [SELECT_TYPES.SPRINT]: {
    placeholder: 'Select sprint',
    emptyMessage: 'No sprint found',
    getDisplayName: (item) => item.name,
    getAvatarProps: () => null
  },
  [SELECT_TYPES.PARENT]: {
    placeholder: 'Select parent',
    emptyMessage: 'No parent found',
    getDisplayName: (item) => item.summary,
    getAvatarProps: () => null
  }
};

const DynamicDropdownSelector = ({
  slug = null,
  onChange,
  value,
  label,
  width = null,
  className = "",
  showDropdown = false
}) => {
  // Validate and normalize slug
  const selectType =
    slug === "team"
      ? SELECT_TYPES.TEAM
      : slug === "member"
        ? SELECT_TYPES.MEMBER
        : slug === "sprint"
          ? SELECT_TYPES.SPRINT
          : slug === 'parent' ? SELECT_TYPES.PARENT : null;

  const config = SELECT_CONFIG[selectType];
  console.log("config", config)
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hasFocused, setHasFocused] = useState(false);
  const triggerRef = useRef(null)
  // Refs
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
      setPage(1);
    }, COMPONENT_CONFIG.debounceDelay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  // Query parameters
  const queryParams = useMemo(() => ({
    search: debouncedSearch,
    page,
    pageSize: COMPONENT_CONFIG.pageSize,
  }), [debouncedSearch, page]);

  const shouldFetch = isOpen || showDropdown
  // API queries
  const {
    data: memberData,
    isFetching: memberFetching,
    error: memberError
  } = useGetMemberDropdownQuery(queryParams, {
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: false,
    refetchOnFocus: false,
    skip: !(shouldFetch && selectType === SELECT_TYPES.MEMBER),
  });

  const {
    data: teamData,
    isFetching: teamFetching,
    error: teamError
  } = useGetTeamDropdownQuery(queryParams, {
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: true,
    skip: !(shouldFetch && selectType === SELECT_TYPES.TEAM),
  });
  console.log("memberData", memberData)

  const { data: sprintData, isFetching: sprintFetching, error: sprintError } = useGetSprintDropdownQuery(queryParams, {
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: true,
    skip: !(shouldFetch && selectType === SELECT_TYPES.SPRINT)
  })
  console.log("sprintData", sprintData)

  const { data: parentData, isFetching: parentFetching, error: parentError } = useGetParentDropdownQuery(queryParams, {
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: false,
    refetchOnFocus: false,
    skip: !(shouldFetch && selectType === SELECT_TYPES.PARENT)
  })
  console.log("parentData", parentData)

  // Extract data based on type
  // Extract data based on type
  const { items, hasMore, isFetching, apiError } = useMemo(() => {
    if (selectType === SELECT_TYPES.MEMBER) {
      return {
        items: memberData?.data?.memberDropdown?.members || [],
        hasMore: memberData?.data?.memberDropdown?.hasMore || false,
        isFetching: memberFetching,
        apiError: memberError
      };
    } else if (selectType === SELECT_TYPES.TEAM) {
      return {
        items: teamData?.data?.teamDropdown?.teams || [],
        hasMore: teamData?.data?.teamDropdown?.hasMore || false,
        isFetching: teamFetching,
        apiError: teamError
      };
    } else if (selectType === SELECT_TYPES.SPRINT) {
      return {
        items: sprintData?.data?.sprintDropdown?.sprints || [],
        hasMore: sprintData?.data?.sprintDropdown?.hasMore || false,
        isFetching: sprintFetching,
        apiError: sprintError
      }
    } else if (selectType === SELECT_TYPES.PARENT) {
      return {
        items: parentData?.data?.parentDropdown?.parents || [],
        hasMore: parentData?.data?.parentDropdown?.hasMore || false,
        isFetching: parentFetching,
        apiError: parentError
      }
    }
    return { items: [], hasMore: false, isFetching: false, apiError: null };
  }, [selectType, memberData, teamData, sprintData, parentData, memberFetching, teamFetching, sprintFetching, parentFetching, memberError, teamError, sprintError, parentError]);

  // const hasMore = page < totalPages;
  console.log("items", items)
  // Update items list when new data arrives
  useEffect(() => {
    if (page === 1) {
      setAllItems(items);
    } else if (items.length > 0) {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((item) => item._id));
        const newItems = items.filter((item) => !existingIds.has(item._id));
        return [...prev, ...newItems];
      });
    }
  }, [items, page]);

  useEffect(() => {
    if (value) {
      setSelectedItem(value);
    } else {
      setSelectedItem(null);
    }
  }, [value]);

  useEffect(() => {
    if (showDropdown) {
      setPage(1);
      setSearchValue("");
    }
  }, [showDropdown]);

  // Reset state when slug changes
  useEffect(() => {
    if (!showDropdown) {
      setAllItems([]);
    }
    setPage(1);
    setSearchValue("");
    setSelectedItem(null);
    // if (slug === 'sprint' || slug === 'parent') {
    //   queryParams.projectId = projectId
    // }
  }, [showDropdown]);
  // Infinite scroll handler
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < COMPONENT_CONFIG.scrollThreshold;
    console.log("hasMore", hasMore)
    if (isNearBottom && hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  // Item selection handler
  const handleItemSelect = useCallback((itemId) => {
    const item = allItems.find((i) => i._id === itemId);

    if (!item) return;

    setSelectedItem(item);
    if (showDropdown) {
      onChange?.(item);
    } else {
      onChange?.(selectType === SELECT_TYPES.MEMBER ? itemId : item);
      setIsOpen(false)
    }
    setSearchValue("");
    // setIsOpen(false);
    if (!showDropdown) {
      setIsOpen(false);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [allItems, onChange, selectType, showDropdown]);
  console.log("setSelectedItem", selectedItem)
  // Clear selection handler
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setSelectedItem(null);
    onChange?.(null);
    setSearchValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle popover trigger click
  const handleTriggerClick = useCallback(() => {
    if (!hasFocused) {
      setHasFocused(true);
    }
    if (!showDropdown) {
      setIsOpen(true);
    }
  }, [hasFocused, showDropdown]);

  // Get display placeholder
  const displayPlaceholder = label || config.placeholder;
  // console.log("allItems", allItems)

  const getItemClassName = (item) => {
    const isSelected = selectedItem?._id === item._id;
    return [
      "flex items-center gap-x-5 py-2 px-6 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium",
      "hover:bg-neutral-200/20 hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-neutral-400 hover:before:rounded-full",
      isSelected && "bg-neutral-200/40 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border font-semibold"
    ].filter(Boolean).join(" ");
  };

  const componentWidth = width || COMPONENT_CONFIG.defaultWidth;
  if (showDropdown) {
    return (
      <div className="bg-white rounded-md border border-neutral-200 w-full">
        {/* Search Input */}
        <div className="py-2 px-2  border-b  border-neutral-200">
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={displayPlaceholder}
            className="w-full bg-transparent outline-none px-2 py-1.5 text-sm text-neutral-700 placeholder:text-neutral-400 border border-neutral-300 rounded-md focus:border-neutral-400"
          />
        </div>

        {/* Content */}
        {isFetching && page === 1 ? (
          <div className="py-8 flex items-center justify-center bg-neutral-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              <span className="text-neutral-500 text-sm">Searching...</span>
            </div>
          </div>
        ) : allItems.length > 0 ? (
          <ScrollArea
            onScroll={handleScroll}
            style={{ maxHeight: COMPONENT_CONFIG.maxHeight }}
            className="overflow-y-auto"
          >
            {allItems?.map((item) => (
              <div
                key={item?._id}
                className={getItemClassName(item)}
                onClick={() => handleItemSelect(item._id)}
              >
                {config?.getAvatarProps(item) ? (
                  <ManageAvatar {...config.getAvatarProps(item)} size="sm" />
                ) : null}
                <span className="text-sm truncate flex flex-col">
                  {config.getDisplayName(item)}
                  {selectType === SELECT_TYPES.SPRINT && (
                    <span className="text-xs text-neutral-400 mt-0.5 truncate">
                      {item.project_key}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {isFetching && page > 1 && (
              <div className="flex items-center justify-center py-4 bg-neutral-50">
                <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="py-8 flex items-center justify-center bg-neutral-50">
            <div className="text-neutral-500 text-sm">
              {apiError ? 'Error loading data' : config.emptyMessage}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          ref={triggerRef}
          className={`flex items-center justify-between gap-2 border border-neutral-300 rounded-md cursor-text px-2 py-0.5 relative transition-colors focus-within:border-neutral-400 w-full ${className}`}
          onClick={handleTriggerClick}
        >
          {selectedItem ? (
            <div className="flex w-full py-1 px-2 items-center gap-2">
              {config.getAvatarProps(selectedItem) ? (
                <ManageAvatar {...config.getAvatarProps(selectedItem)} size="sm" />
              ) : null}
              <span className="text-sm text-neutral-500 font-medium truncate flex-1 max-w-[180px] block">
                {config.getDisplayName(selectedItem)}
              </span>
            </div>
          ) : (
            <div className="flex items-center relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchValue(newValue);
                  if (!isOpen) {
                    setIsOpen(true);
                  }
                }}
                placeholder={selectedItem ? "" : displayPlaceholder}
                className="w-full bg-transparent outline-none py-1 px-2 my-1 text-sm text-neutral-700 placeholder:text-neutral-400"
              />

              {!isFetching && (
                <ChevronDown
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                    }`}
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-1">
            {selectedItem && (
              <Button
                onClick={handleClear}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                type="button"
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </Button>
            )}
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="p-0"
        style={{
          width: triggerRef.current ? `${triggerRef.current.offsetWidth}px` : componentWidth
        }}
      >
        {isFetching && page === 1 ? (
          <div className="py-8 flex items-center justify-center bg-neutral-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              <span className="text-neutral-500 text-sm">Searching...</span>
            </div>
          </div>
        ) : allItems.length > 0 ? (
          <ScrollArea
            onScroll={handleScroll}
            style={{ maxHeight: COMPONENT_CONFIG.maxHeight }}
            className="overflow-y-auto"
          >
            {allItems?.map((item) => (
              <div
                key={item?._id}
                className={getItemClassName(item)}
                // border-b border-neutral-100 last:border-b-0
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleItemSelect(item._id);
                }}
              >
                {config?.getAvatarProps(item) ? (
                  <ManageAvatar {...config.getAvatarProps(item)} size="sm" />
                ) : null}
                <span className="text-sm truncate flex flex-col ">
                  {config.getDisplayName(item)}

                  {selectType === SELECT_TYPES.SPRINT && (
                    <span className="text-xs text-neutral-400 mt-0.5 truncate">
                      {item.project_key}
                    </span>
                  )}
                </span>


              </div>
            ))}
            {isFetching && page > 1 && (
              <div className="flex items-center justify-center py-4 bg-neutral-50">
                <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="py-8 flex items-center justify-center bg-neutral-50">
            <div className="text-neutral-500 text-sm">
              {apiError ? 'Error loading data' : config.emptyMessage}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DynamicDropdownSelector;