import { loadLastAccessedProject } from '@/redux/reducers/dynamicRouting'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const DashboardRedirect = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { project_slug, template_slug } = useSelector(state => state.dynamicRouting)
    const { user } = useSelector(state => state.auth)

    useEffect(() => {
        dispatch(loadLastAccessedProject())

    }, [dispatch])

    useEffect(() => {
        if (project_slug && template_slug) {
            // Redirect to last accessed project
            navigate(`/dashboard/${project_slug}/${template_slug}/backlog`);
        } else if (user?.project_slug && user?.template_slug) {
            // Use user's default project if available
            navigate(`/dashboard/${user.project_slug}/${user.template_slug}/backlog`);
        } else {
            // No project found - redirect to project creation
            navigate('/login');
        }
    },[project_slug, template_slug, user, navigate])
    return; 
}

export default DashboardRedirect
