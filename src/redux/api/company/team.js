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
            query: () => ({
                url: '/company/team/get-team-details',
                method : 'GET' 
            }),
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