import { configureStore } from "@reduxjs/toolkit"
import { api } from "./api/api"
import { apiAuth } from "./api/authApi"

const store = configureStore({
    reducer: {
        [apiAuth.reducerPath]: apiAuth.reducer,
        [api.reducerPath]: api.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware, apiAuth.middleware)
      
})

export default store