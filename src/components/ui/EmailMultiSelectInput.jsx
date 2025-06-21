// components/ui/TeamMultiSelect/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Search, XCircle } from "lucide-react";

import { useSearchMemberQuery } from "@/redux/api/company/team";
import ShowToast from "../common/ShowToast";

export const EmailMultiSelectInput = ({
    onSuccess,
    placeholder = "Add team members...",
    disabled = false,
}) => {

    // State
    const [inputValue, setInputValue] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [teamMembers, setTeamMembers] = useState([]);

    // API hook
    const { data: memberResponse, isFetching } = useSearchMemberQuery(
        isDropdownOpen && debouncedSearchTerm.trim() ? debouncedSearchTerm : undefined
    );

    // Member suggestions
    const memberSuggestions = useMemo(() => {
        if (!memberResponse?.data) return [];
        return memberResponse?.data?.map(member => ({
            label: `${member.first_name} ${member.last_name}`,
            value: member._id,
            email: member.email
        }));
    }, [memberResponse]);

    // Reset when dialog closes
    useEffect(() => {
        setTeamMembers([]);
        setInputValue("");
    }, []);

    // Debounce search term
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(inputValue);
        }, 300);

        return () => clearTimeout(timerId);
    }, [inputValue]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        if (e.target.value.trim()) {
            setIsDropdownOpen(true);
        }
    };

    const handleInputKeyDown = (e) => {

        if (e.key === "Enter" && inputValue.trim()) {
            addTeamMember({
                label: inputValue,
                value: inputValue,
                email: inputValue
            });
        } else if (e.key === "Backspace" && !inputValue && teamMembers.length > 0) {
            removeItem(teamMembers[teamMembers.length - 1]);
        }
    };

    const addTeamMember = (member) => {
        if (!member.label?.trim()) return;

        if (!teamMembers.some(m => m.value === member.value)) {
            setTeamMembers([...teamMembers, member]);
        }
        setInputValue("");
        setIsDropdownOpen(false);
    };

    const removeItem = (item) => {
        setTeamMembers(teamMembers.filter(m => m.value !== item.value));
    };

    const resetForm = () => {
        setTeamMembers([]);
        setInputValue("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (teamMembers.length === 0) return;

            onSuccess?.(teamMembers);
            resetForm();
        } catch (error) {
            ShowToast.error('Operation failed', {
                description: error.message,

            });
        }
    };

    const shouldShowDropdown = isDropdownOpen && debouncedSearchTerm;

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-2 items-center p-2 border border-neutral-300 w-full rounded-md bg-neutral-100">
                {teamMembers?.map(item => (
                    <Badge
                        key={item.value}
                        className="flex items-center gap-1 bg-neutral-500"
                    >
                        {item.label}
                        <XCircle
                            className="h-4 w-4 cursor-pointer"
                            onClick={() => removeItem(item)}
                        />
                    </Badge>
                ))}
                <div className="flex items-center justify-between w-full ">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setIsDropdownOpen(false)}
                        placeholder={teamMembers?.length > 0 ? "" : placeholder}
                        className="flex-1 min-w-[100px] outline-none bg-transparent font-normal text-sm cursor-pointer"
                        disabled={disabled}
                    />
                    <Search className="text-neutral-400 " size={15} />
                </div>
            </div>

            {shouldShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-neutral-100 shadow-lg rounded-md border">
                    {isFetching ? (
                        <div className="p-2 text-sm text-neutral-500">Searching members...</div>
                    ) : memberSuggestions.length > 0 ? (
                        <div className="py-2">
                            {memberSuggestions.map(option => (
                                <div
                                    key={option.value}
                                    className="py-2 px-2 hover:bg-neutral-200 cursor-pointer"
                                    onMouseDown={() => addTeamMember(option)}
                                >
                                    <div className="font-medium text-neutral-500">
                                        {option.label}
                                    </div>
                                    <div className="text-sm text-neutral-400">
                                        {option.email}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-2 text-sm text-neutral-500">
                            No members found matching "{debouncedSearchTerm}"
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};