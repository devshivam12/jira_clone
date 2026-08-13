import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const timelineApi = createApi({
    reducerPath: 'timelineApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes: ['Timeline'],
    endpoints: (builder) => ({
        // Paged by row. Every page for the same project + date window shares
        // one cache entry, and `merge` appends the incoming epics, so the
        // chart keeps a single growing list instead of a separate cache
        // entry per offset.
        getTimelineData: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            serializeQueryArgs: ({ queryArgs }) => {
                const { projectId, from, to, period } = queryArgs?.variables || {};
                return { projectId, from, to, period };
            },
            merge: (currentCache, newItems, { arg }) => {
                const offset = arg?.variables?.offset || 0;
                // Page 0 is a fresh load (or a refetch), so it replaces.
                if (offset === 0) return newItems;

                const incoming = newItems?.data?.getTimelineData;
                const existing = currentCache?.data?.getTimelineData;
                if (!incoming || !existing) return newItems;

                // Guard against a page arriving twice (double scroll trigger,
                // refetch race) putting duplicate rows in the list.
                const seen = new Set((existing.epics || []).map((e) => e._id));
                const merged = [
                    ...(existing.epics || []),
                    ...(incoming.epics || []).filter((e) => !seen.has(e._id))
                ];

                return {
                    ...newItems,
                    data: {
                        ...newItems.data,
                        getTimelineData: {
                            ...incoming,
                            epics: merged,
                            // Sprints, the running-now list and the total
                            // count are first-page only, so later pages come
                            // back without them. Carrying them forward keeps
                            // the header and the strip from blanking out
                            // mid-scroll.
                            sprints: existing.sprints || incoming.sprints,
                            runningEpics: existing.runningEpics || incoming.runningEpics,
                            totalCount: existing.totalCount ?? incoming.totalCount
                        }
                    }
                };
            },
            forceRefetch({ currentArg, previousArg }) {
                const a = currentArg?.variables || {};
                const b = previousArg?.variables || {};
                return (
                    a.offset !== b.offset ||
                    a.from !== b.from ||
                    a.to !== b.to ||
                    a.period !== b.period
                );
            },
            providesTags: ['Timeline']
        }),
        // Child tasks of a single epic, fetched only while its row is
        // expanded. Dispatched with `subscribe: false` from the chart, and
        // keepUnusedDataFor: 0 means the response is dropped from the store
        // as soon as it has been copied into the row's own state - expanding
        // fifty epics one after another does not leave fifty task lists
        // sitting in memory.
        getEpicChildren: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            keepUnusedDataFor: 0
        }),
        // The epic panel's list: epic headers and their status rollups, with
        // no tasks in the payload. Paged the same way as getTimelineData, so
        // every page of one project + search term shares a single cache entry
        // that grows as the user scrolls.
        getEpicList: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            serializeQueryArgs: ({ queryArgs }) => {
                const { projectId, search } = queryArgs?.variables || {};
                return { projectId, search };
            },
            merge: (currentCache, newItems, { arg }) => {
                const offset = arg?.variables?.offset || 0;
                // Page 0 is a fresh load (or a refetch after creating an
                // epic), so it replaces what is there.
                if (offset === 0) return newItems;

                const incoming = newItems?.data?.getEpicList;
                const existing = currentCache?.data?.getEpicList;
                if (!incoming || !existing) return newItems;

                const seen = new Set((existing.epics || []).map((e) => e._id));
                const merged = [
                    ...(existing.epics || []),
                    ...(incoming.epics || []).filter((e) => !seen.has(e._id))
                ];

                return {
                    ...newItems,
                    data: {
                        ...newItems.data,
                        getEpicList: {
                            ...incoming,
                            epics: merged,
                            // Counted on the first page only, so later pages
                            // must not blank out the header's total.
                            totalCount: existing.totalCount ?? incoming.totalCount
                        }
                    }
                };
            },
            forceRefetch({ currentArg, previousArg }) {
                const a = currentArg?.variables || {};
                const b = previousArg?.variables || {};
                return a.offset !== b.offset || a.search !== b.search;
            },
            providesTags: ['Timeline']
        }),
        // Optimistically patches every open getTimelineData cache entry so an
        // epic bar doesn't snap back while the drag's reschedule request is
        // still in flight, then rolls back if the request fails.
        updateTaskDates: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            async onQueryStarted(payload, { dispatch, queryFulfilled, getState }) {
                const { taskId, startDate, dueDate } = payload.variables || {};
                const state = getState();
                const timelineQueries = Object.values(state.timelineApi.queries).filter(
                    (entry) => entry?.endpointName === 'getTimelineData' && entry?.status === 'fulfilled'
                );

                const undos = timelineQueries.map((entry) =>
                    dispatch(
                        timelineApi.util.updateQueryData('getTimelineData', entry.originalArgs, (draft) => {
                            const epic = draft?.data?.getTimelineData?.epics?.find((e) => e._id === taskId);
                            if (!epic) return;
                            if (startDate !== undefined) epic.startDate = startDate;
                            if (dueDate !== undefined) epic.dueDate = dueDate;
                        })
                    ).undo
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    console.error("updateTaskDates failed, rolling back", error);
                    undos.forEach((undo) => undo());
                }
            }
        }),
        updateDependencies: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ['Timeline']
        })
    })
})

export const {
    useGetTimelineDataQuery,
    // Subscribed variant of the same endpoint, used by the child-issues panel
    // inside the task editor. The chart still fires it through `initiate` with
    // subscribe: false, so the two never share a live subscription.
    useGetEpicChildrenQuery,
    useGetEpicListQuery,
    useUpdateTaskDatesMutation,
    useUpdateDependenciesMutation
} = timelineApi
