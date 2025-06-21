import { useProjectData } from '@/hooks/useProjectData'
import { loadLastAccessedProject } from '@/redux/reducers/dynamicRouting'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const DashboardRedirect = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const {currentProject, projectSlug, templateSlug, defaultTab} = useProjectData()

    console.log("currentProject", currentProject)
    
    useEffect(() => {
        dispatch(loadLastAccessedProject())
    }, [dispatch])

    useEffect(() => {
        if (projectSlug && templateSlug) {
            navigate(`/dashboard/${projectSlug}/${templateSlug}/${defaultTab.url}`);
        } 
        else {
            // No project found - redirect to project creation
            navigate('/login');
        }
    },[projectSlug, templateSlug, navigate])
    return; 
}

export default DashboardRedirect
