import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

// One API slice for the authenticated REST endpoints. company/api.js and
// company/team.js each called createApi() with the same baseQueryWithReauth,
// so they were two reducers and two middlewares doing the same job on the same
// server. They now inject into this one.
//
// apiAuth (api/authApi.js) is deliberately left on its own: it has a different
// base query, one that does not send the auth token, because it serves login,
// register and logout. It is also what baseQueryWithReauth calls to log a
// stale session out, so folding it in here would make that circular.
export const restApi = createApi({
    reducerPath: 'restApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Template', 'WorkSpace', 'Project', 'People', 'Team'],
    endpoints: () => ({}),
})
