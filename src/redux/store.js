import { configureStore } from "@reduxjs/toolkit"
import { api } from "../redux/api/company/api"
import { apiAuth } from "./api/authApi"
import dynamicRoutingReducer from "./reducers/dynamicRouting"
import authReducer from "./reducers/auth"
import projectSlice from "./reducers/projectSlice"
import storage from "redux-persist/lib/storage"
import { persistReducer, persistStore } from "redux-persist"
import { team } from "./api/company/team"
import { sprintApi } from "./graphql_api/sprint"

const projectPersistConfig = {
    key: 'root',
    storage
}

const persistedProjectReducer = persistReducer(projectPersistConfig, projectSlice)

const store = configureStore({
    reducer: {
        auth: authReducer,
        dynamicRouting: dynamicRoutingReducer,
        projectSlice: persistedProjectReducer,
        [apiAuth.reducerPath]: apiAuth.reducer,
        [api.reducerPath]: api.reducer,
        [team.reducerPath]: team.reducer,
        [sprintApi.reducerPath] : sprintApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(api.middleware, apiAuth.middleware, team.middleware, sprintApi.middleware)

})

export const persistor = persistStore(store)

export default store