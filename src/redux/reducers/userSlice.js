import { createSlice } from "@reduxjs/toolkit"


const initialState = {
    userId: null
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId: (state, action) => {
            state.userId = action.payload
        },
        clearUserId: (state) => {
            return initialState
        }
    }
})

export default userSlice.reducer;
export const { setUserId, clearUserId } = userSlice.actions