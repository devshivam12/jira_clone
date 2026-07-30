import React from 'react'
import { Outlet } from 'react-router-dom'
import ProjectBreadcrumb from '@/components/common/ProjectBreadcrumb'

// Wraps every project page (summary, timeline, backlog, board, forms). The
// breadcrumb sits at the top as a fixed-height bar, and the active page renders
// in the scrollable area below it.
const ProjectLayout = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] min-h-0">
      <ProjectBreadcrumb />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Outlet /> {/* This is where Backlog/Summary/etc will render */}
      </div>
    </div>
  )
}

export default ProjectLayout
