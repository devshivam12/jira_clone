import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ManageAvatar from "@/components/common/ManageAvatar";

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
    // The dropdown list gives first_name and last_name. A member already saved
    // on a task comes back from getTaskDetail as one `name` field, so both
    // shapes are handled here. Without the fallback the assignee and reporter
    // read "undefined undefined".
    getDisplayName: (item) => {
      const joined = [item?.first_name, item?.last_name].filter(Boolean).join(' ');
      return joined || item?.name || '';
    },
    getAvatarProps: (item) => {
      const [firstWord, ...restWords] = (item?.name || '').trim().split(/\s+/);
      return {
        firstName: item?.first_name || firstWord || '',
        lastName: item?.last_name || restWords.join(' '),
        image: item?.image
      };
    }
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

// One entry per select type: which query hook to run, the fetch options that
// type wants, and how to read the list out of its response shape.
//
// This component used to call all four hooks on every instance and rely on
// `skip` to keep three of them quiet. `skip` stops the network request but not
// the store subscription, so each dropdown held four subscriptions instead of
// one, and the extraction useMemo below re-ran whenever any of the four query
// states moved. A task detail panel renders five or six of these at once, so
// that came to twenty-plus subscriptions for six dropdowns.
const QUERY_BY_TYPE = {
  [SELECT_TYPES.MEMBER]: {
    useQuery: useGetMemberDropdownQuery,
    fetchOptions: {
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
      refetchOnFocus: false,
    },
    read: (data) => ({
      items: data?.data?.memberDropdown?.members || [],
      hasMore: data?.data?.memberDropdown?.hasMore || false,
    }),
  },
  [SELECT_TYPES.TEAM]: {
    useQuery: useGetTeamDropdownQuery,
    fetchOptions: {
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: true,
    },
    read: (data) => ({
      items: data?.data?.teamDropdown?.teams || [],
      hasMore: data?.data?.teamDropdown?.hasMore || false,
    }),
  },
  [SELECT_TYPES.SPRINT]: {
    useQuery: useGetSprintDropdownQuery,
    fetchOptions: {
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: true,
    },
    read: (data) => ({
      items: data?.data?.sprintDropdown?.sprints || [],
      hasMore: data?.data?.sprintDropdown?.hasMore || false,
    }),
  },
  [SELECT_TYPES.PARENT]: {
    useQuery: useGetParentDropdownQuery,
    fetchOptions: {
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
      refetchOnFocus: false,
    },
    read: (data) => ({
      items: data?.data?.parentDropdown?.parents || [],
      hasMore: data?.data?.parentDropdown?.hasMore || false,
    }),
  },
};

const EMPTY_ITEMS = [];

const DropdownItem = memo(({ item, isSelected, config, onSelect, selectType }) => {
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    onSelect(item);
  }, [item, onSelect]);

  const className = useMemo(() => {
    return [
      "flex items-center gap-x-5 py-2 px-6 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium",
      "hover:bg-neutral-200/20 hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-neutral-400 hover:before:rounded-full",
      isSelected && "bg-neutral-200/40 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border font-semibold"
    ].filter(Boolean).join(" ");
  }, [isSelected]);

  const avatarProps = config.getAvatarProps(item);

  return (
    <div
      className={className}
      onMouseDown={handleMouseDown}
    >
      {avatarProps && (
        <ManageAvatar {...avatarProps} size="sm" />
      )}
      <span className="text-sm truncate flex flex-col">
        {config.getDisplayName(item)}
        {selectType === SELECT_TYPES.SPRINT && (
          <span className="text-xs text-neutral-400 mt-0.5 truncate">
            {item.project_key}
          </span>
        )}
      </span>
    </div>
  );
});

