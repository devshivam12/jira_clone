import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentProject: null,
    allProjects: [],
    allProjectsId: [],
    lastAccessedId: null,
    loading: false,
    error: null,
    templates: {}
};

const projectSlice = createSlice({
    name: "projects",
    initialState,
    reducers: {
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
            state.lastAccessedId = action.payload?._id || null;
        },
        setAllProjects: (state, action) => {
            state.allProjects = action.payload;
            state.allProjectsId = action.payload.map(p => p._id)
        },
        setAllProjectsId: (state, action) => {
            state.allProjectsId = action.payload;
        },
        addProject: (state, action) => {
            console.log('Adding project:', action.payload);
            const newProject = action.payload;
            console.log("newProject", newProject)
            // Add to allProjects array if not already exists
            const existingProjectIndex = state.allProjects.findIndex(p => p._id === newProject._id);
            if (existingProjectIndex === -1) {
                console.log('Adding new project to allProjects'); // Debug log
                state.allProjects.push(newProject);
                state.allProjectsId.push(newProject._id);
            } else {
                // Update existing project
                console.log('Updating existing project'); // Debug log
                state.allProjects[existingProjectIndex] = newProject;
            }

            // Optionally set as current project (if it's the first project or specified)
            console.log('Current project exists:', !!state.currentProject);
            console.log('setAsCurrent flag:', action.payload.setAsCurrent);
            if (!state.currentProject || action.payload.setAsCurrent) {
                console.log('Setting as current project'); // Debug log
                state.currentProject = newProject;
                state.lastAccessedId = newProject._id;
            }
        },
        // updateProject: (state, action) => {
        //     const index = state.allProjectsId.findIndex(
        //         p => p._id === action.payload._id
        //     );
        //     if (index !== -1) {
        //         state.allProjectsId[index] = action.payload;
        //     }
        //     if (state.currentProject?._id === action.payload._id) {
        //         state.currentProject = action.payload;
        //     }
        // },

        updateProjectReduxStore: (state, action) => {
            const updatedProject = action.payload;

            // Update in allProjects array
            const projectIndex = state.allProjects.findIndex(p => p._id === updatedProject._id);
            if (projectIndex !== -1) {
                state.allProjects[projectIndex] = {
                    ...state.allProjects[projectIndex],
                    ...updatedProject
                };
            } else {
                // If not found, add it (optional - depends on your use case)
                state.allProjects.push(updatedProject);
                state.allProjectsId.push(updatedProject._id);
            }

            // Update currentProject if it's the one being updated
            if (state.currentProject?._id === updatedProject._id) {
                state.currentProject = {
                    ...state.currentProject,
                    ...updatedProject
                };
            }
        },
        switchProject: (state, action) => {
            const projectId = action.payload
            const project = state.allProjects.find(p => p._id === projectId)
            if (project) {
                state.currentProject = project
                state.lastAccessedId = projectId
            }
        },
        initializeWithDefaultProject: (state, action) => {
            const defaultProject = action.payload;
            state.currentProject = defaultProject[0];
            state.allProjects = [defaultProject];
            state.allProjectsId = [defaultProject._id];
            state.lastAccessedId = defaultProject._id;
        },
        setTemplates: (state, action) => {
            state.templates[action.payload.projectType] = action.payload.templates;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearProjects: (state) => {
            // Properly reset to initial state
            state.currentProject = null;
            state.allProjects = [];
            state.allProjectsId = [];
            state.lastAccessedId = null;
            state.loading = false;
            state.error = null;
            // Keep templates if needed
            // state.templates = {}; 
        }
    }
});
export default projectSlice.reducer;
export const {
    setCurrentProject,
    setAllProjects,
    setAllProjectsId,
    addProject,
    switchProject,
    initializeWithDefaultProject,
    updateProjectReduxStore,
    setTemplates,
    setLoading,
    setError,
    clearProjects
} = projectSlice.actions;

