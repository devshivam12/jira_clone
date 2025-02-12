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
                headers.set('x-userId', userData.userId)
            }
            return headers
        }
    }),
    tagTypes: ["WorkSpace"],
    endpoints: (build) => ({
        getWorkSpaceData: build.query({
            query: () => ({
                url: '/work-space/get-workspace',
            }),
            providesTags : ['WorkSpace']
        }),
        createWorkSpace: build.mutation({
            query: (formData) => ({
                url: '/work-space/create-work-space',
                method: 'POST',
                body: formData
            }),
            invalidatesTags : ['WorkSpace']
        }),
    })
})

export const {
    useCreateWorkSpaceMutation,
    useGetWorkSpaceDataQuery
} = api