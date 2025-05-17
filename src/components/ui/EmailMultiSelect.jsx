// components/ui/EmailMultiSelect/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ButtonLoader from "@/components/ui/buttonLoader";
import { useToast } from "@/hooks/use-toast";
import { useAddPeopleMutation, useCreateTeamMutation, useGetMemberListQuery } from "@/redux/api/company/api";
import { useGetRolesQuery } from "@/redux/api/authApi";

export const EmailMultiSelect = ({
  slug,
  isOpen,
  onOpenChange,
  userData,
  onSuccess,
}) => {
  const { toast } = useToast();
  const isForPeople = slug === "for_people";
  const isForTeam = slug === "for_team";

  // State for both modes
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Values state
  const [emails, setEmails] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const shouldFetchRole = isOpen && isForPeople

  // API hooks
  const [addPeople, { isLoading: isAddingPeople }] = useAddPeopleMutation();
  const [addTeam, { isLoading: isCreatingTeam }] = useCreateTeamMutation();
  console.log("isForPeople", isForPeople)
  const { data: roleData } = useGetRolesQuery(undefined,{
    skip : !shouldFetchRole  
  });
  const { data: memberResponse, isFetching } = useGetMemberListQuery(
    isForTeam && isDropdownOpen && debouncedSearchTerm.trim() ? debouncedSearchTerm : undefined,
    { skip: isForPeople }
  );

  // Role options
  const roleOptions = useMemo(() => {
    return roleData?.data[0].roles?.map(role => ({
      value: role.slug,
      label: role.role
    })) || [];
  }, [roleData]);

  // Member suggestions for team mode
  const memberSuggestions = useMemo(() => {
    if (!memberResponse?.data || isForPeople) return [];
    return memberResponse?.data?.map(member => ({
      label: `${member.first_name} ${member.last_name}`,
      value: member._id,
      email: member.email
    }));
  }, [memberResponse, isForPeople]);

  useEffect(() => {
    if (isOpen && isForTeam && userData) {
      setTeamMembers([{
        label: `${userData.first_name} ${userData.last_name}`,
        value: userData.member_id,
        email: userData.email,
        isCurrentUser: true
      }]);
    } else if (!isOpen) {
      // Clear everything when dialog closes
      setEmails([]);
      setTeamMembers([]);
      setTeamName("");
      setSelectedRole("");
      setInputValue("");
    }
  }, [isOpen, isForTeam, userData]);

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(inputValue);
    }, 500);

    return () => clearTimeout(timerId);
  }, [inputValue]);

  const hasAtSymbol = useMemo(() => inputValue.includes('@'), [inputValue]);
  const displayValues = isForPeople ? emails : teamMembers;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidInput = useMemo(() => {
    return isForPeople ? validateEmail(inputValue) : inputValue.trim() !== "";
  }, [inputValue, isForPeople]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && inputValue && isValidInput) {
      if (isForPeople) {
        addEmail(inputValue);
      } else {
        addTeamMember({
          label: inputValue,
          value: inputValue,
          email: inputValue
        });
      }
    } else if (e.key === "Backspace" && !inputValue && displayValues.length > 0) {
      removeItem(displayValues[displayValues.length - 1]);
    }
  };

  const addEmail = (email) => {
    if (!validateEmail(email)) return;
    if (!emails.includes(email)) {
      setEmails([...emails, email]);
    }
    setInputValue("");
    setIsDropdownOpen(false);
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
    if (isForPeople) {
      setEmails(emails.filter(e => e !== item));
    } else {
      // if (item.isCurrentUser) return; // Prevent removing default user
      setTeamMembers(teamMembers.filter(m => m.value !== item.value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isForPeople) {
        if (emails.length === 0) return;

        const response = await addPeople({
          emails,
          role: selectedRole
        }).unwrap();

        if (response.status === 200) {
          toast({
            title: "Invitation sent",
            description: response.message,
            variant: "success",
          });
          resetForm();
          onSuccess?.();
        }
      } else if (isForTeam) {
        if (teamMembers.length === 0 || !teamName) return;

        const memberIds = teamMembers.map(member => member.value);
        const payload = {
          team_name: teamName,
          member_ids: memberIds,
          created_by: userData._id
        };

        const response = await addTeam(payload).unwrap();

        if (response.status === 200) {
          toast({
            title: "Team created successfully",
            description: response.message,
            variant: "success",
          });
          resetForm();
          onSuccess?.();
        }
      }
    } catch (error) {
      toast({
        title: isForPeople ? "Invitation failed" : "Team creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEmails([]);
    setTeamMembers(isForTeam && userData ? [{
      label: `${userData.first_name} ${userData.last_name}`,
      value: userData._id,
      email: userData.email,
      isCurrentUser: true
    }] : []);
    setTeamName("");
    setSelectedRole("");
    setInputValue("");
    onOpenChange(false);
  };

  const shouldShowDropdown = isDropdownOpen &&
    ((isForPeople && inputValue && hasAtSymbol) ||
      (isForTeam && debouncedSearchTerm));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-neutral-500">
            {isForPeople ? "Add people to jira" : "Create your team"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {isForTeam && (
            <div className="flex items-start flex-col gap-y-2 mb-4">
              <Label className="text-neutral-600 text-sm font-normal">
                Team name
              </Label>
              <Input
                type="text"
                placeholder="e.g. HR Team, Development Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <span className='text-neutral-500 text-xs font-normal mt-0'>
                Your team name will be unique and different
              </span>
            </div>

          )}

          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center p-2 border border-neutral-300 w-full rounded-md bg-neutral-100 ">
              {displayValues?.map(item => (
                <Badge
                  key={isForPeople ? item : item.value}
                  className="flex items-center gap-1 bg-neutral-500"
                >
                  {isForPeople ? item : item.label}
                  {/* {(!isForPeople) && ( */}
                  <XCircle
                    className="h-4 w-4 cursor-pointer"
                    onClick={() => removeItem(item)}
                  />
                  {/* )} */}
                </Badge>
              ))}
              <input
                type={isForPeople ? "email" : "text"}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                placeholder={displayValues?.length > 0 ? "" :
                  (isForPeople ? "Add email addresses..." : "Add team members...")}
                className="flex-1 min-w-[100px] outline-none bg-transparent"
              />
            </div>
            {isForPeople && (
              <span className='text-neutral-500 text-xs font-normal mt-0'>
                You can add at least 20 members with specific roles
              </span>
            )}
            {isForTeam && (
              <span className='text-neutral-500 text-xs font-normal mt-0'>
                You can invite up to 20 people at once.
              </span>
            )}
          </div>

          {shouldShowDropdown && (
            <div className="absolute z-10 w-[calc(100%-32px)] mt-1 bg-neutral-100 shadow-lg rounded-md border">
              {isForTeam && isFetching ? (
                <div className="p-2 text-sm text-neutral-500">Searching members...</div>
              ) : isForTeam && memberSuggestions.length > 0 ? (
                <div className="py-2">
                  {memberSuggestions.map(option => (
                    <div
                      key={option.value}
                      className="py-2 px-2 hover:bg-neutral-200 cursor-pointer "
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
              ) : isForTeam ? (
                <div className="p-2 text-sm text-neutral-500">
                  No members found matching "{debouncedSearchTerm}"
                </div>
              ) : (inputValue && isForPeople) && (
                <div className="p-2 hover:bg-neutral-100 cursor-pointer"
                  onMouseDown={() => addEmail(inputValue)}>
                  <div className="font-medium">
                    Add email address
                  </div>
                  <div className="text-sm text-neutral-400">
                    {inputValue}
                  </div>
                </div>
              )}
            </div>
          )}

          {isForPeople && (
            <div className="mt-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roleOptions.map((role, index) => (
                      <SelectItem key={index} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="text-neutral-500 text-xs font-normal">
                Select a role for the new members
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="default"
            onClick={resetForm}
            disabled={isForPeople ? isAddingPeople : isCreatingTeam}
          >
            Cancel
          </Button>
          <ButtonLoader
            variant="teritary"
            className="py-0 px-6"
            onClick={handleSubmit}
            isLoading={isForPeople ? isAddingPeople : isCreatingTeam}
          >
            {isForPeople ? "Add" : "Create team"}
          </ButtonLoader>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};