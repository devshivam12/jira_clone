import React from 'react'
import useAuth from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import Loader from '../layout/Loader'

const PublicRoute = ({ children }) => {
    // const { user, loading } = useAuth() || {}
    const accessToken = localStorage.getItem('accessToken')

    // if (loading) return <Loader />
    if (accessToken) return <Navigate to="/dashboard" replace />
    return children
}

export default PublicRoute
