
import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    user: null,
    userData: null,
    accessToken: null,
    isAdmin: false,
    loader: true,
    clientId: null,
    // role: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUserData: (state, action) => {
            console.log("state userData", state)
            console.log("action userData", action)
            state.userData = action.payload
            state.loader = false;
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload
            state.loader = false
        },
        userExist: (state, action) => {
            state.user = action.payload;
            state.loader = false;
            // state.role = action.payload.role
        },
        userNotExist: (state) => {
            state.user = null;
            state.isAdmin = false;
            state.loader = false;
            // state.role = null
        },
        setLoading: (state) => {
            state.loader = true
        },
        setError: (state, action) => {
            state.error = action.payload
            state.loading = false
        },
        setClientId: (state, action) => {
            state.clientId = action.payload;
        },
        clearUser: (state) => {
            state.clientId = null,
            state.userData = []
            state.loader = false
            state.error = false
            state.isAdmin = false
            state.accessToken = null
            state.user = null
        }
    }
})

export default authSlice.reducer;
export const { setUserData, userExist, userNotExist, setClientId, setLoading, setError, clearUser, setAccessToken } = authSlice.actions