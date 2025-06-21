import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Eye, EyeClosed, EyeOff, Info, Loader2, X } from 'lucide-react'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { useDispatch } from 'react-redux'
import { userExist, userNotExist, setClientId } from '@/redux/reducers/auth'
import { motion, AnimatePresence } from 'framer-motion'

import { useRegisterMutation } from '@/redux/api/authApi'

import { Label } from '../ui/label'
import ButtonLoader from '../ui/buttonLoader'

import ShowToast from '../common/ShowToast'

const Register = () => {

  const { handleSubmit, register, reset, watch, setValue, formState: { errors } } = useForm()
  const [registerUser, { isLoading, error }] = useRegisterMutation()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const firstName = watch('first_name')
  const lastName = watch('last_name')

  useEffect(() => {
    if (step === 2 && (firstName || lastName)) {
      const cleanFirstName = (firstName || '').trim().replace(/\s+/g, '')
        .toLowerCase();

      const randomDigits = Math.floor(10 + Math.random() * 90)

      const username = `${cleanFirstName}@${randomDigits}`
      setValue('username', username)
    }
  }, [firstName, lastName, setValue, step])

  const formatName = (value, fieldName) => {
    if (!value) return value;

    let formatted = value.replace(/\s+/g, '');

    switch (fieldName) {
      case 'first_name':

        if (formatted.length > 0) {
          formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
        }
        break;

      case 'last_name':

        break;

      case 'email':

        formatted = formatted.toLowerCase();
        break;

      default:
        // No additional formatting for other fields
        break;
    }

    return formatted;
  };

  const handleInputChange = (e, fieldName) => {
    
    if (e.target.value.includes(' ')) {
      e.target.value = e.target.value.replace(/\s/g, '');
    }

    const formattedValue = formatName(e.target.value, fieldName);
    setValue(fieldName, formattedValue);
  };

  const handleSignUp = async (data) => {
    console.log("data", data)
    try {

      const response = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      }).unwrap();

      console.log("response", response)
      const userData = response.user
      if (response.status === 201) {
        console.log("userData", userData)
        dispatch(userExist(response.user));
        dispatch(setClientId(response.user.clientId));
        navigate(`/choose-project?token=${response.user.token}&clientId=${response.user.clientId}`)
        ShowToast.success('Successfully register', {
          description: response.message,
        })

      }
      else if (response.status === 400) {
        ShowToast.error('Registeration failed', {
          description: response.message,
          useCustom: true
        })
      }
      else if (response.status === 409) {
        ShowToast.error('Registeration failed', {
          description: response.message,
          useCustom: true
        })
      }
      else {
        ShowToast.error('Registeration failed', {
          description: response.message,
        })
      }
    } catch (error) {
      console.log("error", error)
      // dispatch(userNotExist(true))
      ShowToast.error('Registeration failed', {
        description: error.message,
      })
    }
  }


  const onSubmit = async (data, e) => {
    if (step === 2) {
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
      <Card className="w-full md:w-[487px] border-none shadow-[0_3px_35px_rgba(0,0,0,0.25)]  shadow-indigo-300/50">
        <CardHeader className="flex items-center justify-center text-center p-7">
          {step === 1 && (
            <CardTitle className="text-2xl ">
              Hii, There <span>
                🖐
              </span>

              <p className='mt-2 font-semibold text-base text-neutral-500 '>
                Please add your email and password
              </p>

            </CardTitle>
          )}
          {
            step === 2 && (
              <CardTitle className="text-2xl ">
                Hii, There <span>
                  🖐
                </span>
                <p className='mt-2 font-medium text-base text-neutral-500'>Please add your first name, last name and username for better recognization</p>
              </CardTitle>
            )
          }

        </CardHeader>
        <div className='px-7 mb-2'>
          <DottedSeparator />
        </div>
        <CardContent className='px-7 py-5'>
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className='space-y-1'>
                  <Label className="flex items-center font-semibold text-neutral-500 text-sm">
                    Email
                    <span className='text-red-300'>*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    name="email"
                    placeholder="Ex. shivam@gmail.com"
                    {...register('email', {
                      required: true,
                      onChange: (e) => handleInputChange(e, 'email')
                    })}
                    error={!!errors.email}
                    disable={false}
                  />
                  <span className='text-red-400 text-sm font-semibold'>{errors.email ? 'Email is required' : ''}</span>
                </div>
                <div className=" space-y-1">
                  <Label className="font-semibold flex items-center text-neutral-500">
                    Password
                    <span className='text-red-300'>*</span>
                  </Label>
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

                </div>
                <span className='text-red-400 text-sm font-semibold'>{errors.password ? 'Password is required' : ''}</span>

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
                <div className='space-y-1'>
                  <Label className="font-semibold flex items-center text-neutral-500">
                    First Name
                    <span className='text-red-300'>*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    name="first_name"
                    placeholder="Ex. Shivam"
                    {...register('first_name', {
                      required: true,
                      onChange: (e) => handleInputChange(e, 'first_name')
                    })}
                    error={!!errors.first_name}
                    disable={false}
                  />
                  <span className='text-red-400 text-sm font-semibold'>{errors.first_name ? 'First name is required' : ''}</span>
                </div>

                <div className='space-y-1'>
                  <Label className="font-semibold text-neutral-500 flex items-center">Last Name
                    <span className='text-red-300'>*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Ex. Mittal"
                    {...register('last_name', { 
                      required: true, 
                      onChange: (e) => handleInputChange(e, 'last_name')
                    })}
                    error={!!errors.last_name}
                    disable={false}
                  />
                  <span className='text-red-400 text-sm font-semibold'>{errors.last_name ? 'Last name is required' : ''}</span>

                </div>

                <div className='space-y-1'>
                  <Label className="font-semibold text-neutral-500 flex items-center">Username
                    <span className='text-red-300'>*</span>
                  </Label>

                  <Input
                    type="text"
                    required
                    name="username"
                    placeholder="Ex. shivam@mita12"
                    {...register('username', { required: true })}
                    error={!!errors.username}
                    disable={false}
                  />
                  <span className='text-red-400 text-sm font-semibold'>{errors.username ? 'Username is required' : ''}</span>

                </div>


                <div className='flex items-center gap-2'>
                  <Button variant="outline" size="lg" className="w-full" onClick={handleBack} disabled={isLoading}>
                    Back
                  </Button>
                  <ButtonLoader
                    variant="teritary"
                    className="py-6 px-6 w-full"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    type="submit"
                  >
                    Register
                  </ButtonLoader>
                  {/* <Button variant="teritary" disabled={false} size="lg" className="" >

                  </Button> */}
                </div>
              </motion.div>
            </form>
          )}

        </CardContent>
        <div className='px-7'>
          <DottedSeparator />
        </div>
        <CardContent className="p-7 flex flex-col gap-y-4">
          <Link
            className='underline text-neutral-500 font-semibold text-base'
            to={'/login'}
          >
            Have an account
          </Link>
        </CardContent>
      </Card>
    </div >
  )
}

export default Register
