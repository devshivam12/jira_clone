import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import ApiService from '@/api/apiService'
import { useDispatch } from 'react-redux'

import { useToast } from '@/hooks/use-toast'
import { useLoginMutation } from '@/redux/api/authApi'
import { setClientId, userExist } from '@/redux/reducers/auth'
import { Eye, EyeClosed, EyeOff } from 'lucide-react'
const apiService = new ApiService()

const Login = () => {
  const dispatch = useDispatch()
  const { handleSubmit, register, reset, formState: { errors } } = useForm()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()

  const [showPassword, setShowPassword] = useState(false)

  const isValidEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  const handleLogin = async (formData) => {
    try {
      const response = await login(formData).unwrap()
      console.log("response", response)


      if (response.status === 200) {
        localStorage.setItem('userData', JSON.stringify(response.user))
        localStorage.setItem('accessToken', response.user.token)
        // Update Redux state
        console.log("response", response)
        dispatch(userExist({
          ...response.user,
          role: response.user.role
        }));
        dispatch(setClientId(response.user.clientId));

        toast({
          title: "Login success",
          description: response.message,
          variant: "success",
        })
        window.location.href = '/dashboard'
      }
      // }
      else if (response.status === 404) {
        toast({
          title: "Login failed",
          description: response.message,
          variant: "destructive"
        })
      }
      else if (response.status === 400) {
        toast({
          title: "Login failed",
          description: response.message,
          variant: "destructive"
        })
      }
      else {
        toast({
          title: "Something Went Wrong",
          description: response.message || "Please try again later.",
          variant: "destructive",
        });
      }
      reset()
    } catch (error) {
      console.log("error", error)
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      })
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
      <Card className="w-full md:w-[487px] border-none shadow-none">
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
            <Input
              type="text"
              required
              placeholder="Enter email or username"
              {...register('identifier', { required: true })}
            />
            {errors.identifier && <p className='text-red-500 text-sm'>{errors.identifier.message}</p>}
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
            <Button type="submit" disable={isLoading} size="lg" className="w-full">
              Login
            </Button>
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
