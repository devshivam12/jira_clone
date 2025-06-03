import React from 'react'

import { Outlet, useLocation, useParams } from 'react-router-dom'


const ProjectLayout = () => {
  const params = useParams()
  const location = useLocation()
  console.log("Params:", params)
  console.log("Location:", location.pathname)
  return (
    <div>
      {/* Optional: Project header/nav here */}
      <Outlet /> {/* This is where Backlog/Summary/etc will render */}
    </div>
  )
}

export default ProjectLayout
