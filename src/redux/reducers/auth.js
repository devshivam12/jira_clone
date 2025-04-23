
import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    user: null,
    isAdmin: false,
    loader: true,
    clientId: null 
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        userExist: (state, action) => {
            state.user = action.payload;
            state.loader = false
        },
        userNotExist: (state) => {
            state.user = null;
            state.isAdmin = false;
            state.loader = false;
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
        }
    }
})

export default authSlice.reducer;
export const { userExist, userNotExist, setClientId, setLoading, setError } = authSlice.actions