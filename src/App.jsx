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
import Team from './layout/team/index'
import PublicRoute from './components/auth/PublicRoute'
import SetPassword from './components/auth/SetPassword'
import GetTeamDetails from './layout/team/GetTeamDetails'
// import ProjectLayout from './layout/ProjectLayout'
import Project from './layout/projects'
import ProjectLayout from './layout/ProjectLayout'
import CreateProject from './layout/create-project'
import CreateFirstCompanyProject from './components/auth/CreateFirstCompanyProject'
import AutoLogin from './components/auth/AutoLogin'
import { loadLastAccessedProject, setLastAccessedProject } from './redux/reducers/dynamicRouting'
import DashboardRedirect from './components/auth/DashboardRedirect'
import { Toaster } from 'sonner'
import ProjectTab from './layout/projects/ProjectTab'


function App() {
  const accessToken = localStorage.getItem('accessToken')
  const dispatch = useDispatch()

  // // const { user, loader } = useSelector((state => state.auth))
  // const [user, setUser] = useState(null)
  // const [loader, setLoader] = useState(true)
  // // const dispatch = useDispatch()
  // const apiService = new ApiService()

  // useEffect(() => {
  //   apiService.get(`${server}/user/auth/user-details`, { withCredentials: true })
  //     .then((res) => {
  //       // console.log("res", res.data.data)
  //       // dispatch(userExist(res.data.data))
  //       setUser(res.data.data)
  //       setLoader(false)
  //     })
  //     .catch((error) => {
  //       setUser(null)
  //       setLoader(false)
  //     })
  // }, [])

  // console.log("user", user)
  useEffect(() => {
    if (accessToken) {
      dispatch(loadLastAccessedProject())
    }
  }, [dispatch, accessToken])

  console.log("lastAccessedProject", loadLastAccessedProject())
  console.log("setLastAccessedProject", setLastAccessedProject())

  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route
              path='/'
              element={
                accessToken ? (
                  <DashboardRedirect />
                )
                  : (
                    <Navigate to='/login' replace />
                  )
              }
            />
            {/* <Route
              path="/login"
              element={
                <ProtectedRoute user={!user} redirect='/'>
                  <Login />
                </ProtectedRoute>
              } /> */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            {/* <Route path="/register" element={<Register />} /> */}
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            <Route
              path='/auth-callback/'
              element={<AutoLogin />}
            />

            <Route
              path='/choose-project'
              element={
                // <PublicRoute>
                <CreateFirstCompanyProject />
                // </PublicRoute>
              }
            />

            <Route path='/set-password' element={
              <PublicRoute>
                <SetPassword />
              </PublicRoute>
            }

            />

            {/* for dashboards  */}

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardRedirect />} />
              {/* Static routes */}
              {/* <Route index element={<Navigate to="team" replace />} /> */}
              <Route path="team" element={<Team />} />
              <Route path='team/edit/:id' element={<GetTeamDetails />} />

              <Route path='projects' element={<Project />} />
              <Route path='project/edit/:id' element={<ProjectTab />} />
              {/* Project routes - Modified to ensure backlog is default */}
              <Route path=":project_slug/:template_slug" element={<ProjectLayout />}>
                {/* <Route index element={<Backlog />} /> */}
                <Route path="summary" element={<Summary />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="backlog" element={<Backlog />} />
                <Route path="board" element={<Board />} />
                <Route path="forms" element={<Forms />} />
              </Route>
            </Route>

            {/* for create project */}

            <Route path="/create-project" element={<CreateProject />}>
              <Route path=':project_slug' element={<CreateProject />} />
              {/* <Route path=':template_slug' element={< />} /> */}
            </Route>

            {/* for managing user profile */}

            <Route
              path='/manage-account'
              element={
                <ProtectedRoute>
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
      <Toaster
        position="bottom-right"
        richColors
        // expand={true}
        // offset={{ bottom: '24px', right: "16px", left: "16px" }} 
      />
    </>
  )
}

export default App
