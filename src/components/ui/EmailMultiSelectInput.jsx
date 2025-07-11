// components/ui/TeamMultiSelect/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Search, XCircle } from "lucide-react";

import { useSearchMemberQuery } from "@/redux/api/company/team";
import ShowToast from "../common/ShowToast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Label } from "./label";
import { Button } from "./button";
import ButtonLoader from "./buttonLoader";
import { useGetAllCompanyProjectQuery } from "@/redux/api/company/api";

export const EmailMultiSelectInput = ({
    onSuccess,
    isOpen,
    onOpenChange,
    // placeholder = "Add team members...",
    isLoading = false,
    disabled = false,
    slug = null
}) => {
    const isForProject = slug === 'add_project'
    const isForPeople = slug === 'add_member'
    console.log('isForProject', isForProject)
    console.log("isForPeople", isForPeople)
    // State
    const [inputValue, setInputValue] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [debouncedSearchProject, setDebouncedSearchProject] = useState("");
    const [teamMembers, setTeamMembers] = useState([]);

    const [projectInputValue, setProjectInputValue] = useState("")
    const [projectData, setProjectData] = useState([])

    // API hook
    const { data: memberResponse, isFetching: memberFetching } = useSearchMemberQuery(
        isDropdownOpen && isForPeople && debouncedSearchTerm.trim() ? debouncedSearchTerm : undefined
    );

    const { data: allProjectData, isFetching: projectLoading } = useGetAllCompanyProjectQuery({
        allData: true,
        search: debouncedSearchProject.trim() ? debouncedSearchProject : undefined
    })

    // Member suggestions
    const memberSuggestions = useMemo(() => {
        if (!memberResponse?.data) return [];
        return memberResponse?.data?.map(member => ({
            label: `${member.first_name} ${member.last_name}`,
            value: member._id,
            email: member.email
        }));
    }, [memberResponse]);

    const projectSuggestions = useMemo(() => {
        if (!allProjectData?.data) return []
        return allProjectData?.data?.map(project => ({
            label: `${project.name}`,
            value: project._id,
            name: project.name
        }))
    }, [allProjectData])

    // Reset when dialog closes
    useEffect(() => {
        if (isForPeople) {
            setTeamMembers([]);
            setInputValue("");
        }
        else {
            setProjectData([]);
            setProjectInputValue("");
        }
    }, [isForPeople, isForProject]);

    // Debounce search term
    useEffect(() => {
        let timerId;
        if (isForPeople) {
            timerId = setTimeout(() => {
                setDebouncedSearchTerm(inputValue);
            }, 300);
        }
        else {
            timerId = setTimeout(() => {
                setDebouncedSearchProject(projectInputValue);
            }, 300);
        }

        return () => clearTimeout(timerId);
    }, [inputValue, projectInputValue]);

    const handleInputChange = (e) => {
        if (isForPeople) {
            setInputValue(e.target.value);
            if (e.target.value.trim()) {
                setIsDropdownOpen(true);
            }
        }
        else {
            setProjectInputValue(e.target.value)
            if (e.target.value.trim()) {
                setIsDropdownOpen(true);
            }
        }
    };

    const handleInputKeyDown = (e) => {

        if (isForPeople) {
            if (e.key === "Enter" && inputValue.trim()) {
                addTeamMember({
                    label: inputValue,
                    value: inputValue,
                    email: inputValue
                });
            } else if (e.key === "Backspace" && !inputValue && teamMembers.length > 0) {
                removeItem(teamMembers[teamMembers.length - 1]);
            }
        }
        else {
            if (e.key === "Enter" && projectInputValue.trim()) {
                addProjectData({
                    label: projectInputValue,
                    value: projectInputValue,
                    name: projectInputValue
                });
            } else if (e.key === "Backspace" && !projectInputValue && projectData.length > 0) {
                removeItem(projectData[projectData.length - 1]);
            }
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

    const addProjectData = (project) => {
        if (!project.label?.trim()) return;
        if (!projectData.some(p => p.value === project.value)) {
            setProjectData([...projectData, project])
        }
        setProjectInputValue("");
        setIsDropdownOpen(false)
    }

    const removeItem = (item) => {
        if (isForPeople) {
            setTeamMembers(teamMembers.filter(m => m.value !== item.value));
        }
        else {
            setProjectData(projectData.filter(p => p.value !== item.value))
        }
    };

    const resetForm = () => {
        if (isForPeople) {
            setTeamMembers([]);
            setInputValue("");
            onOpenChange(false);
        }
        else {
            setProjectData([]);
            setProjectInputValue("");
            onOpenChange(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isForPeople && teamMembers.length === 0) return;
            if (isForProject && projectData.length === 0) return;

            const payload = isForPeople
                ? teamMembers.map(m => m.value)
                : projectData.map(p => p.value);

            const data = await onSuccess?.(payload);
            if (data?.status === 200) resetForm();
        } catch (error) {
            ShowToast.error('Operation failed', {
                description: error.message,

            });
            console.log("error", error)
        }
    };

    const shouldShowDropdown = isForPeople ? isDropdownOpen && debouncedSearchTerm : isDropdownOpen && debouncedSearchProject;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-100 w-96">
                <DialogHeader>
                    <DialogTitle className="text-neutral-500">
                        {isForPeople ? 'Add member in your team' : 'Add project in your team'}
                    </DialogTitle>
                </DialogHeader>
                <div className="text-justify leading-tight">
                    <span className="text-neutral-500 font-normal text-sm">
                        {isForPeople ? 'Grow your team and work better together. Adding people to this team gives them access to all the team’s work.' : 'Collaborate on projects to achieve more, Add a project to organize tasks and track progress together.'}
                    </span>
                </div>

                <div className="relative">
                    <Label className="text-neutral-500 ">
                        {isForPeople ? 'Search name' : 'Search project'}
                    </Label>
                    {
                        isForPeople ? (
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
                                        placeholder='Add team member....'
                                        className="flex-1 min-w-[100px] outline-none bg-transparent font-normal text-sm cursor-pointer"
                                        disabled={disabled}
                                    />
                                    <Search className="text-neutral-400 " size={15} />
                                </div>
                            </div>


                        ) : (
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
                                        value={projectInputValue}
                                        onChange={handleInputChange}
                                        onKeyDown={handleInputKeyDown}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        onBlur={() => setIsDropdownOpen(false)}
                                        placeholder='Search project by name or key....'
                                        className="flex-1 min-w-[100px] outline-none bg-transparent font-normal text-sm cursor-pointer"
                                        disabled={disabled}
                                    />
                                    <Search className="text-neutral-400 " size={15} />
                                </div>
                            </div>
                        )
                    }
                    <div>
                        <span className="text-neutral-500 font-normal text-xs">
                            {isForPeople && 'Add up to 10 members at a time'}
                        </span>
                    </div>

                    {shouldShowDropdown && isForPeople && (
                        <div className="absolute z-10 w-full mt-1 bg-neutral-100 shadow-lg rounded-md border">
                            {memberFetching ? (
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

                    {shouldShowDropdown && isForProject && (
                        <div className="absolute z-10 w-full mt-1 bg-neutral-100 shadow-lg rounded-md border">
                            {projectLoading ? (
                                <div className="p-2 text-sm text-neutral-500">Searching project with name or project key...</div>
                            ) : projectSuggestions.length > 0 ? (
                                <div className="py-2">
                                    {projectSuggestions.map(option => (
                                        <div
                                            key={option.value}
                                            className="py-2 px-2 hover:bg-neutral-200 cursor-pointer"
                                            onMouseDown={() => addProjectData(option)}
                                        >
                                            <div className="font-medium text-neutral-500">
                                                {option.label}
                                            </div>
                                            <div className="text-sm text-neutral-400">
                                                {option.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-2 text-sm text-neutral-500">
                                    No project found matching "{debouncedSearchProject}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="default"
                        onClick={resetForm}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <ButtonLoader
                        variant="teritary"
                        className="py-0 px-6"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                    >
                        Add
                    </ButtonLoader>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};