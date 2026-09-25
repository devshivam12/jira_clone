import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_COLUMN_IDS, LIST_COLUMNS, LOCKED_COLUMN_IDS } from "./listColumns";

const storageKeyFor = (projectId) => (projectId ? `list_view_columns_${projectId}` : null);

// Only ids that still exist in the column list are kept, so an old saved
// preference cannot bring back a column that was renamed or removed.
const sanitize = (ids) => {
    const known = new Set(LIST_COLUMNS.map((column) => column.id));
    const wanted = new Set((ids || []).filter((id) => known.has(id)));
    LOCKED_COLUMN_IDS.forEach((id) => wanted.add(id));
    return Array.from(wanted);
};

// Which columns the list is showing.
//
// The choice is saved per project in localStorage, so each project remembers
// the columns that person last worked with. Nothing is fetched when a column is
// switched on: every field is already on the row, so the column appears with
// its values straight away.
export function useListColumns(projectId) {
    const storageKey = storageKeyFor(projectId);
    const [visibleIds, setVisibleIds] = useState(() => sanitize(DEFAULT_COLUMN_IDS));

    // Read the saved choice once the project is known. Until then the defaults
    // are on screen, which is also what a project with nothing saved gets.
    useEffect(() => {
        if (!storageKey) return;
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
            setVisibleIds(sanitize(Array.isArray(saved) && saved.length ? saved : DEFAULT_COLUMN_IDS));
        } catch {
            setVisibleIds(sanitize(DEFAULT_COLUMN_IDS));
        }
    }, [storageKey]);

    const save = useCallback((ids) => {
        setVisibleIds(ids);
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(ids));
        } catch {
            // A full or blocked storage must not stop the column from showing.
        }
    }, [storageKey]);

    const toggleColumn = useCallback((columnId) => {
        if (LOCKED_COLUMN_IDS.includes(columnId)) return;
        setVisibleIds((current) => {
            const next = current.includes(columnId)
                ? current.filter((id) => id !== columnId)
                : [...current, columnId];
            if (storageKey) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(next));
                } catch {
                    // Same as above: the column still shows for this session.
                }
            }
            return next;
        });
    }, [storageKey]);

    const resetColumns = useCallback(() => {
        save(sanitize(DEFAULT_COLUMN_IDS));
    }, [save]);

    // Kept in the order of the column list rather than the order they were
    // ticked in, so switching a column off and on again does not move it.
    const columns = useMemo(
        () => LIST_COLUMNS.filter((column) => visibleIds.includes(column.id)),
        [visibleIds]
    );

    return { columns, visibleIds, toggleColumn, resetColumns };
}
