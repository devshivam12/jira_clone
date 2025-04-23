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
    tagTypes: ["WorkSpace"],
    endpoints: (build) => ({
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
        addPeople : build.mutation({
            query: (formData) => ({
                url : '/company/team/add-member',
                method : 'POST',
                body : formData
            }),
            invalidatesTags: ['People']
        })
    }),
})

export const {
    useCreateWorkSpaceMutation,
    useGetWorkSpaceDataQuery,
    useAddPeopleMutation
} = api