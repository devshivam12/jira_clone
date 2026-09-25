import { useMemo, useState } from "react";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ColumnMenu from "./ColumnMenu";
import FilterPanel from "./FilterPanel";
import { FILTER_BY_ID, LIST_FILTERS, isFilterInUse } from "./listFilters";

// What a chip says after its name, so a closed chip still tells the user what
// it is doing.
const chipValueText = (filter, values, chosenNames) => {
    if (filter.kind === 'text') {
        return values.search ? `"${values.search}"` : '';
    }

    if (filter.kind === 'boolean') {
        const value = values[filter.valueKey];
        if (value === true) return 'Yes';
        if (value === false) return 'No';
        return '';
    }

    if (filter.kind === 'dates') {
        const asDay = (iso) => (iso ? String(iso).slice(0, 10) : '');
        const from = asDay(values[filter.fromKey]);
        const to = asDay(values[filter.toKey]);
        if (from && to) return `${from} to ${to}`;
        if (from) return `after ${from}`;
        if (to) return `before ${to}`;
        return '';
    }

    const selected = values[filter.valueKey] || [];
    if (selected.length === 0) return '';
    if (selected.length === 1) {
        const names = chosenNames[filter.valueKey] || {};
        return names[selected[0]] || '1 selected';
    }
    return `${selected.length} selected`;
};

// One filter in the toolbar. Its options open under it, and the cross takes the
// filter off - along with whatever it was filtering on, so nothing keeps
// narrowing the list out of sight.
const FilterChip = ({ filter, filters }) => {
    const inUse = isFilterInUse(filter, filters.values);
    const valueText = chipValueText(filter, filters.values, filters.chosenNames);

    return (
        <div
            className={`flex items-center rounded-md border text-sm ${
                inUse ? 'border-blue-300 bg-blue-50' : 'border-neutral-300 bg-white'
            }`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <button type="button" className="flex items-center gap-1.5 py-1.5 pl-2.5 pr-1.5">
                        <span className="font-medium text-neutral-600">{filter.label}</span>
                        {valueText && <span className="max-w-[160px] truncate text-neutral-500">{valueText}</span>}
                        <ChevronDown size={14} className="text-neutral-400" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                    <FilterPanel
                        filter={filter}
                        values={filters.values}
                        chosenNames={filters.chosenNames}
                        optionLists={filters.optionLists}
                        onToggleValue={filters.toggleValue}
                        onSetValue={filters.setValue}
                        searchInput={filters.searchInput}
                        onSearchInput={filters.setSearchInput}
                    />
                    {inUse && (
                        <div className="border-t p-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-full text-xs"
                                onClick={() => filters.clearFilterValues(filter.id)}
                            >
                                Clear this filter
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            <button
                type="button"
                title={`Remove the ${filter.label.toLowerCase()} filter`}
                onClick={() => filters.closeFilter(filter.id)}
                className="mr-1 rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
            >
                <X size={13} />
            </button>
        </div>
    );
};

// The "Filter" button: every filter the list offers, with a search box because
// the list is long. Picking one puts its chip in the toolbar.
const AddFilterMenu = ({ filters }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const matches = useMemo(() => {
        const term = search.trim().toLowerCase();
        return LIST_FILTERS.filter((filter) => !term || filter.label.toLowerCase().includes(term));
    }, [search]);

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <Button size="sm" variant="advanceMuted" className="h-9 px-3 text-sm">
                    <Filter size={15} className="mr-1.5" />
                    Filter
                    {filters.activeCount > 0 && (
                        <span className="ml-1.5 rounded bg-blue-100 px-1.5 text-[11px] font-medium text-blue-700">
                            {filters.activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-64 p-0">
                <div className="border-b p-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search filters"
                            className="h-8 pl-8 text-sm"
                        />
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                    {matches.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => {
                                filters.openFilter(filter.id);
                                setOpen(false);
                                setSearch("");
                            }}
                            className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100"
                        >
                            {filter.label}
                            {isFilterInUse(filter, filters.values) && (
                                <span className="text-[11px] text-blue-600">in use</span>
                            )}
                        </button>
                    ))}

                    {matches.length === 0 && (
                        <p className="px-2 py-6 text-center text-sm text-neutral-500">No filter by that name.</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

// Search, filters and the column menu. `filters` is everything useListFilters
// returns plus the project's option lists, handed over as one object so this
// file does not grow a prop per filter.
const ListToolbar = ({ filters, columns }) => (
    <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
                value={filters.searchInput}
                onChange={(event) => filters.setSearchInput(event.target.value)}
                placeholder="Search this list"
                className="h-9 w-[240px] pl-8 pr-8 text-sm"
            />
            {filters.searchInput && (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => filters.setSearchInput("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100"
                >
                    <X size={14} />
                </button>
            )}
        </div>

        <AddFilterMenu filters={filters} />

        {filters.visibleFilterIds.map((id) => (
            <FilterChip key={id} filter={FILTER_BY_ID[id]} filters={filters} />
        ))}

        {filters.activeCount > 0 && (
            <Button size="sm" variant="ghost" className="h-9 px-2 text-xs" onClick={filters.clearAll}>
                Clear all
            </Button>
        )}

        <div className="ml-auto">
            <ColumnMenu
                visibleIds={columns.visibleIds}
                onToggle={columns.toggleColumn}
                onReset={columns.resetColumns}
            />
        </div>
    </div>
);

export default ListToolbar;
