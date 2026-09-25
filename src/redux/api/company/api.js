import { restApi } from '../restBaseApi'

// Injected into the shared REST slice. The exported name and every hook below
// are unchanged. Tag types moved to restBaseApi.js.
export const api = restApi.injectEndpoints({
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
            invalidatesTags: ['Project']
        }),
        getAllProject: build.query({
            query: () => ({
                url: 'company/work-space/getAllProject'
            }),
            providesTags: ['Project']
        }),
        getClientWiseProject: build.query({
            query: () => ({
                url: '/company/work-space/get-client-project'
            }),
            providesTags: ['Project']
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
        getProjectById: build.query({
            query: (id) => ({
                url: `/company/work-space/get-projectById/${id}`,
            }),
            providesTags: ['Project']
        }),
        updateProjectById: build.mutation({
            query : ({id, body}) => ({
                url : `/company/work-space/update-project/${id}`,
                method : 'PUT',
                body
            }),
            invalidatesTags: ['Project', 'Template']
        }),
        getAllCompanyProject: build.query({
            query: ({allData, search}) => ({
                url: `/company/work-space/get-companyProject`,
                params : {allData, search}
            }),
            providesTags: ['Project']
        }),
        getProjectList: build.query({
            query: ({ page = 1, pageSize = 10, leaderName, projectKey, projectName, projectType, sortBy, sortOrder='asc' }) => ({
                url: `/company/work-space/project-list`,
                params: { page, pageSize, leaderName, projectKey, projectName, projectType, sortBy, sortOrder }
            }),
            providesTags: ['Project']
        }),
       

    }),
})

export const {
    useGetProjectQuery,
    useGetTemplateQuery,
    useGetFieldsDataQuery,
    useCreateProjectMutation,
    useGetAllProjectQuery,
    useGetClientWiseProjectQuery,
    useGetWorkSpaceDataQuery,
    useCreateWorkSpaceMutation,
    useUpdateProjectByIdMutation,
    useGetProjectByIdQuery,
    useGetAllCompanyProjectQuery,
    useGetProjectListQuery
} = api