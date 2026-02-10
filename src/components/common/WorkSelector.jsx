import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const WorkSelector = ({ initialValue, workTypes, onChange, ...props }) => {
    const [selectedWork, setSelectedWork] = useState(null);

    useEffect(() => {
        if (initialValue && workTypes && workTypes.length > 0) {
            const matchedType = workTypes.find(slug => slug.value === initialValue);
            if (matchedType) {
                setSelectedWork(matchedType);
            } else {
                setSelectedWork(null);
            }
        }
    }, [initialValue, workTypes]);

    const handleValueChange = (value) => {
        const selected = workTypes.find(type => type.value === value);
        setSelectedWork(selected);
        onChange?.(value);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedWork(null);
        onChange?.(null);
    };

    if (!workTypes || workTypes.length === 0) {
        return <div className="text-neutral-500">No work types available.</div>;
    }

    const getItemClassName = (item) => {
        const isSelected = selectedWork?.value === item?.value;
        return [
            "flex items-center gap-x-5 py-2 px-6 bg-neutral-50 cursor-pointer relative transition-colors text-neutral-500 font-medium",
            "hover:bg-neutral-200/20 hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-neutral-400 hover:before:rounded-full",
            isSelected && "bg-neutral-200/40 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-neutral-400 before:rounded-full border"
        ].filter(Boolean).join(" ");
    };


    return (

        <Select
            value={selectedWork?.value || ''}
            onValueChange={handleValueChange}
            {...props}
        >
            <SelectTrigger
                className={`flex items-center gap-2 border-none rounded-md px-2 py-0.5 transition-colors w-30 text-start h-auto ${selectedWork?.color ? selectedWork.color : 'bg-white'}`}
            >
                {selectedWork ? (
                    <div className="py-1">
                        <span className={`text-sm font-medium truncate ${selectedWork.color && 'text-white'}`}>
                            {selectedWork.name}
                        </span>
                    </div>
                ) : (
                    <SelectValue
                        placeholder="Select work type"
                        className="text-sm text-neutral-400"
                    />
                )}
            </SelectTrigger>

            <SelectContent
                className="bg-neutral-50 p-0"
            >
                {workTypes.map((type) => (
                    <SelectItem
                        key={type.id}
                        value={type.value}
                        className={getItemClassName(type)}
                    >
                        <div className="flex items-center gap-2 w-full">
                            {/* {type.icon && (
                                <span className="text-lg" role="img" aria-label={type.name}>
                                    {type.icon}
                                </span>
                            )} */}
                            <span className="text-sm truncate flex-1 text-neutral-500">{type.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default WorkSelector;