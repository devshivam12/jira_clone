import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiAuth = createApi({
    reducerPath: "apiAuth",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_SERVER,
        credentials: 'include',
        prepareHeaders: (headers) => {
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log("userData", userData)
            let clientId = userData?.clientId
            console.log("clientId", clientId)
            if (clientId) {
                headers.set('x-clientId', clientId);
            }
            return headers;
        }
    }),
    tagTypes: ["User", "Auth", "Roles"],
    endpoints: (build) => ({
        register: build.mutation({
            query: (formData) => ({
                url: 'user/auth/register',
                method: 'POST',
                body: formData,
                // headers: {
                //     'Content-type' : 'application/json'
                // },
                // credentials: 'include'
            }),
            invalidatesTags: ['User']
        }),
        login: build.mutation({
            query: (formData) => ({
                url: '/user/auth/login',
                method: 'POST',
                body: formData
            }),
            invalidatesTags: ['User']
        }),
        logout: build.mutation({
            query: () => ({
                url: '/user/auth/logout',
                method: 'POST',
                credentials: 'include'
            }),
            invalidatesTags: ['Auth', 'User']
        }),
        verifyUser: build.query({
            query: () => '/user/auth/user-details',
            providesTags: ['User']
        }),
        getRoles: build.query({
            query: () => ({
                url: '/user/get-role',
            }),
            providesTags: ['Roles']
        })
    })
})

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useVerifyUserQuery,
    useGetRolesQuery
} = apiAuth