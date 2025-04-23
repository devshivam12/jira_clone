import { createSlice } from "@reduxjs/toolkit"


const initialState = {
    clientId: null
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setClientId: (state, action) => {
            state.clientId = action.payload
        },
        clearClientId: (state) => {
            return initialState
        }
    }
})

export default userSlice.reducer;
export const { setClientId, clearClientId } = userSlice.actions