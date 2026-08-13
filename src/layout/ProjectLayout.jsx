import React from 'react'
import { Outlet } from 'react-router-dom'
import ProjectBreadcrumb from '@/components/common/ProjectBreadcrumb'

// Wraps every project page (summary, timeline, backlog, board, forms). The
// breadcrumb sits at the top as a fixed-height bar, and the active page renders
// in the scrollable area below it.
const ProjectLayout = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] min-h-0 min-w-0">
      <ProjectBreadcrumb />
      {/* overflow-x-hidden keeps a wide page (the timeline chart) from making
          this column scroll sideways. Pages that need horizontal scrolling own
          it inside their own container, so the breadcrumb and page header stay
          put. */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <Outlet /> {/* This is where Backlog/Summary/etc will render */}
      </div>
    </div>
  )
}

export default ProjectLayout
