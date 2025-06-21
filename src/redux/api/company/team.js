import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const team = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_SERVER,
        credentials: "include",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("accessToken")
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log("userData", userData)
            if (token && userData) {
                headers.set('Authorization', token)
                headers.set('x-clientId', userData.clientId)
            }
            return headers
        }
    }),
    tagTypes: ["People", "Team"],
    endpoints: (build) => ({

        addPeople: build.mutation({
            query: (formData) => ({
                url: '/company/team/add-member',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['People']
        }),
        searchMember: build.query({
            query: (search = '') => ({
                url: '/company/team/search-member',
                params: { search }
            }),
            providesTags: ['People']
        }),
        getAllMemberList: build.query({
            query: ({ search = '', page = 1, pageSize = 10 }) => ({
                url: `/company/team/getmember-list`,
                params: { search, page, pageSize }
            }),
            providesTags: ['People', 'Team']
        }),
        createTeam: build.mutation({
            query: (formData) => ({
                url: '/company/team/create-team',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['Team']
        }),
        getTeamDetails: build.query({
            query: (args) => {
                // args can be either member_id or an object { member_id, role }
                const params = {};

                // If args is an object with role property
                if (args?.member_id) {
                    params.member_id = args.member_id;
                }

                if (args?.role === 'Admin') {
                    params.role = args.role;
                }

                return {
                    url: '/company/team/get-team-details',
                    method: 'GET',
                    params: params
                };
            },
            providesTags: ['Team']
        })
    }),
})

export const {
    useAddPeopleMutation,
    useGetAllMemberListQuery,
    useSearchMemberQuery,
    useCreateTeamMutation,
    useGetTeamDetailsQuery
} = team