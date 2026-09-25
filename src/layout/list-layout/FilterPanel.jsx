import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    useGetLabelQuery,
    useGetMemberDropdownQuery,
    useGetParentDropdownQuery,
    useGetSprintDropdownQuery,
    useGetTeamDropdownQuery
} from "@/redux/graphql_api/miscData";

const PAGE_SIZE = 20;
const SEARCH_DELAY = 400;

// The lists a 'remote' filter can read. Each entry says which query to run and
// how to read a value and a readable name out of one item, which is why the
// assignee, team, sprint, parent and label panels are all the same code.
const REMOTE_SOURCES = {
    member: {
        useQuery: useGetMemberDropdownQuery,
        items: (data) => data?.data?.memberDropdown?.members || [],
        hasMore: (data) => data?.data?.memberDropdown?.hasMore || false,
        value: (item) => item._id,
        name: (item) => [item.first_name, item.last_name].filter(Boolean).join(' ') || item.email || 'Unnamed',
        placeholder: 'Search people'
    },
    team: {
        useQuery: useGetTeamDropdownQuery,
        items: (data) => data?.data?.teamDropdown?.teams || [],
        hasMore: (data) => data?.data?.teamDropdown?.hasMore || false,
        value: (item) => item._id,
        name: (item) => item.team_name,
        placeholder: 'Search teams'
    },
    sprint: {
        useQuery: useGetSprintDropdownQuery,
        items: (data) => data?.data?.sprintDropdown?.sprints || [],
        hasMore: (data) => data?.data?.sprintDropdown?.hasMore || false,
        value: (item) => item._id,
        name: (item) => item.name,
        placeholder: 'Search sprints'
    },
    parent: {
        useQuery: useGetParentDropdownQuery,
        items: (data) => data?.data?.parentDropdown?.parents || [],
        hasMore: (data) => data?.data?.parentDropdown?.hasMore || false,
        value: (item) => item._id,
        name: (item) => item.summary,
        placeholder: 'Search epics'
    },
    label: {
        useQuery: useGetLabelQuery,
        items: (data) => data?.data?.getClientLabels?.labels || [],
        hasMore: (data) => data?.data?.getClientLabels?.hasMore || false,
        // A label is filtered by its text, not by its id.
        value: (item) => item.value,
        name: (item) => item.value,
        placeholder: 'Search labels'
    }
};

const OptionRow = ({ checked, name, onToggle }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-sm hover:bg-neutral-100">
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <span className="truncate text-neutral-600" title={name}>{name}</span>
    </label>
);

// Status, priority and work type. Their options come with the project, so this
// panel never asks the server for anything.
const StaticOptions = ({ filter, options, selected, onToggleValue }) => (
    <div className="max-h-[260px] overflow-y-auto p-1">
        {options.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-neutral-500">
                This project has no {filter.label.toLowerCase()} set up.
            </p>
        )}
        {options.map((option) => (
            <OptionRow
                key={option.value}
                checked={selected.includes(option.value)}
                name={option.name}
                onToggle={() => onToggleValue(filter.valueKey, option.value, option.name)}
            />
        ))}
    </div>
);

// People, teams, sprints, parents and labels. Searched and paged on the server,
// because a client can hold thousands of any of them.
const RemoteOptions = ({ filter, selected, chosenNames, onToggleValue }) => {
    const source = REMOTE_SOURCES[filter.remote];
    const [search, setSearch] = useState("");
    const [term, setTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loaded, setLoaded] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTerm(search.trim());
            setPage(1);
        }, SEARCH_DELAY);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isFetching } = source.useQuery({ search: term, page, limit: PAGE_SIZE });

    const pageItems = useMemo(() => source.items(data), [data, source]);
    const hasMore = source.hasMore(data);

    // Pages are added to what is already on screen, so scrolling further does
    // not throw away what the user has read.
    useEffect(() => {
        if (page === 1) {
            setLoaded(pageItems);
            return;
        }
        if (!pageItems.length) return;
        setLoaded((current) => {
            const seen = new Set(current.map((item) => source.value(item)));
            return [...current, ...pageItems.filter((item) => !seen.has(source.value(item)))];
        });
    }, [pageItems, page, source]);

    // Values already ticked are shown first, even when they are not on the page
    // that came back, so they can always be unticked again.
    const pinned = useMemo(() => {
        const names = chosenNames[filter.valueKey] || {};
        return selected.map((value) => ({ value, name: names[value] || value }));
    }, [chosenNames, filter.valueKey, selected]);

    const rest = loaded.filter((item) => !selected.includes(source.value(item)));

    return (
        <div>
            <div className="border-b p-2">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                        autoFocus
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={source.placeholder}
                        className="h-8 pl-8 text-sm"
                    />
                </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-1">
                {pinned.map((item) => (
                    <OptionRow
                        key={`selected-${item.value}`}
                        checked={true}
                        name={item.name}
                        onToggle={() => onToggleValue(filter.valueKey, item.value, item.name)}
                    />
                ))}

                {rest.map((item) => {
                    const value = source.value(item);
                    const name = source.name(item);
                    return (
                        <OptionRow
                            key={value}
                            checked={false}
                            name={name}
                            onToggle={() => onToggleValue(filter.valueKey, value, name)}
                        />
                    );
                })}

                {isFetching && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-neutral-500">
                        <Loader2 size={14} className="animate-spin" />
                        Loading
                    </div>
                )}

                {!isFetching && rest.length === 0 && pinned.length === 0 && (
                    <p className="px-2 py-6 text-center text-sm text-neutral-500">Nothing found.</p>
                )}

                {hasMore && !isFetching && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-8 w-full text-xs"
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Show more
                    </Button>
                )}
            </div>
        </div>
    );
};

