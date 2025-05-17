import { DottedSeparator } from '@/components/dotted-separator'
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import ButtonLoader from '@/components/ui/buttonLoader'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useGetMemberListQuery } from '@/redux/api/company/api'
import { Search } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import TeamCard from './TeamCard'

const Team = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    slug: null
  })
  const [userData] = useState(() => {
    try {
      const storeData = localStorage.getItem("userData")
      return storeData ? JSON.parse(storeData) : null
    } catch (e) {
      console.error("Error parsing userData", e)
      return null
    }
  })
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Control command open state
  useEffect(() => {
    setIsCommandOpen(searchValue.length > 0)
  }, [searchValue])

  const { data: memberResponse, isFetching, isError } = useGetMemberListQuery(
    debouncedSearch.trim() ? debouncedSearch : undefined,
    { skip: !debouncedSearch.trim() }
  )

  const memberSuggestions = useMemo(() => {
    if (!memberResponse?.data) return []
    return memberResponse.data.map((member) => ({
      label: `${member.first_name} ${member.last_name}`,
      value: member._id,
      email: member.email,
      image: member.image,
      firstName: member.first_name,
      lastName: member.last_name,
    }))
  }, [memberResponse])

  const handleSelectMember = (memberId) => {
    const selected = memberSuggestions.find(m => m.value === memberId)
    console.log('Selected member:', selected)
    // Handle selection logic here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-500">Team</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">Manage users</Button>
          <Button variant="outline" onClick={() => setDialogState({ isOpen: true, slug: 'for_team' })}>
            Create team
          </Button>
          <Button variant="teritary" onClick={() => setDialogState({ isOpen: true, slug: 'for_people' })}>
            Add people
          </Button>
        </div>
      </div>

      {/* Search Command */}
      <div className="relative w-full">
        <Command className="rounded-md border border-neutral-300 shadow-none w-full bg-transparent" shouldFilter={false}>
          {/* <div className="flex items-center px-3 w-full"> */}
          {/* <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
          <CommandInput
            placeholder="Search teams and members..."
            className="w-full py-6 border-none outline-none border-0"
            value={searchValue}
            onValueChange={setSearchValue}
            onFocus={() => searchValue && setIsCommandOpen(true)}
            onBlur={() => setTimeout(() => setIsCommandOpen(false), 200)}
          />
          {/* </div> */}

          {isCommandOpen && (
            <CommandList className="absolute top-full left-0 right-0 z-10 mt-1 border bg-background shadow-lg bg-neutral-100">
              {isFetching ? (
                <div className="flex items-center justify-center p-4">
                  <ButtonLoader isLoading={true} size={40} />
                </div>
              ) : isError ? (
                <CommandEmpty className="p-4 text-sm text-destructive">
                  Failed to load results
                </CommandEmpty>
              ) : memberSuggestions.length === 0 ? (
                <CommandEmpty className="p-4 text-sm text-muted-foreground">
                  No members found for "{debouncedSearch}"
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup heading="Members">
                    {memberSuggestions.map((member) => (
                      <CommandItem
                        key={member.value}
                        value={member.value}
                        onSelect={handleSelectMember}
                        className="cursor-pointer aria-selected:bg-accent"
                      >
                        <div className="flex items-center gap-3 p-2">
                          <Avatar className="h-9 w-9">
                            {member.image && (
                              <AvatarImage src={member.image} alt={member.label} />
                            )}
                            <AvatarFallback className="bg-neutral-200 text-neutral-600">
                              {member.firstName?.[0]?.toUpperCase()}
                              {member.lastName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-neutral-700">
                              {member.label}
                            </p>
                            <p className="truncate text-sm text-neutral-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="border-t">
                    <div className="p-2 text-center text-sm text-muted-foreground hover:bg-accent cursor-pointer">
                      View all results for "{debouncedSearch}"
                    </div>
                  </div>
                </>
              )}
            </CommandList>
          )}
        </Command>
      </div>

      {/* Email Multi Select Dialog */}
      <EmailMultiSelect
        slug={dialogState.slug}
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
        userData={userData}
      />
      <TeamCard />
    </div>
  )
}

export default Team