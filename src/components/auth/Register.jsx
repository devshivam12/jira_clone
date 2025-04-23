import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Eye, EyeClosed, EyeOff } from 'lucide-react'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { server } from '@/constant/config'
import { useDispatch } from 'react-redux'
import { userExist, userNotExist, setClientId } from '@/redux/reducers/auth'
import { motion } from 'framer-motion'
import { Separator } from '../ui/separator'
import apiService from '@/api/apiService'
import { useRegisterMutation } from '@/redux/api/authApi'
import { useToast } from '@/hooks/use-toast'

const Register = () => {
  const { handleSubmit, register, reset, formState: { errors } } = useForm()
  const [registerUser, { isLoading, error }] = useRegisterMutation()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const {toast} = useToast()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSignUp = async (data) => {
    console.log("data", data)

    // const formData = new FormData()
    // formData.append('username', data.username)
    // formData.append('email', data.email)
    // formData.append('password', data.password)
    // formData.append('first_name', data.first_name)
    // formData.append('last_name', data.last_name)
    try {
      // const config = {
      //   withCredentials: true,
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // };
      const response = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name
      }).unwrap();

      console.log("response", response)
      const userData = response.user
      if (response.status === 201) {
        localStorage.setItem('userData', JSON.stringify(userData))
        localStorage.setItem('accessToken', response.user.token)
        console.log("userData", userData)
        dispatch(userExist(response.user));
        dispatch(setClientId(response.user.clientId));
        navigate('/dashboard')
        toast({
          title: "Registeration successfully done",
          description: response.message,
          variant: "success",
        })

      }
      else if (response.status === 400) {
        toast({
          title: "Registeration failed",
          description: response.message,
          variant: "destructive",
        })
      }
      else {
        toast({
          title: "Registeration failed",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.log("error", error)
      // dispatch(userNotExist(true))
      toast({
        title: "Registeration failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const onSubmit = (data, e) => {
    if (step === 3) {
      handleSignUp(data)
    } else {
      setStep((prevStep) => prevStep + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prevStep) => prevStep - 1)
    }
  }

  return (
    <div className='flex items-center justify-center h-screen'>
      <Card className="w-full md:w-[487px] border-none shadow-none">
        <CardHeader className="flex items-center justify-center text-center p-7">
          <CardTitle className="text-2xl ">
            Hii, There <span>
              🖐
            </span>
            {/* <Separator className="my-4 border-t-2 border-slate-500" /> */}
          </CardTitle>
        </CardHeader>
        <div className='px-7 mb-2'>
          <DottedSeparator />
        </div>
        <CardContent className='p-7'>
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <Input
                  type="email"
                  required
                  name="email"
                  placeholder="Enter email"
                  {...register('email', { required: true })}
                  error={!!errors.email}
                  disable={false}
                />
                <span>{errors.email ? 'Email is required' : ''}</span>
                <div className='flex items-center relative'>
                  <Input
                    type={showPassword === true ? 'text' : "password"}
                    required
                    placeholder="Enter password"
                    {...register('password', { required: true })}
                    error={!!errors.password}
                    disable={false}
                    min={8}
                    max={256}
                  />
                  {
                    showPassword ? (
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
                    )
                  }
                </div>
                <span>{errors.password ? 'Password is required' : ''}</span>

                <Button variant="teritary" disabled={false} size="lg" className="w-full" type="submit">
                  Next
                </Button>
              </motion.div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <Input
                  type="text"
                  required
                  name="first_name"
                  placeholder="Enter First Name"
                  {...register('first_name', { required: true })}
                  error={!!errors.first_name}
                  disable={false}
                />
                <span>{errors.first_name ? 'First name is required' : ''}</span>
                <Input
                  type="text"
                  required
                  placeholder="Enter Last Name"
                  {...register('last_name', { required: true })}
                  error={!!errors.last_name}
                  disable={false}
                />
                <span>{errors.last_name ? 'Last name is required' : ''}</span>


                <div className='flex items-center gap-2'>
                  <Button variant="outline" size="lg" className="w-full" onClick={handleBack} disabled={step === 1}>
                    Back
                  </Button>
                  <Button variant="teritary" disabled={false} size="lg" className="w-full" type="submit">
                    Next
                  </Button>
                </div>
              </motion.div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <Input
                  type="text"
                  required
                  name="username"
                  placeholder="Enter Username"
                  {...register('username', { required: true })}
                  error={!!errors.username}
                  disable={false}
                />
                <span>{errors.username ? 'Username is required' : ''}</span>

                <div className='flex items-center gap-2'>
                  <Button variant="outline" disabled={false} size="lg" className="w-full" onClick={handleBack} >
                    Back
                  </Button>
                  <Button variant="teritary" disabled={false} size="lg" className="w-full" type="submit">
                    Register
                  </Button>
                </div>
              </motion.div>
            </form>
          )}
        </CardContent>
        <div className='px-7'>
          <DottedSeparator />
        </div>
        <CardContent className="p-7 flex flex-col gap-y-4">
          <Link className='underline' to={'/login'}>
            Have an account
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register
