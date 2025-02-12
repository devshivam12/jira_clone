import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiAuth = createApi({
    reducerPath: "apiAuth",
    baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_SERVER, credentials: 'include' }),
    tagTypes: ["User", "Auth"],
    endpoints: (build) => ({
        login: build.mutation({
            query: (formData) => ({
                url: '/auth/login',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['User']
        }),
        logout: build.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
                credentials : 'include'
            }),
            invalidatesTags: ['Auth', 'User']
        }),
    })
})

export const {
    useLoginMutation,
    useLogoutMutation
} = apiAuth