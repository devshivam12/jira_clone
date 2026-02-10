import { createApi } from "@reduxjs/toolkit/query/react";
import { gql } from "graphql-request";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const taskApi = createApi({
    reducerPath: 'taskApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes: ['Task'],
    endpoints: (builder) => ({
        createTask: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ['Task']
        }),
        getBacklogList: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            providesTags: ['Task']
        }),
        getTaskById: builder.query({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            providesTags: (result, error, arg) => [
                { type: 'Task', id: arg.variables.taskId }
            ]
        }),
        updateIssue: builder.mutation({
            query: (payload) => {
                const { projectId, ...apiPayload } = payload.variables || {}
                return {
                    method: "POST",
                    body: {
                        ...payload,
                        variables: apiPayload
                    }
                }
            },
            async onQueryStarted(payload, { dispatch, queryFulfilled, getState }) {
                const { taskId, key, value } = payload.variables
                console.log("taskIdtaskIdtaskIdtaskId", taskId)
                const state = getState();
                const cacheEntries = state.taskApi.queries;

                console.log("All cache entries:", cacheEntries);
                console.log("Looking for getBacklogList entries:",
                    Object.keys(cacheEntries).filter(key => key.includes('getBacklogList'))
                );
                const patchResult = dispatch(
                    taskApi.util.updateQueryData(
                        'getTaskById',
                        { operationName: 'getTaskDetail', variables: { taskId: taskId } },
                        (draft) => {
                            const task = draft?.data?.getTaskDetail?.data;
                            console.log("tasktasktasktasktask", task)
                            if (task) {
                                task[key] = value;
                            }
                        }
                    )
                );

                const queryEntries = Object.values(state.taskApi.queries);
                const backlogQueries = queryEntries.filter(
                    (entry) => entry?.endpointName === 'getBacklogList' && entry?.status === 'fulfilled'
                );

                const listUndos = [];

                backlogQueries.forEach((entry) => {
                    const patch = dispatch(
                        taskApi.util.updateQueryData(
                            'getBacklogList',
                            entry.originalArgs,
                            (draft) => {
                                const taskList = draft?.data?.getBacklogData?.data;
                                if (Array.isArray(taskList)) {
                                    const taskToUpdate = taskList.find((t) => t._id === taskId);
                                    if (taskToUpdate) {
                                        taskToUpdate[key] = value;
                                    }
                                }
                            }
                        )
                    );
                    listUndos.push(patch.undo);
                });

                try {
                    await queryFulfilled
                } catch (err) {
                    console.error("Mutation failed, rolling back", err);
                    patchResult.undo();
                    listUndos.forEach(undo => undo());
                }
            }
        }),
        getTaskVotes: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            })
        }),

        addVotes: builder.mutation({
            query: (payload) => ({
                method: "POST",
                body: payload
            })
        })
    })
})

export const {
    useCreateTaskMutation,
    useGetBacklogListQuery,
    useUpdateIssueMutation,
    useGetTaskByIdQuery,
    useGetTaskVotesMutation,
    useAddVotesMutation
} = taskApi