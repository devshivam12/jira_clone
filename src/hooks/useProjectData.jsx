import { useSelector, shallowEqual } from "react-redux"

const EMPTY_ARRAY = [];

export const useProjectData = () => {
    const { allProjects, currentProject, loading, error, templateData } = useSelector((state) => state.projectSlice, shallowEqual)
    
    return {
        allProjects,
        currentProject,
        projectSlug: currentProject?.project_slug,
        templateSlug: currentProject?.template?.slug,
        defaultTab: currentProject?.template?.fields?.tabs.find(tab => tab.isDefault === true) || EMPTY_ARRAY,
        loading,
        error, 
        templateData : currentProject?.template,
        workType : currentProject?.template?.fields?.work_type,
        workFlow : currentProject?.template?.fields?.work_flow,
        importance : currentProject?.template?.fields?.importance
    }
}