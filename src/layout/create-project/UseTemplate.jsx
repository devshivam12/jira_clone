import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect';
import { Info, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import ShowToast from '@/components/common/ShowToast';
import { useCreateProjectMutation } from '@/redux/api/company/api';
import { useForm } from 'react-hook-form';
import ButtonLoader from '@/components/ui/buttonLoader';
import { useDispatch } from 'react-redux';
import { addProject } from '@/redux/reducers/projectSlice';
import { useProjectData } from '@/hooks/useProjectData';
import { useNavigate } from 'react-router-dom';

import DynamicDropdownSelector from '@/components/common/DynamicDropdownSelector';

const UseTemplate = ({ showForm, setShowForm, fieldsData, project_slug }) => {
    const { handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { currentProject, projectSlug, templateSlug, defaultTab } = useProjectData()
    const [createProject, { isLoading }] = useCreateProjectMutation()
    const projectName = watch('name');
    const projectKey = watch('project_key');
    const [leaderValue, setLeaderValue] = useState(null)

    const handleKeyChange = useCallback((e) => {
        const value = e.target.value
            .toUpperCase()
            .replace(/[^A-Z]/g, '');
        setValue('project_key', value);
    }, [setValue]);

    const handleCreateProject = async (data) => {
        try {
            const payload = {
                project: {
                    project_slug: project_slug,
                    template: fieldsData?.data,
                    project_key: data.project_key,
                    name: data.name,
                    project_leader: leaderValue
                }
            }
            console.log("payload", payload)
            const response = await createProject(payload).unwrap()
            console.log("response", response)
            if (response.status === 200) {
                const newProject = response.data
                dispatch(addProject({
                    ...newProject,
                    setAsCurrent: true
                }))
                navigate(`/dashboard/${projectSlug}/${templateSlug}/${defaultTab.url}`)
                reset()
                ShowToast.success("Project successfully created")
            }

            if (response.status === 400) {
                ShowToast.error("Project creation failed", {
                    description: response.message,
                    useCustom: true,
                    duration: 5000
                })
            }
        } catch (error) {
            console.log("error", error)
            ShowToast.error('project creation failed', {
                description: error.message,
                useCustom: true,
                duration: 5000
            })
        }
    }

    const onSubmit = (data) => {
        handleCreateProject(data)
    }
    return (
        <>
            <DialogHeader className="bg-neutral-100 p-6 text-neutral-500 m-0 ">
                <DialogTitle className="font-semibold text-xl">Create New Project from "{fieldsData?.data?.name}" Template </DialogTitle>
                <div className='mt-2  w-10/12'>
                    <p className="text-xs text-justify text-neutral-400 font-normal">
                        Configure your new project based on the {fieldsData?.data?.name} template.
                        Set your project details and invite team members to get started.
                    </p>
                </div>
            </DialogHeader>
            <form className='space-y-4 px-6' onSubmit={handleSubmit(onSubmit)}>
                <div className='w-96 space-y-2'>

                    <div className='space-y-1'>
                        <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                            Name
                            <span className='text-red-300'>*</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder="Enter your project name"
                            // onChange={(e) => setProjectName(e.target.value)}
                            className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                            {...register('name', {
                                required: 'Project name is required',
                                onChange: (e) => {
                                    // Convert to title case as user types
                                    const value = e.target.value
                                        .toLowerCase()
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                    e.target.value = value;
                                }
                            })}
                        />
                        {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
                    </div>

                    <div className='space-y-1'>
                        <div className='flex items-center gap-x-2'>
                            <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                                Key
                                <span className='text-red-300'>*</span>
                            </Label>
                            <div>
                                <TooltipWrapper
                                    content="Helps quickly recognize which project an issue belongs to (e.g., TEST-101 = Test Project, DEV-205 = Development Project)."
                                    className="w-44 shadow-md text-justify"
                                    direction="right"
                                    width='200px'
                                >
                                    <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                                </TooltipWrapper>
                            </div>
                        </div>
                        <Input
                            type="text"
                            placeholder="Enter unique project key"
                            className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                            // onChange={(e) => setProjectKey(e.target.value)}
                            {...register('project_key', {
                                required: 'Project key is required',
                                pattern: {
                                    value: /^[A-Z]+$/,
                                    message: 'Project key must contain only uppercase letters'
                                },
                                onChange: handleKeyChange
                            })}
                        />
                        {errors.project_key && <p className='text-red-500 text-sm'>{errors.project_key.message}</p>}
                    </div>

                    <div className='space-y-1'>
                        <div className='flex items-center gap-x-2'>
                            <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                                Project leader
                                <span className='text-red-300'>*</span>
                            </Label>
                            <div>
                                <TooltipWrapper
                                    content="Select a project leader"
                                    className="w-44 shadow-md text-justify"
                                    direction="right"
                                >
                                    <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                                </TooltipWrapper>
                            </div>
                        </div>
                        <div>

                            <DynamicDropdownSelector
                                onChange={setLeaderValue}
                                label="Select project leader..."
                            />
                        </div>

                    </div>


                </div>
                <DialogFooter className="mt-0 border-t border-neutral-200">
                    <div className='flex itmes-center p-6 gap-x-5'>
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(!showForm)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                        <div>
                            <ButtonLoader
                                variant="teritary"
                                type='submit'
                                isLoading={isLoading}
                            >
                                Submit
                            </ButtonLoader>
                        </div>
                    </div>
                </DialogFooter>
            </form >
        </>

    );
};

export default UseTemplate;