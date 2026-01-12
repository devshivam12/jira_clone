import { createApi } from "@reduxjs/toolkit/query/react";
import { gql } from "graphql-request";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

export const miscDataApi = createApi({
    reducerPath: 'miscApi',
    baseQuery: baseQueryWithReauthGraphQl,
    endpoints: (builder) => ({
        createLabels: builder.mutation({
            query: (name) => ({
                method: 'POST',
                body: {
                    operationName: 'createLabels',
                    query: `
                        mutation CreateLabels($name: String!){
                            createLabels(name : $name){
                                statusCode
                                message
                                label {
                                    _id
                                    value
                                }
                            }
                        }
                    `,
                    variables: { name }
                }
            }),
            async onQueryStarted(name, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("data", data)
                    const newLabel = data?.data?.createLabels?.label
                    console.log("newLabel", newLabel)
                    // If creation succeeded
                    if (newLabel) {
                        console.log("is this working when creating new label")
                        dispatch(
                            taskApi.util.updateQueryData('getLabel', "", (draft) => {
                                console.log("draft", draft)
                                draft.data.getClientLabels.push(newLabel);
                            })
                        );
                    }
                } catch (error) {
                    console.error('Error updating cache after label creation:', error);
                }
            },
        }),
        getLabel: builder.query({
            query: ({ search = "", limit = 10, page }) => ({
                method: 'POST',
                body: {
                    operationName: 'getClientLabels',
                    query: `
                        query GetClientLabels {
                            getClientLabels {
                                labels{
                                    _id
                                    value
                                }
                                    hasMore
                                    total
                            }
                        }
                    `,
                    variables: { search, page, limit }
                }
            }),
            serializeQueryArgs: ({ queryArgs }) => {
                return { search: queryArgs.search };
            },
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    return newItems;
                }
                return {
                    ...newItems,
                    data: {
                        getClientLabels: {
                            ...newItems.data.getClientLabels,
                            labels: [
                                ...(currentCache?.data?.getClientLabels?.labels || []),
                                ...newItems.data.getClientLabels.labels
                            ]
                        }
                    }
                };
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.page !== previousArg?.page ||
                    currentArg?.search !== previousArg?.search;
            }
        }),
        getTeamDropdown: builder.query({
            query: ({ search = "", limit = 10, page }) => ({
                method: 'POST',
                body: {
                    operationName: 'getTeamDropdown',
                    query: `
                    query GetTeamDropdown($search:String, $page:Int, $limit: Int){
                        teamDropdown(search:$search, limit:$limit, page:$page){
                            teams{
                                _id
                                team_name
                                team_icon
                            }
                                hasMore
                                total
                        }
                    }
                `,
                    variables: { search, page, limit }
                }
            })
        }),
        getMemberDropdown: builder.query({
            query: ({ search = "", limit = 10, page }) => ({
                method: 'POST',
                body: {
                    operationName: 'getMemberDropdown',
                    query: `
                    query GetMemberDropdown($search:String, $page:Int, $limit: Int){
                        memberDropdown(search:$search, limit:$limit, page:$page){
                            members{
                                _id
                                memberId
                                first_name
                                last_name
                                image
                                email
                            }
                                hasMore
                                total
                        }
                    }
                `,
                    variables: { search, page, limit }
                }
            })
        }),
        getSprintDropdown: builder.query({
            query: ({ search = "", limit = 10, page}) => ({
                method: 'POST',
                body: {
                    operationName: 'getSprintDropdown',
                    query: `
                    query GetSprintDropdown($search:String, $page:Int, $limit: Int){
                        sprintDropdown(search:$search, limit:$limit, page:$page){
                            sprints{
                                _id
                                name
                                project_key
                            }
                                hasMore
                                total
                        }
                    }
                `,
                    variables: { search, page, limit}
                }
            })
        }),
        getParentDropdown: builder.query({
            query: ({ search = "", limit = 10, page }) => ({
                method: 'POST',
                body: {
                    operationName: 'getParentDropdown',
                    query: `
                    query GetParentDropdown($search:String, $page:Int, $limit: Int){
                        parentDropdown(search:$search, limit:$limit, page:$page){
                            parents{
                                _id
                                summary
                                project_key
                            }
                                hasMore
                                total
                        }
                    }
                `,
                    variables: { search, page, limit }
                }
            })
        })
    })
})

export const {
    useCreateLabelsMutation,
    useGetLabelQuery,
    useGetTeamDropdownQuery,
    useGetMemberDropdownQuery,
    useGetSprintDropdownQuery,
    useGetParentDropdownQuery
} = miscDataApi