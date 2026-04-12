import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    taskListQuery : {},
    statusCount: [],
    searchQuery: ""
};

const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        setTaskQuery : (state, action) => {
            state.taskListQuery = action.payload
        },
        setStatusCount: (state, action) => {
            state.statusCount = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        }
    }
});
export default tasksSlice.reducer;
export const {
    setTaskQuery,
    setStatusCount,
    setSearchQuery
} = tasksSlice.actions;

