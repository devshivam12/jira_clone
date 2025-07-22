import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../baseQuery'

export const team = createApi({
    baseQuery: baseQueryWithReauth, 
    // fetchBaseQuery({
    //     baseUrl: import.meta.env.VITE_SERVER,
    //     credentials: "include",
    //     prepareHeaders: (headers) => {
    //         const token = localStorage.getItem("accessToken")
    //         const userData = JSON.parse(localStorage.getItem('userData'));
    //         console.log("userData", userData)
    //         if (token && userData) {
    //             headers.set('Authorization', token)
    //             headers.set('x-clientId', userData.clientId)
    //         }
    //         return headers
    //     }
    // }),
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
        }),
        getTeamDetailWithId : build.query({
            query : ({team_id, page=1, pageSize=10, search=''}) => ({
                url : `company/team/get-team-detailById`,
                params : {team_id, page, pageSize, search},
            }),
            providesTags : ['Team']
        }),
        getMemberDetailWithId : build.query({
            query : ({member_id}) => ({
                url : `company/team/get-member-detailById`,
                params : {member_id} 
            }),
            providedTags : ['People']
        }),
        updateTeam : build.mutation({
            query : ({id, data}) => ({
                url : `company/team/update-team/${id}`,
                method : 'PUT',
                body : {data}
            }),
            invalidatesTags: ['Team']
        })
    }),
})

export const {
    useAddPeopleMutation,
    useGetAllMemberListQuery,
    useSearchMemberQuery,
    useCreateTeamMutation,
    useGetTeamDetailsQuery,
    useGetTeamDetailWithIdQuery,
    useGetMemberDetailWithIdQuery,
    useUpdateTeamMutation
} = team