import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import ApiService from '@/api/apiService'
import { useDispatch } from 'react-redux'


import { useLoginMutation } from '@/redux/api/authApi'
import { setClientId, userExist } from '@/redux/reducers/auth'
import { Eye, EyeClosed, EyeOff } from 'lucide-react'
import { Label } from '../ui/label'
import { setLastAccessedProject } from '@/redux/reducers/dynamicRouting'
import ShowToast from '../common/ShowToast'
import ButtonLoader from '../ui/buttonLoader'
import { initializeWithDefaultProject, setAllProjects, setCurrentProject } from '@/redux/reducers/projectSlice'
import { useGetAllCompanyProjectQuery, useGetProjectByIdQuery } from '@/redux/api/company/api'

const Login = () => {
  const dispatch = useDispatch()
  const { handleSubmit, register, reset, formState: { errors } } = useForm()
  const [projectId, setProjectId] = useState(null)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const { data: project } = useGetAllCompanyProjectQuery({
    skip: !shouldNavigate
  })

  // const { data: project } = useGetProjectByIdQuery(projectId, {
  //   skip: !projectId
  // })

  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()

  const [showPassword, setShowPassword] = useState(false)

  const isValidEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  useEffect(() => {
    if (project && project.status === 200 && shouldNavigate) {
      // dispatch(setCurrentProject(project.data))
      console.log("this is working")
      console.log("project------------", project)
      dispatch(setAllProjects(project.data))

      dispatch(setCurrentProject(project.data[0]))
      
      const defaultTab = project.data[0].template.fields.tabs.find(tab => tab.isDefault === true)
      
      const defaultRouting = defaultTab ? defaultTab.url : 'backlog'

      navigate(`/dashboard/${project.data[0].project_slug}/${project.data[0].template.slug}/${defaultRouting}`)
      ShowToast.success('Login successful')
      setShouldNavigate(false) // Reset flag
    }
  }, [project, navigate, shouldNavigate, dispatch])

  const handleLogin = async (formData) => {
    try {
      const response = await login(formData).unwrap()
      console.log("response", response)


      if (response.status === 200) {
        const { project_details, ...userData } = response.user;
        localStorage.setItem('userData', JSON.stringify(userData))
        localStorage.setItem('accessToken', userData.token)
        localStorage.setItem('projectDetails', JSON.stringify(project_details))
        // Update Redux state
        console.log("response", response)
        dispatch(userExist({
          ...response.user,
          role: response.user.role
        }));
        dispatch(setClientId(response.user.clientId));

        if (response.user.project_id.length > 0) {
          console.log("is it working")
          const userProjectId = response.user.project_id[0]
          // setProjectId(userProjectId)

          setShouldNavigate(true)
        }

        // let project_slug = response.user.project_details.project_slug
        // let template_slug = response.user.project_details.template.slug

        // dispatch(setLastAccessedProject({
        //   project_slug: project_slug,
        //   template_slug: template_slug
        // }))

        // // 3. Redirect to dashboard
        // navigate(`/dashboard/${project_slug}/${template_slug}/backlog`);
        // ShowToast.success('Login successfull', {
        //   description: response.message,
        // })
        // window.location.href = '/dashboard'
        reset()
      }
      // }
      else if (response.status === 404) {
        ShowToast.error('Login failed', {
          description: response.message,
          useCustom: true
        })
      }
      else if (response.status === 400) {
        ShowToast.error('Login failed', {
          description: response.message,
          useCustom: true
        })
      }
      else {
        ShowToast.error('Login failed', {
          description: response.message || 'Please try again letter'
        })
      }

    } catch (error) {
      console.log("error", error)
      ShowToast.error(error.message)
    }
  }
  console.log("error", error)

  const onSubmit = (data) => {
    const isEmail = isValidEmail(data.identifier)

    const formData = {
      ...(isEmail ? { email: data.identifier } : { username: data.identifier }),
      password: data.password,
    };
    handleLogin(formData)
  }

  return (
    <div className='flex items-center justify-center h-screen'>
      <Card className="w-full md:w-[487px] border-none shadow-[0_3px_35px_rgba(0,0,0,0.25)]  shadow-indigo-300/50">
        <CardHeader className="flex items-center justify-center text-center p-7">
          <CardTitle className="text-2xl ">
            Welcome back
          </CardTitle>

        </CardHeader>
        <div className='px-7 mb-2'>
          <DottedSeparator />
        </div>
        <CardContent className='p-7'>
          <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
            <div className='space-y-1'>
              <Label className="flex items-center font-semibold text-neutral-500 text-sm">
                Email
                <span className='text-red-300'>*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="Ex. ex@gmail.com"
                {...register('identifier', { required: true })}
              />
              {errors.identifier && <p className='text-red-500 text-sm'>{errors.identifier.message}</p>}
            </div>
            <div className=" space-y-1">
              <Label className="font-semibold flex items-center text-neutral-500">
                Password
                <span className='text-red-300'>*</span>
              </Label>
              <div className='flex items-center relative'>
                <Input
                  type={showPassword === true ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  {...register('password', { required: true })}
                />
                {showPassword ? (
                  <EyeOff
                    size={20}
                    className='text-neutral-500 absolute right-3 cursor-pointer'
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <Eye
                    size={20}
                    className='text-neutral-500 absolute right-3 cursor-pointer'
                    onClick={() => setShowPassword(!showPassword)}
                  />
                )}
              </div>
              {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
            </div>
            <ButtonLoader variant="teritary" type="submit" isLoading={isLoading} size="lg" className="w-full">
              Login
            </ButtonLoader>
          </form>
        </CardContent>
        <div className='px-7'>
          <DottedSeparator />
        </div>
        <CardContent className="p-7 flex flex-col gap-y-4">
          <Link className='underline' to={'/register'}>
            Do'nt have an account
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
