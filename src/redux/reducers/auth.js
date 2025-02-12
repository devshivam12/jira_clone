
import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    user: null,
    isAdmin: false,
    loader: true
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
        }
    }
})

export default authSlice.reducer;
export const { userExist, userNotExist, setUserId } = authSlice.actions