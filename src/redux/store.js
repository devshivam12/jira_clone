import { configureStore } from "@reduxjs/toolkit"
import { api } from "../redux/api/company/api"
import { apiAuth } from "./api/authApi"
import dynamicRoutingReducer from "./reducers/dynamicRouting"
import authReducer from "./reducers/auth"

const store = configureStore({
    reducer: {
        dynamicRouting : dynamicRoutingReducer,
        auth : authReducer,
        [apiAuth.reducerPath]: apiAuth.reducer,
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware, apiAuth.middleware)
      
})

export default store