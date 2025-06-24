import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useProjectData } from '@/hooks/useProjectData'
import { useGetTemplateQuery } from '@/redux/api/company/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'


const ProjectDrawer = ({ openDrawer, onClose }) => {
    const navigate = useNavigate()
    const { projectSlug, templateSlug } = useProjectData()
    console.log("projectSlug", projectSlug)
    const { data: projectData, isLoading: isProjectLoading } = useGetTemplateQuery(projectSlug, {
        skip : !openDrawer
    })
    console.log("projectData", projectData)
    const template = projectData?.data?.templates
    return (
        <Sheet modal={false} open={openDrawer} onOpenChange={onClose} >
            <SheetContent className="absolute bg-neutral-50 mt-[3.5rem] right-0 top-0">
                <SheetHeader>
                    <SheetTitle className='font-semibold text-sm'>Templates</SheetTitle>
                    <SheetDescription>
                        Choose you template for your next project.
                    </SheetDescription>
                </SheetHeader>
                <div className='mt-4'>
                    {
                        template?.map((item, index) => {
                            const truncDescription = (value) => {
                                if (!value) return
                                return value.length > 30 ? value.substring(0, 30) + '...' : value;
                            }
                            return (
                                <React.Fragment>

                                    <Card
                                        key={index}
                                        className="my-4 border-0 border-none outline-none shadow-none"
                                    >
                                        <CardContent className="group relative rounded-xl overflow-hidden border hover:shadow-md transition-all duration-100 hover:-translate-y-1 cursor-pointer p-0">
                                            <div className="flex items-center gap-x-3">
                                                <div className='bg-neutral-100 p-4 flex items-center justify-center '>
                                                    <img
                                                        src={item?.fields?.image}
                                                        alt={item.name}
                                                        className='w-10 h-10 object-contain'
                                                        loading="lazy"
                                                        width={30}
                                                        height={30}
                                                    />
                                                </div>

                                                <div className='flex items-center justify-between'>
                                                    <div className=''>
                                                        <p className='text-neutral-500 text-base font-medium'>
                                                            {item.name}
                                                        </p>
                                                        <p className='text-neutral-400 text-sm font-normal'>
                                                            {truncDescription(item.fields.description)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </React.Fragment>
                            )
                        }
                        )
                    }
                </div>
                <SheetFooter className="float-left ">
                    <span
                        className='cursor-pointer text-sm text-muted-foreground font-medium hover:underline hover:underline-offset-2'
                        onClick={() => window.open(`/create-project/${projectSlug}`, '_blank')}
                    >
                        View more templates
                    </span>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default ProjectDrawer
