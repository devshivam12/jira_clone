// dynamicRoutingSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    project_slug: null,
    template_slug: null,
    isLoading: false,
    error: null
};

const dynamicRoutingSlice = createSlice({
    name: "dynamicRouting",
    initialState,
    reducers: {
        setLastAccessedProject: (state, action) => {
            const { project_slug, template_slug } = action.payload;
            state.project_slug = project_slug;
            state.template_slug = template_slug;
            state.error = null;
            
            // Persist to localStorage
            localStorage.setItem('lastAccessedProject', JSON.stringify({
                project_slug,
                template_slug,
            }));
        },
        loadLastAccessedProject: (state) => {
            try {
                const stored = localStorage.getItem('lastAccessedProject');
                if (stored) {
                    const { project_slug, template_slug } = JSON.parse(stored);
                    state.project_slug = project_slug;
                    state.template_slug = template_slug;
                }
            } catch (error) {
                state.error = error.message;
                console.error('Failed to load last project:', error);
            }
        },
        clearLastAccessedProject: (state) => {
            state.project_slug = null;
            state.template_slug = null;
            localStorage.removeItem('lastAccessedProject');
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { 
    setLastAccessedProject, 
    loadLastAccessedProject, 
    clearLastAccessedProject,
    setLoading,
    setError
} = dynamicRoutingSlice.actions;

export default dynamicRoutingSlice.reducer;