// The real component. `selectType` is fixed for the lifetime of one instance,
// because the wrapper at the bottom of this file keys on it - so picking the
// query hook out of QUERY_BY_TYPE below keeps a stable hook order.
const DropdownSelectorBody = ({
  selectType,
  config,
  onChange,
  value,
  label,
  width = null,
  className = "",
  showDropdown = false,
  onClose
}) => {
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
  const skipSearchRef = useRef(false);

  // Get display placeholder
  const displayPlaceholder = label || config.placeholder;

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }
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

  // One query, chosen by type. Same fetch options and same skip condition as
  // before, so when and what it requests has not changed.
  const queryDef = QUERY_BY_TYPE[selectType];
  const { data, isFetching, error: apiError } = queryDef.useQuery(queryParams, {
    ...queryDef.fetchOptions,
    skip: !shouldFetch,
  });

  const { items, hasMore } = useMemo(
    () => (data ? queryDef.read(data) : { items: EMPTY_ITEMS, hasMore: false }),
    [data, queryDef]
  );

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
  }, [showDropdown]);

  // Infinite scroll handler
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < COMPONENT_CONFIG.scrollThreshold;
    if (isNearBottom && hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  // Item selection handler (Optimized)
  const handleItemSelect = useCallback((item) => {
    if (!item) return;

    setSelectedItem(item);
    if (showDropdown) {
      onChange?.(item, { onClose });
    } else {
      onChange?.(item, { onClose });
      setIsOpen(false);
    }
    setSearchValue("");
    if (!showDropdown) {
      setIsOpen(false);
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [onChange, showDropdown, onClose]);

  // Clear selection handler
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setSelectedItem(null);
    onChange?.(null);
    setSearchValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  // Handle interaction when opening the dropdown
  const handleOpenChange = useCallback((open) => {
    if (open) {
      // Opening: If there is a selected item, switch to search mode
      if (selectedItem) {
        skipSearchRef.current = true;
        setSearchValue(config.getDisplayName(selectedItem));
        setSelectedItem(null);
      }
      setIsOpen(true);
    } else {
      // Closing: If no item is selected (and we didn't just clear it for search), restore value
      if (value) {
        setSelectedItem(value);
      }
      setIsOpen(false);
      setSearchValue("");
      setHasFocused(false);
    }
  }, [selectedItem, config, value]);

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [isOpen]);

  // Handle popover trigger click
  const handleTriggerClick = useCallback(() => {
    if (!showDropdown && !isOpen) {
      handleOpenChange(true);
    }
  }, [showDropdown, isOpen, handleOpenChange]);


  const componentWidth = width || COMPONENT_CONFIG.defaultWidth;
  if (showDropdown) {
    return (
      <div className="bg-white rounded-md w-full flex flex-col min-h-[220px]">
        {/* Search Input */}
        <div className="py-2 px-2  border-b  border-neutral-200">
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={displayPlaceholder}
            className="w-full bg-transparent outline-none px-2 py-1.5 text-sm text-neutral-700 placeholder:text-neutral-400 border border-neutral-300 rounded-md focus:border-neutral-400"
            autoFocus
          />
        </div>

        {/* Content */}
        {isFetching && page === 1 ? (
          <div className="flex-1 flex items-center justify-center bg-white min-h-[160px]">
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
              <DropdownItem
                key={item._id}
                item={item}
                isSelected={selectedItem?._id === item._id}
                config={config}
                selectType={selectType}
                onSelect={handleItemSelect}
              />
            ))}
            {isFetching && page > 1 && (
              <div className="flex items-center justify-center py-4 bg-neutral-50">
                <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white min-h-[160px]">
            <div className="text-neutral-500 text-sm">
              {apiError ? 'Error loading data' : config.emptyMessage}
            </div>
          </div>
        )}
      </div>
    );
  }

  const avatarProps = selectedItem ? config.getAvatarProps(selectedItem) : null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <div
          ref={triggerRef}
          className={`flex items-center justify-between gap-2 border border-neutral-300 rounded-md cursor-text px-2 py-0.5 relative transition-colors focus-within:border-neutral-400 w-full ${className}`}
          onClick={handleTriggerClick}
        >
          {avatarProps ? (
            <div className="flex w-full py-1 px-2 items-center gap-2">
              <ManageAvatar {...avatarProps} size="sm" />
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
        {/* Content */}
        {isFetching && page === 1 ? (
          <div className="flex-1 flex items-center justify-center bg-white min-h-[160px]">
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
              <DropdownItem
                key={item._id}
                item={item}
                isSelected={selectedItem?._id === item._id}
                config={config}
                selectType={selectType}
                onSelect={handleItemSelect}
              />
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

// Maps the `slug` prop onto a select type, then mounts the body keyed on it.
// The key matters: the body picks its query hook by type, so if a caller ever
// swapped `slug` on a mounted dropdown, an unkeyed body would change hook
// order between renders. Keying makes that a remount instead, which is also
// the right behaviour - a member list and a sprint list share no state.
const DynamicDropdownSelector = ({ slug = null, ...props }) => {
  const selectType =
    slug === "team"
      ? SELECT_TYPES.TEAM
      : slug === "member"
        ? SELECT_TYPES.MEMBER
        : slug === "sprint"
          ? SELECT_TYPES.SPRINT
          : slug === 'parent' ? SELECT_TYPES.PARENT : null;

  const config = SELECT_CONFIG[selectType];
  // An unrecognised slug has no config and no query. Previously this threw on
  // the first read of config.placeholder; rendering nothing is safer and no
  // working call site reaches this branch.
  if (!config) return null;

  return (
    <DropdownSelectorBody
      key={selectType}
      selectType={selectType}
      config={config}
      {...props}
    />
  );
};

export default DynamicDropdownSelector;