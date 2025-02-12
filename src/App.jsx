import { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './components/auth/Register'
import Login from './components/auth/Login'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { server } from './constant/config'
import { userExist, userNotExist } from './redux/reducers/auth'
import Loader from './components/layout/Loader'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './layout/DashboardLayout'
import { ToastViewport } from './components/ui/toast'
import ApiService from './api/apiService'
import CreateWorkspaceForm from './layout/CreateWorkspaceForm'
import AccountLayout from './layout/account-layout/index'
import ProfileVisible from './layout/account-layout/ProfileVisible'
import Email from './layout/account-layout/Email'
import Security from './layout/account-layout/Security'


import Summary from './layout/summary-layout/index'
import Backlog from './layout/backlog-layout/index'
import Board from './layout/board-layout/index'
import Timeline from './layout/timeline-layout/index'
import Forms from './layout/forms/index'

function App() {
  // const { user, loader } = useSelector((state => state.auth))
  const [user, setUser] = useState(null)
  const [loader, setLoader] = useState(true)
  // const dispatch = useDispatch()
  const apiService = new ApiService()

  useEffect(() => {
    apiService.get(`${server}/auth/user-details`, { withCredentials: true })
      .then((res) => {
        // console.log("res", res.data.data)
        // dispatch(userExist(res.data.data))
        setUser(res.data.data)
        setLoader(false)
      })
      .catch((error) => {
        setUser(null)
        setLoader(false)
      })
  }, [])

  console.log("user", user)
  return loader ? <Loader /> : (
    <>
      <BrowserRouter>
        <Suspense>
          <Routes>
            <Route
              path="/login"
              element={
                <ProtectedRoute user={!user} redirect='/'>
                  <Login />
                </ProtectedRoute>
              } />
            <Route path="/register" element={<Register />} />

            {/* for dashboards  */}

            <Route path="/dashboard" element={<ProtectedRoute user={user} redirect="/login"><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="backlog" replace />} />
              <Route path="summary" element={<Summary />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="backlog" element={<Backlog />} />
              <Route path="board" element={<Board />} />
              <Route path='forms' element={<Forms />} />
            </Route>

            {/* for managing user profile */}

            <Route
              path='/manage-account'
              element={
                <ProtectedRoute user={user} redirect='/login'>
                  <AccountLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to='profile-and-visibility' replace />} />
              <Route path='profile-and-visibility' element={<ProfileVisible />} />
              <Route path='email' element={<Email />} />
              <Route path='security' element={<Security />} />
            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  )
}

export default App
