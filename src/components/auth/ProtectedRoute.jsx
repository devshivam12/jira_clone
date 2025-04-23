import useAuth from '@/hooks/useAuth'
import React, { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Loader from '../layout/Loader'

const ProtectedRoute = ({ children }) => {
    // const { user, loading, refetchUser } = useAuth() || {}
    const userData = JSON.parse(localStorage.getItem('userData'))
    const accessToken = localStorage.getItem('accessToken')

    // if(accessToken) return <Navigate to='/dashboard' />
    if (!accessToken) return <Navigate to="/login" replace />
    return children ? children : <Outlet />
}

export default ProtectedRoute