import React from 'react'
import { useSelector } from 'react-redux'

const withProjectData = (WrappedComponent) => {
  return (props) => {
    const { currentProject, loading, error } = useSelector((state) => state.projectSlice)

    const projectSlug = currentProject.project_slug;
    const templateSlug = currentProject.template?.slug;
    const projectTabs = currentProject.template?.fields?.tabs || [];

    return (
      <WrappedComponent
        {...props}
        currentProject={currentProject}
        projectSlug={projectSlug}
        templateSlug={templateSlug}
        projectTabs={projectTabs}
      />
    )
  }
}

export default withProjectData
