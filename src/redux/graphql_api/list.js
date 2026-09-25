import { graphqlApi } from "./graphqlBaseApi";

// The List view reads rows through one GraphQL operation, `getListView`. It is
// wired up as two endpoints here because the two levels of the list are cached
// in different ways:
//
//   getListView     - the top level rows (epics, and work items without an
//                     epic). Paged, and every page of the same filter and sort
//                     is merged into one growing cache entry.
//   getListChildren - the tasks inside one opened row. Fetched on demand and
//                     dropped from the store straight after, so opening fifty
//                     rows one after another does not leave fifty task lists
//                     sitting in memory.
export const listApi = graphqlApi.injectEndpoints({
    endpoints: (builder) => ({
        getListView: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            // The cache entry is keyed on the project, the filter and the
            // sort, so the offset is free to move as the user scrolls. The
            // project is part of the key because two projects can be read with
            // the same filters and must not share one list.
            serializeQueryArgs: ({ queryArgs }) => {
                const { projectId, filter, sortBy, sortDir } = queryArgs?.variables || {};
                return { projectId, filter, sortBy, sortDir };
            },
            merge: (currentCache, newItems, { arg }) => {
                const offset = arg?.variables?.offset || 0;
                // Page 0 is a fresh read (first load, or a reload after a row
                // was created or deleted), so it replaces what is there.
                if (offset === 0) return newItems;

                const incoming = newItems?.data?.getListView;
                const existing = currentCache?.data?.getListView;
                if (!incoming || !existing) return newItems;

                // Guards against the same page arriving twice - a double
                // scroll trigger, or a refetch racing a page request - and
                // putting duplicate rows on screen.
                const seen = new Set((existing.rows || []).map((row) => row._id));
                const rows = [
                    ...(existing.rows || []),
                    ...(incoming.rows || []).filter((row) => !seen.has(row._id))
                ];

                return {
                    ...newItems,
                    data: {
                        ...newItems.data,
                        getListView: {
                            ...incoming,
                            rows,
                            // Counted on the first page only, so a later page
                            // must not blank out the total in the header.
                            totalCount: existing.totalCount ?? incoming.totalCount
                        }
                    }
                };
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.variables?.offset !== previousArg?.variables?.offset;
            }
        }),
        getListChildren: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            keepUnusedDataFor: 0
        })
    })
})

export const { useGetListViewQuery } = listApi;
