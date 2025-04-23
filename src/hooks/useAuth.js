import React, { useEffect } from 'react'
import { useVerifyUserQuery } from '@/redux/api/authApi'
import { setClientId, setLoading, userExist, userNotExist } from '@/redux/reducers/auth'
import { useDispatch, useSelector } from 'react-redux'

const useAuth = () => {
    const dispatch = useDispatch()
    const authState = useSelector(state => state.auth)
    const { data, error, isLoading, isUninitialized, refetch } = useVerifyUserQuery(undefined, {
        refetchOnMountOrArgChange: true,
        skip: !localStorage.getItem('accessToken')
    })
    console.log("data", data)
    useEffect(() => {
        if (isUninitialized) return;
        if (isLoading) {
            dispatch(setLoading())
        }
        else if (data) {
            dispatch(userExist(data.data))
            if (data?.data?.clientId) {
                console.log("data?.data?.clientId", data?.data?.clientId)
                dispatch(setClientId(data.data.clientId));
            }
        }
        else if (error) {
            dispatch(userNotExist())
        }
    }, [data, error, isLoading, dispatch, isUninitialized])
    return {
        ...authState,
        refetchUser: refetch // Expose refetch capability
    };
}

export default useAuth
