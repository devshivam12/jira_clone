import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";

export const EmailMultiSelect = ({
  value = [],
  onChange,
  placeholder = "Add email addresses...",
  suggestions = null,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);



  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (!inputValue) return suggestions;
    return suggestions.filter(option =>
      option.value.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, suggestions]);



  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && inputValue) {
      if (validateEmail(inputValue)) {
        const newEmails = [...value, inputValue];
        onChange(newEmails);
        setInputValue("");
        setIsDropdownOpen(false);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      const newEmails = [...value];
      newEmails.pop();
      onChange(newEmails);
    }
  };

  const addEmail = (email) => {
    const newEmails = [...value, email];
    onChange(newEmails);
    setInputValue("");
    setIsDropdownOpen(false);
  };

  const removeEmail = (email) => {
    const newEmails = value.filter(e => e !== email);
    onChange(newEmails);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const shouldShowDropdown = useMemo(() => {
    return isDropdownOpen && (
      (inputValue && validateEmail(inputValue)) ||
      (suggestions && filteredSuggestions.length > 0)
    );
  }, [isDropdownOpen, inputValue, suggestions, filteredSuggestions]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex flex-wrap gap-2 items-center p-2 border border-neutral-300 w-full rounded-md bg-neutral-100">
        {value.map(email => (
          <Badge key={email} className="flex items-center gap-1 bg-neutral-500">
            {email}
            <XCircle
              className="h-4 w-4 cursor-pointer"
              onClick={() => removeEmail(email)}
            />
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] outline-none bg-transparent"
        />
      </div>

      {shouldShowDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-100 text-popover-foreground shadow-lg rounded-md border">
          {inputValue && validateEmail(inputValue) && (
            <div className="py-2 border-b">
              <div
                className="hover:bg-neutral-200 rounded-sm cursor-pointer py-2 px-2"
                onMouseDown={() => addEmail(inputValue)}
              >
                <div className="font-medium">Select an email address</div>
                <div className="text-sm text-muted-foreground">{inputValue}</div>
              </div>
            </div>
          )}

          {suggestions && filteredSuggestions.length > 0 && (
            <div className="p-2">
              {filteredSuggestions.map(option => (
                <div
                  key={option.value}
                  className="p-2 hover:bg-accent cursor-pointer"
                  onMouseDown={() => addEmail(option.value)}
                >
                  <div className="font-medium text-neutral-500">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};