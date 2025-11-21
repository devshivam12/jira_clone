import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import ManageAvatar from "./ManageAvatar";


const UtilityDropdownSelector = ({ data = [], onChange, label = "Select option", defaultValue = null, iconType = 'avatar' }) => {
    // console.log("Data", data)
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const inputRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Only run on initial mount or when defaultValue changes
        if (isInitialized && !defaultValue) return;

        let defaultItem = null;

        if (defaultValue && data.length > 0) {
            defaultItem = data.find((item) => item.value === defaultValue);
        }

        if (!defaultItem && data.length > 0) {
            defaultItem = data.find((item) => item.isDefault);
        }

        if (defaultItem) {
            setSelectedItem(defaultItem);
            onChange?.(defaultItem);
            setIsInitialized(true);
        }
    }, [data, defaultValue]);

    const filteredItems = data.filter((item) =>
        item.label.toLowerCase().includes(searchValue.toLowerCase())
    );
    // console.log("filteredItems", filteredItems)
    // Item selection handler
    const handleItemSelect = useCallback(
        (item) => {
            setSelectedItem(item);
            onChange?.(item);
            setSearchValue("");
            setIsOpen(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        },
        [onChange]
    );

    // Clear selection handler
    const handleClear = useCallback(
        (e) => {
            e.stopPropagation();
            setSelectedItem(null);
            onChange?.(null);
            setSearchValue("");
            setTimeout(() => inputRef.current?.focus(), 0);
        },
        [onChange]
    );

    // Focus input when popover opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    const getItemClassName = (item) => {
        const isSelected = selectedItem?.value === item.value;
        return [
            "flex items-center gap-x-5 py-2 px-6 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium",
            "hover:bg-neutral-200/20 hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-neutral-400 hover:before:rounded-full",
            isSelected && "bg-neutral-200/40 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border font-semibold"
        ].filter(Boolean).join(" ");
    };

    const renderIcon = (item) => {
        if (iconType === "icon" && item.icon && item.color) {
            return <div className={`w-6 h-6 rounded-md flex items-center justify-center ${item.color}`}>
                <img
                    src={item.icon}
                    className="w-4 h-4 filter brightness-0 invert"
                />
            </div>
        } else if (iconType === "avatar") {
            return (
                <ManageAvatar
                    firstName={item.label}
                    image={item.icon}
                    size="sm"
                />
            );
        } else if (iconType === "contain" && item.color) {
            return (
                <div className={`w-4 h-4 rounded-full ${item.color}`} />
            );
        }
        return null;
    };

    return (

        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className={`flex items-center gap-2 border border-neutral-300 rounded-md cursor-text px-2 py-0.5 relative transition-colors focus-within:border-neutral-400 
        ${iconType === "contain" && selectedItem?.color ? selectedItem.color : ""}`}
                    onClick={() => {
                        setIsOpen(true)
                        setSearchValue("");
                    }}
                    style={{ width: 300 }}
                >

                    {selectedItem ? (
                        <div className="flex w-full py-1 px-2 items-center gap-2">
                            {renderIcon(selectedItem)}
                            <span className={`text-sm font-medium truncate flex-1 text-neutral-500 ${iconType === "contain" && "text-white"}`}>
                                {selectedItem.label}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    if (!isOpen) {
                                        setIsOpen(true);
                                    }
                                }}
                                placeholder={label}
                                className="flex-1 bg-transparent outline-none py-1 px-2 my-1 w-full text-sm text-neutral-700 placeholder:text-neutral-400"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        {selectedItem && (
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClear(e)
                                }}
                                className={`p-1 hover:bg-neutral-100 rounded transition-colors ${iconType === 'contain' && 'hover:bg-neutral-200'}`}
                                type="button"
                                size="icon"
                                variant="ghost"
                            >
                                <X className={`h-4 w-4 text-gray-500 ${iconType === 'contain' && 'text-neutral-600'}`} />
                            </Button>
                        )}
                    </div>
                </div>

            </PopoverTrigger>

            {isOpen && (
                <PopoverContent
                    side="bottom"
                    align="start"
                    className="p-0"
                    style={{ minWidth: "300px" }}
                >
                    {filteredItems.length > 0 ? (
                        <ScrollArea>
                            {filteredItems.map((item) => (
                                <div
                                    key={item.value}
                                    className={getItemClassName(item)}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleItemSelect(item);
                                    }}
                                >
                                    {renderIcon(item)}
                                    <span className="text-sm truncate flex-1">{item.label}</span>
                                </div>
                            ))}
                        </ScrollArea>
                    ) : (
                        <div className="py-8 flex items-center justify-center">
                            <div className="text-gray-500 text-sm">No options found</div>
                        </div>
                    )}
                </PopoverContent>
            )}
        </Popover>

    );
};

export default UtilityDropdownSelector;