import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    taskListQuery : {},
    statusCount: [],
    searchQuery: "",
    searchResultCount: null
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
        },
        setSearchResultCount: (state, action) => {
            state.searchResultCount = action.payload;
        }
    }
});
export default tasksSlice.reducer;
export const {
    setTaskQuery,
    setStatusCount,
    setSearchQuery,
    setSearchResultCount
} = tasksSlice.actions;

