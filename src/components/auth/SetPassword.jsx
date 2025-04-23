import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeClosed, EyeOff } from 'lucide-react'
import ApiService from '@/api/apiService'
import { useDispatch } from 'react-redux'
import { userExist, userNotExist } from '@/redux/reducers/auth'

const apiService = new ApiService()
const SetPassword = () => {
    const { handleSubmit, register, reset, formState: { errors }, setValue } = useForm()
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email')
    const [step, setStep] = useState(1)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (email) {
            setValue('email', email)
        }
    }, [email, setValue])

    const handleSetPassword = async (data) => {
        try {
            const formData = new FormData()

            // formData.append('email', data.email)
            // formData.append('password', data.password)

            const payload = {
                email: email || data.email,
                password: data.password,
                first_name: data.first_name,
                last_name: data.last_name
            }

            const config = {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            }

            const response = await apiService.post("/company/team/set-password", payload, config)
            console.log("response", response)
            const userData = response.data.user
            if (response.data.status === 200) {
                localStorage.setItem('userData', JSON.stringify(userData))
                localStorage.setItem('accessToken', response.data.user.token)
                console.log("userData", userData)
                dispatch(userExist(userData))
                navigate('/dashboard')
            }
        } catch (error) {
            console.log("error", error)
            // dispatch(userNotExist(userData))
        }
    }

    const onSubmit = (data, e) => {
        if (step === 2) {
            handleSetPassword(data)
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
                            <motion.div className="space-y-4">
                                <div className="relative">
                                    <Input
                                        type="email"
                                        required
                                        name="email"
                                        placeholder="Enter email"
                                        value={email || ''}
                                        readOnly
                                        className="bg-gray-100 cursor-not-allowed" // Visual indication it's disabled
                                        {...register('email', { required: true })}
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-gray-500">Locked</span>
                                </div>

                                <div className='flex items-center relative'>
                                    <Input
                                        type={showPassword ? 'text' : "password"}
                                        required
                                        placeholder="Enter password"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 8,
                                                message: 'Password must be at least 8 characters'
                                            }
                                        })}
                                        error={!!errors.password}
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
                                {errors.password && (
                                    <span className="text-red-500 text-sm">{errors.password.message}</span>
                                )}

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
                                        Submit
                                    </Button>
                                </div>
                            </motion.div>
                        </form>
                    )}

                    {/* {step === 3 && (
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
                    )} */}
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

export default SetPassword
