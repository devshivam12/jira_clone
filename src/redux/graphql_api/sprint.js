import { createApi } from "@reduxjs/toolkit/query/react";
import { gql } from "graphql-request";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const sprintApi = createApi({
    reducerPath: 'sprintApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes: ['Sprint', 'Update Sprint'],
    endpoints: (builder) => ({
        createSprint: builder.mutation({
            query: (payload) => ({
                // url: '/sprint',
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ['Sprint']
        }),
        updateSprint: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            // invalidatesTags : ['Sprint']
            async onQueryStarted(payload, { dispatch, queryFulfilled }) {
                const sprintId = payload.variables.sprintId
                try {
                    const { data: updateResult } = await queryFulfilled;
                    const updatedSprintData = updateResult?.data?.updateSprint?.sprint
                    if (!updatedSprintData) return
                    dispatch(
                        sprintApi.util.updateQueryData(
                            'getSprintById',
                            sprintId,
                            (draft) => {
                                Object.assign(draft.data.getSprintById, updatedSprintData)
                            }
                        )
                    )

                    dispatch(
                        sprintApi.util.updateQueryData(
                            'getSprintDetailsWithTasks',
                            undefined,
                            (draft) => {
                                const sprintToUpdate = draft.data.getAllsprintWithTask.sprint.find(
                                    s => s._id === sprintId
                                );
                                if (sprintToUpdate) {
                                    console.log("sprintToUpdate", sprintToUpdate)
                                    Object.assign(sprintToUpdate, updatedSprintData);
                                }
                            }
                        )
                    );
                } catch (error) {
                    console.log("error while updating sprint cache", error)
                }
            }

        }),
        getSprintDetailsWithTasks: builder.query({
            query: () => ({
                method: 'POST',
                body: {
                    operationName: "getAllsprintWithTask",
                    query: `query GetAllSprintWithTasks {
                                getAllsprintWithTask {
                                    statusCode 
                                    success 
                                    message 
                                    sprint {
                                    _id
                                    name
                                    projectId
                                    startDate
                                    endDate
                                    goal
                                    tasks {
                                        _id 
                                        name
                                        description
                                        status
                                        assignee
                                    }
                                }
                            }
                        }
                    `,
                }
            }),
            providesTags: ['Sprint']
        }),
        getSprintById: builder.query({
            query: (sprintId) => ({
                method: "POST",
                body: {
                    operationName: "getSprintById",
                    query: `
                        query GetSprintById($sprintId: ID!) {
                          getSprintById(sprintId: $sprintId) {
                            _id 
                            name
                            projectId
                            project_key
                            startDate
                            endDate
                            goal
                          }
                        }
                      `,
                    variables: {
                        sprintId: sprintId
                    }
                }
            }),
            providesTags: (result, error, sprintId) => [{ type: 'Sprint', id: sprintId }]
        }),
        reorderSprint: builder.mutation({
            query: (payload) => ({
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ['Sprint']
        })
    })
})

export const {
    useCreateSprintMutation,
    useUpdateSprintMutation,
    useGetSprintDetailsWithTasksQuery,
    useGetSprintByIdQuery,
    useReorderSprintMutation
} = sprintApi