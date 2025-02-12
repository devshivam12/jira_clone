import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./reducers/auth"
import userSlice from "./reducers/userSlice";
import { api } from "./api/api";

const rootReducers = combineReducers({
    auth : authSlice,
    user : userSlice,
    [api.reducerPath]: api.reducer,
})

export default rootReducers