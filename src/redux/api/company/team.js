import { restApi } from '../restBaseApi'

// Injected into the shared REST slice. The exported name and every hook below
// are unchanged. Tag types moved to restBaseApi.js.
export const team = restApi.injectEndpoints({
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
            providesTags : ['People']
        }),
        updateTeam : build.mutation({
            query : ({id, data}) => ({
                url : `company/team/update-team/${id}`,
                method : 'PUT',
                body : {data}
            }),
            invalidatesTags: ['Team']
        }),
        uploadMemberImage: build.mutation({
            query : ({memberId, action, file}) => ({
                url : `company/team/update-member-image`,
                params : {memberId, action},
                method: 'PUT',
                body : file,
                formData : true
            }),
            invalidatesTags: ['People']
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
    useUpdateTeamMutation,
    useUploadMemberImageMutation
} = team