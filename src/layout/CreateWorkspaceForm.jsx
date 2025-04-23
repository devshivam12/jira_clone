import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DottedSeparator } from '@/components/dotted-separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useCreateWorkSpaceMutation } from '../redux/api/company/api'
import { Avatar } from '@radix-ui/react-avatar'
import { AvatarFallback } from '@/components/ui/avatar'
import { ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CreateWorkspaceForm = ({ onCancle }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm()
    const { toast } = useToast()
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)
    const [createWorkSpace, { isError, isLoading, error }] = useCreateWorkSpaceMutation()

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('workspace_name', data.workspace_name)
            formData.append('file', selectedFile)

            const response = await createWorkSpace(formData).unwrap();
            console.log("response", response)

            if (response.status === 201) {
                toast({
                    description: response.message,
                    variant: "success"
                })
                reset()
                setPreviewUrl(null)
                setSelectedFile(null)
            }
            onCancle()
        } catch (error) {
            console.log("error", error)
            toast({
                title: "Error",
                description: error,
                variant: "destructive"
            })
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file)) // Generate URL for preview
        }
    }
    const handleIconClick = () => {
        fileInputRef.current.click()
    }

    console.log("selected file", selectedFile)
    console.log("previewUrl", previewUrl)

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">
                    Create a new workspace
                </CardTitle>
            </CardHeader>
            <div className='px-7'>
                <DottedSeparator />
            </div>
            <CardContent className="p-7 space-y-4">
                <form onSubmit={handleSubmit(onSubmit)} >
                    <div className='flex gap-y-4 flex-col'>
                        <Input
                            {...register('workspace_name', { required: 'Workspace name is required' })}
                            placeholder="Your workspace name"
                        />
                    </div>
                    <div className='flex items-center gap-x-4 mt-4'>
                        <div className="relative cursor-pointer" onClick={handleIconClick}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Selected" className="w-24 h-24 object-cover rounded-full sm:rounded-full md:rounded-full lg:rounded-full border" />
                            ) : (
                                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-200 border">
                                    <ImageIcon className="w-8 h-8 text-gray-500" />
                                </div>
                            )}
                        </div>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            accept="'.jpg, .png, .jpeg, .svg'"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div>
                            <p className='text-sm'>
                                Workspace Icon
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Click the icon to upload an image (JPG, PNG, SVG, max 1MB)
                            </p>
                        </div>
                    </div>
                    <DottedSeparator className="py-4" />
                    <div className='flex items-center justify-between gap-x-4'>
                        <Button
                            type="button"
                            size="lg"
                            variant="secondary"
                            onClick={onCancle}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            size="lg"
                        >
                            Create Workspace
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default CreateWorkspaceForm
