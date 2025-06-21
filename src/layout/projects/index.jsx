import React, { useState } from 'react'
import ProjectDrawer from './ProjectDrawer'
import { Button } from '@/components/ui/button'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const Project = () => {
  const [openTemplate, setOpenTemplate] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className=''>
      <div className=''>
        <Button variant="teritary" onClick={() => navigate('/create-project/software_management', { state: { from: location.pathname } })} >
          Create Project
        </Button>
        <Button variant="outline" onClick={() => setOpenTemplate(true)}>
          Templates
        </Button>
        <ProjectDrawer openDrawer={openTemplate} onClose={() => setOpenTemplate(false)} />
      </div>
    </div>
  )
}

export default Project
