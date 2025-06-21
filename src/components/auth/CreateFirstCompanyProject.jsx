import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Eye, EyeClosed, EyeOff, Info, Loader2, X } from 'lucide-react'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { server } from '@/constant/config'
import { useDispatch } from 'react-redux'
import { userExist, userNotExist, setClientId } from '@/redux/reducers/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Separator } from '../ui/separator'
import apiService from '@/api/apiService'
import { useRegisterMutation } from '@/redux/api/authApi'

import { Label } from '../ui/label'
import TooltipWrapper from '../common/TooltipWrapper'
import axios from 'axios'
import ShowToast from '../common/ShowToast'
import { useGetFieldsDataQuery, useGetProjectQuery, useGetTemplateQuery } from '@/redux/api/company/api'

const CreateFirstCompanyProject = () => {
    const [searchParams] = useSearchParams();
    const [selectProject, setSelectProject] = useState(null)
    const [selectTemplate, setSelectTemplate] = useState(null)
    const [showInfoCard, setShowInfoCard] = useState(false)
    const { data: projectData, isLoading: projectLoading } = useGetProjectQuery();
    const { data: templateData, isLoading: templateLoading } = useGetTemplateQuery(selectProject, {
        skip: !selectProject,
    });
    const { data: fieldsData, isLoading: fieldsLoading } = useGetFieldsDataQuery(
        {
            projectSlug: selectProject,
            templateSlug: selectTemplate
        },
        {
            skip: !selectTemplate
        }
    )
    console.log("projectData", projectData)
    console.log("templateData", templateData)
    console.log("fieldsData", fieldsData?.data?.name)

    const { handleSubmit, register, reset, formState: { errors } } = useForm()

    const [step, setStep] = useState(1)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleCreateProject = async (data) => {
        console.log("data", data)
        try {
            const token = searchParams.get('token')
            const clientId = searchParams.get('clientId')
            console.log("token", token)
            console.log("clientId", clientId)
            const query = {
                project: {
                    project_slug: selectProject,
                    project_name: data.project_name,
                    template: fieldsData.data
                }
            }
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER}/company/work-space/create-client-default-project`,
                query,
                {
                    headers: {
                        'Authorization': token,
                        'x-clientId': clientId
                    },
                    withCredentials: true
                },
            );
            console.log("response", response)
            if (response.status === 200) {
                navigate(`/auth-callback?token=${token}&clientId=${clientId}`)
                ShowToast.success('Project created', {
                    description: response.message
                })

            }
            else if (response.status === 400) {
                ShowToast.error('Project creation failed', {
                    description: response.message,
                    useCustom: true
                })
            }
            else {
                ShowToast.error('Please check error', {
                    description: response.message,
                    useCustom: true
                })
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error('Please check error', {
                description: error.message,
                useCustom: true
            })
        }
    }

    const handleProjectSelect = (item) => {
        // alert(item.slug)
        setSelectProject(item.slug)
    }

    const handleTemplateSelect = (item) => {
        setSelectTemplate(item.slug)
    }
    const onSubmit = async (data, e) => {
        if (step === 3) {
            handleCreateProject(data)
        } else {
            setStep((prevStep) => prevStep + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep((prevStep) => prevStep - 1)
        }
    }

    if (projectLoading || templateLoading || fieldsLoading) {
        return (
            <div className='flex items-center justify-center h-screen'>
                <Card className="w-full md:w-[487px] border-none shadow-[0_3px_35px_rgba(0,0,0,0.25)] shadow-indigo-300/50">
                    <CardContent className="flex items-center justify-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-neutral-500" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className='flex items-center justify-center h-screen'>
            <Card className="w-full md:w-[487px] border-none shadow-[0_3px_35px_rgba(0,0,0,0.25)]  shadow-indigo-300/50">
                <CardHeader className="flex items-center justify-center text-center p-7">
                    {
                        step === 1 && (
                            <CardTitle className="text-2xl ">
                                Hii, There <span>
                                    🖐
                                </span>
                                <p className='mt-2 font-medium text-base text-neutral-500'>
                                    What kind of work you want to do??
                                </p>
                            </CardTitle>
                        )
                    }
                    {
                        step === 2 && (
                            <CardTitle className="text-2xl ">
                                Hii, There <span>
                                    🖐
                                </span>
                                <p className='mt-2 font-normal text-sm text-neutral-500'
                                >Please select template that suites your work</p>

                            </CardTitle>
                        )
                    }
                    {
                        step === 3 && (
                            <CardTitle className="text-2xl ">

                                <p className='font-semibold text-md text-neutral-500 text-start'
                                >Name you first project</p>
                                <p className='mt-2 font-normal text-xs text-neutral-500 text-justify'
                                >
                                    Project bring your work to life, heliping your team track progress, stay organized and manage task.
                                </p>
                            </CardTitle>
                        )
                    }
                </CardHeader>
                <div className='px-7 mb-2'>
                    <DottedSeparator />
                </div>
                <CardContent className='px-7 py-5'>

                    {step === 1 && (
                        <form action="" onSubmit={handleSubmit(onSubmit)}>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >

                                <div className="grid grid-flow-col grid-rows-2 gap-4 ">
                                    {projectData?.data?.map((item, index) => (
                                        <label key={index} className="flex flex-col items-center border cursor-pointer hover:bg-gray-50 px-0">
                                            <input
                                                type="radio"
                                                name="templateSelection"
                                                value={item.slug}
                                                className="hidden peer"
                                                onChange={() => handleProjectSelect(item)}
                                                checked={selectProject === item.slug}
                                            />
                                            <div className="peer-checked:border-blue-900 peer-checked:border-1 peer-checked:bg-blue-50 flex items-center gap-2 w-full px-2 py-2 ">
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-8 h-8 mt-2 object-contain"
                                                    />
                                                )}
                                                <h1 className="font-medium text-sm text-center">{item.name}</h1>
                                            </div>
                                        </label>
                                    ))}

                                </div>
                                {!selectProject && (
                                    <p className="text-red-500 text-sm">Please select a project to continue</p>
                                )}

                                <div className='flex items-center gap-2'>
                                    {/* <Button variant="outline" size="lg" className="w-full" onClick={handleBack} disabled={step === 1}>
                                        Back
                                    </Button> */}
                                    <Button
                                        variant="teritary"
                                        size="lg"
                                        className={` ${!selectProject ? 'cursor-not-allowed w-full' : 'w-full'} `}
                                        type="submit"
                                        disabled={!selectProject}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </motion.div>
                        </form>
                    )}

                    {step === 2 && (
                        <form action="" onSubmit={handleSubmit(onSubmit)}>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >

                                <div className="grid grid-flow-col grid-rows-2 gap-4 ">
                                    {templateData?.data?.templates.map((item, index) => (
                                        <label key={index} className="flex flex-col items-center border cursor-pointer hover:bg-gray-50 px-0">
                                            <input
                                                type="radio"
                                                name="templateSelection"
                                                value={item.slug}
                                                className="hidden peer"
                                                onChange={() => handleTemplateSelect(item)}
                                                checked={selectTemplate === item.slug}
                                            />
                                            <div className="peer-checked:border-blue-900 peer-checked:border-1 peer-checked:bg-blue-50 flex items-center gap-2 w-full px-2 py-2 ">
                                                {item.fields.image && (
                                                    <img
                                                        src={item.fields.image}
                                                        alt={item.fields.name}
                                                        className="w-8 h-8 mt-2 object-contain"
                                                    />
                                                )}
                                                <h1 className="font-medium text-sm text-center">{item.name}</h1>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {
                                    !selectTemplate && (
                                        <p className='text-red-400 text-sm'>Please select template to continue</p>
                                    )
                                }

                                <div className='flex items-center gap-2'>
                                    <Button variant="outline" size="lg" className="w-full" onClick={handleBack} disabled={step === 1}>
                                        Back
                                    </Button>
                                    <Button
                                        variant="teritary"
                                        disabled={!selectTemplate}
                                        size="lg"
                                        className={` ${!selectTemplate ? 'cursor-not-allowed w-full' : 'w-full'} `}
                                        type="submit"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </motion.div>
                        </form>
                    )}

                    {step === 3 && (
                        <form action="" onSubmit={handleSubmit(onSubmit)}>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >
                                <div className='space-y-1'>

                                    <div className='flex items-center gap-x-3 relative'>
                                        <Label className="font-semibold text-neutral-500 flex items-center">Name your project
                                            <span className='text-red-300'>*</span>
                                        </Label>

                                        <Info
                                            className='text-neutral-500 hover:text-neutral-600 cursor-pointer'
                                            size={14}
                                            onClick={() => setShowInfoCard((prev) => !prev)}
                                        />

                                        {/* Fields Data Info Card */}
                                        <AnimatePresence >
                                            {showInfoCard && fieldsData && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className='absolute left-48 ml-2 top-0 z-50'
                                                >
                                                    {/* <div className="absolute -top-4 left-0 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-blue-200" /> */}

                                                    <Card
                                                        className="w-full md:w-[487px] border-none bg-blue-50 shadow-[0_3px_35px_rgba(0,0,0,0.25)] shadow-indigo-300/50 h-[50vh] overflow-y-auto"
                                                        style={{
                                                            scrollbarWidth: 'none',
                                                            msOverflowStyle: 'none',
                                                        }}
                                                    >
                                                        <CardHeader className="sticky top-0 z-10 bg-blue-50 pb-3 shadow-sm">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="w-72">
                                                                    <p className='text-md font-semibold text-blue-800'>
                                                                        {fieldsData?.data?.name}
                                                                    </p>

                                                                </CardTitle>
                                                                <div
                                                                    className=' hover:bg-blue-100 cursor-pointer p-2 hover:rounded-md justify-center'
                                                                    onClick={() => setShowInfoCard(false)}
                                                                >
                                                                    <X
                                                                        size={16}
                                                                        className="text-blue-600 cursor-pointer hover:text-blue-800"

                                                                    />
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0 pb-4 ">
                                                            {fieldsLoading ? (
                                                                <Loader2 className="h-12 w-12 animate-spin text-blue-800" />
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className='text-xs font-normal text-blue-600 text-justify mt-3'>
                                                                            {fieldsData?.data?.fields.description}
                                                                        </p>
                                                                    </div>
                                                                    {fieldsData?.data?.fields?.service_request_types && (
                                                                        <div>
                                                                            <p className="text-xs text-blue-700 mb-2 font-medium">Services request type</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {fieldsData?.data?.fields?.service_request_types.map((key, index) => (
                                                                                    <span
                                                                                        key={index}
                                                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200"
                                                                                    >
                                                                                        {key}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {fieldsData?.data?.fields?.request_type && (
                                                                        <div>
                                                                            <p className="text-xs text-blue-700 mb-2 font-medium">Request type</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {fieldsData?.data?.fields?.request_type.map((key, index) => (
                                                                                    <span
                                                                                        key={index}
                                                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200"
                                                                                    >
                                                                                        {key}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {fieldsData?.data?.fields?.work_type?.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs text-blue-700 font-medium mb-2">Work type</p>
                                                                            <div className="grid grid-cols-2 items-center gap-2">
                                                                                {fieldsData?.data?.fields?.work_type.map((item, index) => (
                                                                                    <div
                                                                                        className='border border-blue-200 flex items-center gap-x-2 rounded-md p-2'
                                                                                        key={index}
                                                                                    >
                                                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${item.color}`}>
                                                                                            <img
                                                                                                src={item.icon}
                                                                                                alt={item.name}
                                                                                                className="w-3 h-3 filter brightness-0 invert"
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-blue-900 text-xs">{item.name}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {fieldsData?.data?.fields?.work_flow?.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs text-blue-700 font-medium mb-2">Work flow</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {fieldsData?.data?.fields?.work_flow.map((key, index) => (
                                                                                    <span
                                                                                        key={index}
                                                                                        className={`px-2 py-1 ${key.color} text-blue-900 text-xs rounded-md border border-blue-200`}
                                                                                    >
                                                                                        {key.name}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {fieldsData?.data?.fields?.incident_request_types && (
                                                                        <div>
                                                                            <p className="text-xs text-blue-700 font-medium mb-2">Incident request types</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {fieldsData?.data?.fields?.incident_request_types.map((item, index) => (

                                                                                    <span
                                                                                        key={index}
                                                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200"
                                                                                    >
                                                                                        {item}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                    </div>
                                    <Input
                                        type="text"
                                        required
                                        name="project_name"
                                        placeholder="Project name"
                                        onKeyDown={(e) => {
                                            if (/\d/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        {...register('project_name', { required: true })}
                                        error={!!errors.project_name}
                                        disable={false}
                                    />
                                    <span className='text-red-400 text-sm font-semibold'>{errors.project_name ? 'Project name is required' : ''}</span>

                                </div>



                                <div className='bg-neutral-100 p-2 mt-4'>
                                    <p className='text-xs text-neutral-600 font-normal'>
                                        Example project names:
                                    </p>
                                    <p className='text-xs text-neutral-600 font-normal'>
                                        Team Qa, Web designers, The developers, Backlog handlers
                                    </p>
                                </div>

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

                </CardContent>

            </Card>
        </div >
    )
}

export default CreateFirstCompanyProject
