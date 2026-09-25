import { useCallback, useEffect, useMemo, useState } from "react";
import { FILTER_BY_ID, LIST_FILTERS, filterPayloadKeys, isFilterInUse } from "./listFilters";

// Typing settles before a request goes out. Filtering runs on the server, so a
// key press must not be a request.
const SEARCH_DELAY = 400;

// Holds what the user is filtering on, and turns it into the payload the
// server's getListView expects.
//
// The search box and the "Summary" filter are the same value on purpose, so the
// two can never disagree about what is being searched for.
export function useListFilters() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    // Chosen values, keyed by the payload field they belong to.
    const [values, setValues] = useState({});
    // Which filters are on screen as chips. A filter can be open with nothing
    // chosen yet, which is how the user gets to its options.
    const [openIds, setOpenIds] = useState([]);
    // Readable names for the ids that were ticked, so a chip can say
    // "Assignee: Priya Sharma" instead of an id. Only used for display.
    const [chosenNames, setChosenNames] = useState({});

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DELAY);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const openFilter = useCallback((filterId) => {
        setOpenIds((current) => (current.includes(filterId) ? current : [...current, filterId]));
    }, []);

    const closeFilter = useCallback((filterId) => {
        const filter = FILTER_BY_ID[filterId];
        setOpenIds((current) => current.filter((id) => id !== filterId));
        if (!filter) return;
        // Removing the chip also drops what it was filtering on. A chip left
        // behind with a value the user cannot see would be a hidden filter.
        if (filter.kind === 'text') {
            setSearchInput("");
            return;
        }
        setValues((current) => {
            const next = { ...current };
            filterPayloadKeys(filter).forEach((key) => delete next[key]);
            return next;
        });
    }, []);

    // Ticks or unticks one option of a list filter.
    const toggleValue = useCallback((payloadKey, value, name) => {
        setValues((current) => {
            const list = current[payloadKey] || [];
            const next = list.includes(value)
                ? list.filter((item) => item !== value)
                : [...list, value];
            return { ...current, [payloadKey]: next };
        });

        if (name === undefined) return;
        setChosenNames((current) => ({
            ...current,
            [payloadKey]: { ...(current[payloadKey] || {}), [value]: name }
        }));
    }, []);

    // Used by the yes/no and the date filters, which hold a single value.
    const setValue = useCallback((payloadKey, value) => {
        setValues((current) => {
            const next = { ...current };
            if (value === undefined || value === null || value === '') delete next[payloadKey];
            else next[payloadKey] = value;
            return next;
        });
    }, []);

    const clearFilterValues = useCallback((filterId) => {
        const filter = FILTER_BY_ID[filterId];
        if (!filter) return;
        if (filter.kind === 'text') {
            setSearchInput("");
            return;
        }
        setValues((current) => {
            const next = { ...current };
            filterPayloadKeys(filter).forEach((key) => delete next[key]);
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        setValues({});
        setOpenIds([]);
        setSearchInput("");
    }, []);

    // The whole picture the chips read from: the chosen values plus the search
    // term, which the Summary chip shows as its own value.
    const displayValues = useMemo(
        () => ({ ...values, search: search }),
        [values, search]
    );

    // What goes to the server. Empty lists and empty strings are left out so a
    // filter that is open but unused costs nothing.
    const filter = useMemo(() => {
        const payload = {};

        Object.entries(values).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (value.length) payload[key] = value;
            } else if (value !== undefined && value !== null && value !== '') {
                payload[key] = value;
            }
        });

        if (search) payload.search = search;
        return payload;
    }, [values, search]);

    const activeCount = useMemo(
        () => LIST_FILTERS.filter((entry) => isFilterInUse(entry, displayValues)).length,
        [displayValues]
    );

    // Chips shown in the toolbar: the ones the user opened, plus any that are
    // in use. The second half matters after a reload of the page, and for the
    // search box writing to the Summary filter.
    const visibleFilterIds = useMemo(() => {
        const ids = new Set(openIds);
        LIST_FILTERS.forEach((entry) => {
            // The search box is already on screen, so the Summary chip only
            // shows when the user asked for it from the menu.
            if (entry.kind === 'text') return;
            if (isFilterInUse(entry, displayValues)) ids.add(entry.id);
        });
        return LIST_FILTERS.filter((entry) => ids.has(entry.id)).map((entry) => entry.id);
    }, [openIds, displayValues]);

    return {
        searchInput,
        setSearchInput,
        filter,
        values: displayValues,
        chosenNames,
        visibleFilterIds,
        activeCount,
        openFilter,
        closeFilter,
        toggleValue,
        setValue,
        clearFilterValues,
        clearAll
    };
}
