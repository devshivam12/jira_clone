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
import { taskApi } from "./graphql_api/task"
import { miscDataApi } from "./graphql_api/miscData"
import tasksReducer from "./reducers/taskSlice"

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

const store = configureStore({
    reducer: {
        auth: userReducer,
        dynamicRouting: dynamicRoutingReducer,
        projectSlice: persistedProjectReducer,
        taskSlice : tasksReducer,
        [apiAuth.reducerPath]: apiAuth.reducer,
        [api.reducerPath]: api.reducer,
        [team.reducerPath]: team.reducer,
        [sprintApi.reducerPath]: sprintApi.reducer,
        [taskApi.reducerPath] : taskApi.reducer,
        [miscDataApi.reducerPath] : miscDataApi.reducer     
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(api.middleware, apiAuth.middleware, team.middleware, sprintApi.middleware, taskApi.middleware, miscDataApi.middleware)

})

export const persistor = persistStore(store)

export default store