import { useMemo } from "react"
import { useSelector, shallowEqual } from "react-redux"

const EMPTY_ARRAY = [];

export const useProjectData = () => {
    const { allProjects, currentProject, loading, error } = useSelector((state) => state.projectSlice, shallowEqual)

    // Memoized on the slice values this reads. Twenty components call this
    // hook, and several pass workType / workFlow / importance straight down
    // into memoized children (TaskRow, EpicRow, SprintItem, EpicCard). Without
    // this, the returned object - and every field read off it - had a fresh
    // identity on every render, so those React.memo wrappers never once hit.
    // The tabs .find() below also ran on every render for the same reason.
    return useMemo(() => {
        const template = currentProject?.template;
        const fields = template?.fields;

        return {
            allProjects,
            currentProject,
            projectSlug: currentProject?.project_slug,
            templateSlug: template?.slug,
            defaultTab: fields?.tabs?.find(tab => tab.isDefault === true) || EMPTY_ARRAY,
            loading,
            error,
            templateData: template,
            workType: fields?.work_type,
            workFlow: fields?.work_flow,
            importance: fields?.importance
        };
    }, [allProjects, currentProject, loading, error])
}
