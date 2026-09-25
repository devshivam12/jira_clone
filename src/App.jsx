import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Loader from './components/layout/Loader'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import { loadLastAccessedProject } from './redux/reducers/dynamicRouting'
import { Toaster } from 'sonner'

// Every page below is code split. They used to be static imports, which put
// the whole app - timeline chart, data tables, rich text editor, auth screens -
// into one 1.9 MB chunk that had to be downloaded and parsed before the login
// screen could paint. Now each page is fetched the first time it is routed to.
//
// The guards (ProtectedRoute, PublicRoute) and the Loader stay eager on
// purpose: they are tiny, they run on the very first paint, and the Loader is
// the Suspense fallback so it cannot be lazy itself.
const Login = lazy(() => import('./components/auth/Login'))
const Register = lazy(() => import('./components/auth/Register'))
const SetPassword = lazy(() => import('./components/auth/SetPassword'))
const AutoLogin = lazy(() => import('./components/auth/AutoLogin'))
const DashboardRedirect = lazy(() => import('./components/auth/DashboardRedirect'))
const CreateFirstCompanyProject = lazy(() => import('./components/auth/CreateFirstCompanyProject'))

const DashboardLayout = lazy(() => import('./layout/DashboardLayout'))
const ProjectLayout = lazy(() => import('./layout/ProjectLayout'))
const AccountLayout = lazy(() => import('./layout/account-layout/index'))

const ProfileVisible = lazy(() => import('./layout/account-layout/ProfileVisible'))
const Email = lazy(() => import('./layout/account-layout/Email'))
const Security = lazy(() => import('./layout/account-layout/Security'))

const Summary = lazy(() => import('./layout/summary-layout/index'))
const Backlog = lazy(() => import('./layout/backlog-layout/index'))
const Board = lazy(() => import('./layout/board-layout/index'))
const Timeline = lazy(() => import('./layout/timeline-layout/index'))
const List = lazy(() => import('./layout/list-layout/index'))
const TaskView = lazy(() => import('./layout/task-layout/index'))
const Forms = lazy(() => import('./layout/forms/index'))

const Team = lazy(() => import('./layout/team/index'))
const EditTeam = lazy(() => import('./layout/team/EditTeam'))
const People = lazy(() => import('./layout/people/index'))
const EditPeople = lazy(() => import('./layout/people/EditPeople'))
const Project = lazy(() => import('./layout/projects'))
const ProjectTab = lazy(() => import('./layout/projects/ProjectTab'))
const CreateProject = lazy(() => import('./layout/create-project'))


function App() {
  const accessToken = localStorage.getItem('accessToken')
  const dispatch = useDispatch()

  useEffect(() => {
    if (accessToken) {
      dispatch(loadLastAccessedProject())
    }
  }, [dispatch, accessToken])


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
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
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
              <Route path='team/edit/:id' element={<EditTeam />} />

              <Route path="peoples" element={<People />} />
              <Route path="peoples/edit/:id" element={<EditPeople />} />

              <Route path='projects' element={<Project />} />
              <Route path='project/edit/:id' element={<ProjectTab />} />
              {/* Project routes - Modified to ensure backlog is default */}
              <Route path=":project_slug/:template_slug" element={<ProjectLayout />}>
                {/* <Route index element={<Backlog />} /> */}
                <Route path="summary" element={<Summary />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="backlog" element={<Backlog />} />
                <Route path="list" element={<List />} />
                <Route path="board" element={<Board />} />
                <Route path="forms" element={<Forms />} />
                {/* Dedicated page for a single work item. The drawer opens the
                    same task in a query param; this one keeps the id in the
                    path so the link can be shared and opened in a new tab. */}
                <Route path="view/:task_id" element={<TaskView />} />
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
