import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormItem, FormMessage } from '../ui/form'
import axios from 'axios'
import { server } from '@/constant/config'
import { useDispatch } from 'react-redux'
import { userExist, userNotExist } from '@/redux/reducers/auth'
import { motion } from 'framer-motion'
import { Separator } from '../ui/separator'
import apiService from '@/api/apiService'

const Register = () => {
  const { handleSubmit, register, reset, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)

  const dispatch = useDispatch()

  const handleSignUp = async (data) => {
    console.log("data", data)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
    try {
      const config = {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await apiService.post('/auth/register', formData, config)
      console.log("response", response)
      const userData = response.data.user
      if (response.status === 201) {
        localStorage.setItem('user', JSON.stringify(userData))
        console.log("userData", userData)
      }
      dispatch(userExist(response.data.user));

    } catch (error) {
      console.log("error", error)
      dispatch(userNotExist(true))
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
                <Input
                  type="password"
                  required
                  placeholder="Enter password"
                  {...register('password', { required: true })}
                  error={!!errors.password}
                  disable={false}
                  min={8}
                  max={256}
                />
                <span>{errors.password ? 'Password is required' : ''}</span>

                <Button disabled={false} size="lg" className="w-full" type="submit">
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
                  <Button size="lg" className="w-full" onClick={handleBack} disabled={step === 1}>
                    Back
                  </Button>
                  <Button disabled={false} size="lg" className="w-full" type="submit">
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
                  <Button disabled={false} size="lg" className="w-full" onClick={handleBack} >
                    Back
                  </Button>
                  <Button disabled={false} size="lg" className="w-full" type="submit">
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
