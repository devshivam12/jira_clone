import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
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
    tagTypes: ["Template", "WorkSpace", "People", "Team"],
    endpoints: (build) => ({
        getProject: build.query({
            query: () => ({
                url: 'company/work-space/get-templates',
                // params: { slug, template }
            }),
            providesTags: ['Template']
        }),
        getTemplate: build.query({
            query: (slug) => ({
                url: `company/work-space/get-templates?slug=${slug}`,
                // params: params
            }),
            providesTags: ['Template']
        }),
        getFieldsData: build.query({
            query: ({ projectSlug, templateSlug }) => ({
                url: 'company/work-space/get-templates',
                params: {
                    slug: projectSlug,
                    template: templateSlug
                }
            }),
            providesTags: ['Template']
        }),
        createProject: build.mutation({
            query: (formData) => ({
                url: 'company/work-space/create-project',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['Template']
        }),
        getWorkSpaceData: build.query({
            query: () => ({
                url: '/company/work-space/get-workspace',
            }),
            providesTags: ['WorkSpace']
        }),
        createWorkSpace: build.mutation({
            query: (formData) => ({
                url: '/company/work-space/create-work-space',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['WorkSpace']
        }),
        addPeople: build.mutation({
            query: (formData) => ({
                url: '/company/team/add-member',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['People']
        }),
        getMemberList: build.query({
            query: (search = '') => ({
                url: '/company/team/get-member-list',
                params: { search }
            }),
            providesTags: ['People']
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
    useGetTemplateQuery,
    useGetProjectQuery,
    useGetFieldsDataQuery,
    useCreateProjectMutation,
    useCreateWorkSpaceMutation,
    useGetWorkSpaceDataQuery,
    useAddPeopleMutation,
    useGetMemberListQuery,
    useCreateTeamMutation,
    useGetTeamDetailsQuery
} = api