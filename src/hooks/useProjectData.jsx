import { useSelector } from "react-redux"

export const useProjectData = () => {
    const { currentProject, loading, error, templateData } = useSelector((state) => state.projectSlice)
    
    return {
        currentProject,
        projectSlug: currentProject.project_slug,
        templateSlug: currentProject.template?.slug,
        defaultTab: currentProject.template?.fields?.tabs.find(tab => tab.isDefault === true) || [],
        loading,
        error,
        templateData : currentProject.template
    }
}