const BooleanOptions = ({ filter, value, onSetValue }) => {
    const choose = (next) => onSetValue(filter.valueKey, value === next ? undefined : next);

    return (
        <div className="p-1">
            <OptionRow checked={value === true} name="Flagged" onToggle={() => choose(true)} />
            <OptionRow checked={value === false} name="Not flagged" onToggle={() => choose(false)} />
        </div>
    );
};

// Plain date inputs on purpose. Two calendars inside a popover is a lot of
// screen for a filter, and a date input is understood by everyone and needs
// nothing extra.
const DateOptions = ({ filter, values, onSetValue }) => {
    const asInputValue = (iso) => (iso ? String(iso).slice(0, 10) : '');

    const change = (key, text, endOfDay) => {
        if (!text) {
            onSetValue(key, undefined);
            return;
        }
        // The "to" date reads as the whole of that day, otherwise picking today
        // for both ends would match nothing.
        onSetValue(key, new Date(`${text}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`).toISOString());
    };

    return (
        <div className="space-y-3 p-3">
            <div>
                <p className="mb-1 text-xs font-medium text-neutral-500">From</p>
                <Input
                    type="date"
                    value={asInputValue(values[filter.fromKey])}
                    onChange={(event) => change(filter.fromKey, event.target.value, false)}
                    className="h-8 text-sm"
                />
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-neutral-500">To</p>
                <Input
                    type="date"
                    value={asInputValue(values[filter.toKey])}
                    onChange={(event) => change(filter.toKey, event.target.value, true)}
                    className="h-8 text-sm"
                />
            </div>
        </div>
    );
};

// The Summary filter writes to the same value as the search box above the list,
// so the two always agree on what is being searched for.
const TextOption = ({ searchInput, onSearchInput }) => (
    <div className="p-3">
        <p className="mb-1 text-xs font-medium text-neutral-500">Summary contains</p>
        <Input
            autoFocus
            value={searchInput}
            onChange={(event) => onSearchInput(event.target.value)}
            placeholder="Type a few words"
            className="h-8 text-sm"
        />
    </div>
);

// Picks the panel that suits the filter. Called by the chip in the toolbar.
const FilterPanel = ({
    filter,
    values,
    chosenNames,
    optionLists,
    onToggleValue,
    onSetValue,
    searchInput,
    onSearchInput
}) => {
    switch (filter.kind) {
        case 'options':
            return (
                <StaticOptions
                    filter={filter}
                    options={optionLists[filter.source] || []}
                    selected={values[filter.valueKey] || []}
                    onToggleValue={onToggleValue}
                />
            );

        case 'remote':
            return (
                <RemoteOptions
                    // The panel picks its query by kind, so a remount on a
                    // different kind keeps the hook order stable.
                    key={filter.remote}
                    filter={filter}
                    selected={values[filter.valueKey] || []}
                    chosenNames={chosenNames}
                    onToggleValue={onToggleValue}
                />
            );

        case 'boolean':
            return <BooleanOptions filter={filter} value={values[filter.valueKey]} onSetValue={onSetValue} />;

        case 'dates':
            return <DateOptions filter={filter} values={values} onSetValue={onSetValue} />;

        case 'text':
            return <TextOption searchInput={searchInput} onSearchInput={onSearchInput} />;

        default:
            return null;
    }
};

export default FilterPanel;
