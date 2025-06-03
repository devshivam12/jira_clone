import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./reducers/auth"
import userSlice from "./reducers/userSlice";
import { api } from "./api/api";
import dynamicRouting from "./reducers/dynamicRouting";

const rootReducers = combineReducers({
    auth : authSlice,
    user : userSlice,
    dynamicRouting: dynamicRouting,
    [api.reducerPath]: api.reducer,
})

export default rootReducers