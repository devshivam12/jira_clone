import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauthGraphQl } from "./baseQuery";

// One API slice for every GraphQL endpoint in the app. task.js, sprint.js,
// timeline.js and miscData.js each used to call createApi() themselves, which
// meant four reducers in the store and four middlewares running on every
// dispatched action, related or not. They all pointed at the same GraphQL
// endpoint through the same base query, so there was never a reason for them
// to be separate.
//
// The feature files now call graphqlApi.injectEndpoints() instead. Every hook
// keeps the same name and the same behaviour, and injectEndpoints returns this
// same object - so `taskApi`, `timelineApi` and friends still work as exported
// names, and `x.util` / `x.endpoints` still reach every endpoint.
//
// The other gain is tag invalidation across features. A task mutation can now
// invalidate 'Timeline', which was impossible while they were separate caches
// and had to be done by hand.
export const graphqlApi = createApi({
    reducerPath: 'graphqlApi',
    baseQuery: baseQueryWithReauthGraphQl,
    tagTypes: ['Task', 'Sprint', 'Update Sprint', 'Timeline'],
    endpoints: () => ({}),
});
