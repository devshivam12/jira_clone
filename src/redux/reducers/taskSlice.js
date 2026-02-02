import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    taskListQuery : {}
};

const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        setTaskQuery : (state, action) => {
            state.taskListQuery = action.payload
        }
    }
});
export default tasksSlice.reducer;
export const {
    setTaskQuery
} = tasksSlice.actions;

