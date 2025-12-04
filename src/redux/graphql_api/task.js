import { createApi } from "@reduxjs/toolkit/query/react";
import { gql } from "graphql-request";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const taskApi = createApi({
    reducerPath: 'taskApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes : ['Task'],
    endpoints: (builder) => ({
        createTask : builder.mutation({
            query : (payload) => ({
                method : 'POST',
                body : payload
            }),
            invalidatesTags: ['Task']
        }),
        getBacklogList : builder.mutation({
            query : (payload) => ({
                method : 'POST',
                body : payload
            }),
            validatesTags: ['Task']
        }),
        updateIssue : builder.mutation({
            query : (payload) => ({
                method : "POST",
                body : payload
            }),
            invalidatesTags: ['Task']
        })
    })
})

export const {
    useCreateTaskMutation,
    useGetBacklogListMutation,
    useUpdateIssueMutation
} = taskApi