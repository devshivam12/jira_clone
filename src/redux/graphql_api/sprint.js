import { createApi } from "@reduxjs/toolkit/query/react";
import { gql } from "graphql-request";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const sprintApi = createApi({
    reducerPath: 'sprintApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes: ['Sprint'],
    endpoints: (builder) => ({
        createSprint: builder.mutation({
            query: (variables) => ({
                body: gql`
                    mutation CreateSprint(
                        $name: String!
                        $projectId: ID!
                        $startDate: String!
                        $endDate: String!
                        $createdBy: String
                        $goal: String
                    ) {
                        createSprint(
                            name: $name
                            projectId: $projectId
                            startDate: $startDate
                            endDate: $endDate
                            createdBy: $createdBy
                            goal: $goal
                        ) {
                            statusCode
                            success
                            message
                            sprint {
                                id
                                name
                                projectId
                                startDate
                                endDate
                                createdBy
                                goal
                            }
                        }      
                    }
                `,
                variables
            })
        })
    })
})

export const {
    useCreateSprintMutation
} = sprintApi