import { configureStore } from "@reduxjs/toolkit"
import dynamicRoutingReducer from "./reducers/dynamicRouting"
import authReducer from "./reducers/auth"
import projectSlice from "./reducers/projectSlice"
import storage from "redux-persist/lib/storage"
import { persistReducer, persistStore } from "redux-persist"
import tasksReducer from "./reducers/taskSlice"

import { apiAuth } from "./api/authApi"
import { restApi } from "./api/restBaseApi"
import { graphqlApi } from "./graphql_api/graphqlBaseApi"

// The feature files are imported for their side effect: each one calls
// injectEndpoints on restApi or graphqlApi at module load, which is what
// registers its endpoints and builds its hooks. Components import the hooks
// from these same files, so in practice they would load anyway - listing them
// here makes sure the store never comes up with an empty endpoint registry.
import "./api/company/api"
import "./api/company/team"
import "./graphql_api/sprint"
import "./graphql_api/task"
import "./graphql_api/miscData"
import "./graphql_api/timeline"

const projectPersistConfig = {
    key: 'project',
    storage
}

const userPersistConfig = {
    key: 'auth',
    storage
}

const persistedProjectReducer = persistReducer(projectPersistConfig, projectSlice)

const userReducer = persistReducer(userPersistConfig, authReducer)

// Three API slices, down from seven. companyApi + team folded into restApi,
// and sprintApi + taskApi + miscApi + timelineApi folded into graphqlApi,
// because each group already shared one base query against one server. Every
// registered slice adds a middleware that runs on every dispatched action, so
// this is four fewer middlewares in the chain for every action in the app.
const store = configureStore({
    reducer: {
        auth: userReducer,
        dynamicRouting: dynamicRoutingReducer,
        projectSlice: persistedProjectReducer,
        taskSlice: tasksReducer,
        [apiAuth.reducerPath]: apiAuth.reducer,
        [restApi.reducerPath]: restApi.reducer,
        [graphqlApi.reducerPath]: graphqlApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(apiAuth.middleware, restApi.middleware, graphqlApi.middleware)

})

export const persistor = persistStore(store)

export default store
