import React, { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DottedSeparator } from '@/components/dotted-separator';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Ensure you import Avatar

const assignUser = [
    { label: "User 1", icon: <Avatar><AvatarFallback>U1</AvatarFallback></Avatar> },
    { label: "User 2", icon: <Avatar><AvatarFallback>U2</AvatarFallback></Avatar> },
    { label: "User 3", icon: <Avatar><AvatarFallback>U3</AvatarFallback></Avatar> }
];

const SelectTeam = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    
    return (
        <Popover open={open} onOpenChange={setOpen} className="relative z-50">
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full flex items-center justify-start px-3 py-2 rounded-sm text-neutral-500"
                >
                    {value
                        ? assignUser.find((user) => user.label === value)?.label
                        : "Select your team..."}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <Command>
                    <CommandInput placeholder="Search your team..." className="h-9" />
                    <DottedSeparator className="my-1" />
                    <CommandList>
                        <CommandEmpty>No team found.</CommandEmpty>
                        <CommandGroup className="p-0">
                            {assignUser.map((user) => (
                                <CommandItem
                                    key={user.label}
                                    value={user.label}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                    className="py-2 rounded-none flex items-center"
                                >
                                    {user.icon}
                                    <span className="ml-2">{user.label}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === user.label ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default SelectTeam;
