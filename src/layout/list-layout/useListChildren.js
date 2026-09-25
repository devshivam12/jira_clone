import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { listApi } from "@/redux/graphql_api/list";

// Child tasks per request when a row is opened. Small on purpose: an epic with
// 400 tasks should cost one short request to look into, not 400 rows.
export const CHILD_PAGE_SIZE = 25;

const EMPTY_STATE = { children: [], hasMore: false, totalCount: 0, loading: true };

// Owns which rows are open and the child tasks loaded for each one.
//
// The request is dispatched with `subscribe: false`, and the endpoint keeps
// nothing (keepUnusedDataFor: 0), so the only copy that lives on is the one in
// this map. Closing a row deletes it. That is what stops opening row after row
// from growing the store for the rest of the session.
//
// The same filters the list is using are sent with every child request, so an
// opened epic shows the tasks that match what the user is filtering on.
export function useListChildren({ projectId, filter, sortBy, sortDir }) {
    const dispatch = useDispatch();
    const [expanded, setExpanded] = useState(() => new Map());

    // The map is read inside async callbacks that would otherwise close over a
    // stale copy, so the ref is the source of truth and the state exists to
    // render from.
    const expandedRef = useRef(expanded);
    const apply = useCallback((next) => {
        expandedRef.current = next;
        setExpanded(next);
    }, []);

    // The request arguments change as the user filters, and the fetch below
    // runs from a callback, so they are read through a ref as well.
    const queryRef = useRef({ projectId, filter, sortBy, sortDir });
    queryRef.current = { projectId, filter, sortBy, sortDir };

    const patch = useCallback((rowId, changes) => {
        const current = expandedRef.current.get(rowId);
        if (!current) return; // closed again while the request was in flight
        const next = new Map(expandedRef.current);
        next.set(rowId, { ...current, ...changes });
        apply(next);
    }, [apply]);

    const fetchPage = useCallback(async (rowId, offset) => {
        patch(rowId, { loading: true });
        try {
            const { projectId: project, filter: activeFilter, sortBy: by, sortDir: dir } = queryRef.current;

            const result = await dispatch(
                listApi.endpoints.getListChildren.initiate(
                    {
                        operationName: "getListView",
                        variables: {
                            projectId: project,
                            parentId: rowId,
                            filter: activeFilter,
                            limit: CHILD_PAGE_SIZE,
                            offset,
                            sortBy: by || null,
                            sortDir: dir || null
                        }
                    },
                    { subscribe: false, forceRefetch: true }
                )
            ).unwrap();

            const payload = result?.data?.getListView;
            const current = expandedRef.current.get(rowId);
            if (!current) return;

            const incoming = payload?.rows || [];
            const seen = new Set(current.children.map((child) => child._id));
            const merged = offset === 0
                ? incoming
                : [...current.children, ...incoming.filter((child) => !seen.has(child._id))];

            patch(rowId, {
                children: merged,
                hasMore: !!payload?.hasMore,
                totalCount: payload?.totalCount ?? current.totalCount,
                loading: false
            });
        } catch {
            patch(rowId, { loading: false, hasMore: false });
        }
    }, [dispatch, patch]);

    const toggleRow = useCallback((rowId) => {
        const next = new Map(expandedRef.current);
        if (next.has(rowId)) {
            next.delete(rowId);
            apply(next);
            return;
        }
        next.set(rowId, EMPTY_STATE);
        apply(next);
        fetchPage(rowId, 0);
    }, [apply, fetchPage]);

    // Used after a task is added under a row. The row is opened if it was still
    // closed, so the new task is visible straight away, and its list is read
    // again from the first page.
    const refreshRow = useCallback((rowId) => {
        if (!expandedRef.current.has(rowId)) {
            const next = new Map(expandedRef.current);
            next.set(rowId, EMPTY_STATE);
            apply(next);
        }
        fetchPage(rowId, 0);
    }, [apply, fetchPage]);

    const loadMoreChildren = useCallback((rowId) => {
        const current = expandedRef.current.get(rowId);
        if (!current || current.loading || !current.hasMore) return;
        fetchPage(rowId, current.children.length);
    }, [fetchPage]);

    const collapseAll = useCallback(() => {
        if (expandedRef.current.size === 0) return;
        apply(new Map());
    }, [apply]);

    // Applies an edit to one child that is already on screen. A task has one
    // parent, so only the row it belongs to can hold it and the caller does not
    // have to say which row that is. Only open rows are searched, and there are
    // never many of those.
    const patchChild = useCallback((taskId, changes) => {
        let changed = false;
        const next = new Map();

        expandedRef.current.forEach((state, rowId) => {
            let found = false;
            const children = state.children.map((child) => {
                if (child._id !== taskId) return child;
                found = true;
                return { ...child, ...changes };
            });
            if (!found) {
                next.set(rowId, state);
                return;
            }
            changed = true;
            next.set(rowId, { ...state, children });
        });

        if (changed) apply(next);
    }, [apply]);

    // For an edit that takes a task out of the list, such as deleting it.
    const removeChild = useCallback((taskId) => {
        let changed = false;
        const next = new Map();

        expandedRef.current.forEach((state, rowId) => {
            if (!state.children.some((child) => child._id === taskId)) {
                next.set(rowId, state);
                return;
            }
            changed = true;
            next.set(rowId, {
                ...state,
                children: state.children.filter((child) => child._id !== taskId),
                totalCount: Math.max((state.totalCount || 0) - 1, 0)
            });
        });

        if (changed) apply(next);
    }, [apply]);

    // A row that is no longer in the list - filtered out, or on a page that was
    // read again - is not coming back on screen in this state, so its task list
    // is dropped.
    const pruneTo = useCallback((visibleRowIds) => {
        if (expandedRef.current.size === 0) return;
        let changed = false;
        const next = new Map();
        expandedRef.current.forEach((value, key) => {
            if (visibleRowIds.has(key)) next.set(key, value);
            else changed = true;
        });
        if (changed) apply(next);
    }, [apply]);

    // Children already on screen were read under the filters that were in use
    // at the time. Rather than quietly showing tasks that no longer match, the
    // open rows are closed and read again when the user asks for them.
    useEffect(() => {
        collapseAll();
    }, [filter, sortBy, sortDir, collapseAll]);

    return {
        expanded,
        toggleRow,
        refreshRow,
        loadMoreChildren,
        collapseAll,
        patchChild,
        removeChild,
        pruneTo
    };
}
