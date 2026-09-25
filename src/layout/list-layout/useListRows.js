import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { listApi, useGetListViewQuery } from "@/redux/graphql_api/list";

// Rows per request. The list asks for the next page when the end of the loaded
// ones comes into view.
export const LIST_PAGE_SIZE = 25;

// Frozen, so every render that reads an empty list reads the same array and
// memoized rows are not rebuilt for nothing.
const EMPTY_ROWS = Object.freeze([]);

// The top level of the list: the epics, and any work item that is not inside
// one. Their child tasks are read separately, see useListChildren.
export function useListRows({ projectId, filter, sortBy, sortDir }) {
    const dispatch = useDispatch();
    const [offset, setOffset] = useState(0);

    // A different filter, sort or project is a different list, so paging starts
    // from the top again.
    useEffect(() => {
        setOffset(0);
    }, [projectId, filter, sortBy, sortDir]);

    const args = useMemo(() => ({
        operationName: "getListView",
        variables: {
            projectId,
            parentId: null,
            filter,
            limit: LIST_PAGE_SIZE,
            offset,
            sortBy: sortBy || null,
            sortDir: sortDir || null
        }
    }), [projectId, filter, offset, sortBy, sortDir]);

    const { data, isLoading, isFetching, refetch } = useGetListViewQuery(args, { skip: !projectId });

    const payload = data?.data?.getListView;
    const rows = payload?.rows || EMPTY_ROWS;
    const totalCount = payload?.totalCount ?? rows.length;
    const hasMore = payload?.hasMore ?? false;

    // Guarded on isFetching so a fast scroll cannot ask for the same page twice.
    const loadMore = useCallback(() => {
        if (isFetching || !hasMore) return;
        setOffset(rows.length);
    }, [isFetching, hasMore, rows.length]);

    // Used after a row is created or deleted. Paging restarts, because a new
    // item belongs where the ordering puts it, not appended to the page the
    // user happens to have scrolled to.
    const reload = useCallback(() => {
        if (offset === 0) refetch();
        else setOffset(0);
    }, [offset, refetch]);

    // Shows an edit on a row as soon as it is made, instead of after a refetch.
    // The caller passes the old values back in if the request fails.
    const patchRow = useCallback((rowId, changes) => {
        dispatch(listApi.util.updateQueryData('getListView', args, (draft) => {
            const row = draft?.data?.getListView?.rows?.find((item) => item._id === rowId);
            if (row) Object.assign(row, changes);
        }));
    }, [dispatch, args]);

    // For an edit that takes a row out of the list, such as deleting it.
    const removeRow = useCallback((rowId) => {
        dispatch(listApi.util.updateQueryData('getListView', args, (draft) => {
            const list = draft?.data?.getListView;
            if (!list?.rows) return;
            const before = list.rows.length;
            list.rows = list.rows.filter((item) => item._id !== rowId);
            if (list.rows.length !== before && typeof list.totalCount === 'number') {
                list.totalCount = Math.max(list.totalCount - 1, 0);
            }
        }));
    }, [dispatch, args]);

    return {
        rows,
        totalCount,
        hasMore,
        isLoading,
        isFetching,
        loadMore,
        reload,
        patchRow,
        removeRow
    };
}
