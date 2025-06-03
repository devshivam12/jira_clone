import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowBigLeft, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ViewTemplate from './ViewTemplate'
import UseTemplate from './UseTemplate'

const Template = ({ templateData, isLoading, projectSlug }) => {
    const navigate = useNavigate()
    // const [openTemplateInfo, setOpenTemplateInfo] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)


    if (isLoading) {
        return (
            <div className='mt-10 space-y-6'>
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />

                <Card className="space-y-4 mt-10 border-0 border-none outline-none shadow-none">
                    {[...Array(3)].map((_, index) => (
                        <CardContent key={index} className="p-0">
                            <div className="flex items-stretch h-[10rem]">
                                <Skeleton className="w-[10rem] h-full" />
                                <div className="flex-1 space-y-4 p-4">
                                    <Skeleton className="h-6 w-[200px]" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[90%]" />
                                </div>
                            </div>
                        </CardContent>
                    ))}
                </Card>
            </div>
        )
    }
    return (
        <div className='mt-10'>
            <div>
                <h2 className='text-neutral-500 text-2xl font-medium'>
                    {templateData?.data?.name}
                </h2>
                <p className='text-neutral-500 font-normal text-sm text-justify mt-4'>
                    {templateData?.data?.description}
                </p>
            </div>
            <Card
                className="space-y-4 mt-10 border-0 border-none outline-none shadow-none"
            >
                {
                    templateData?.data?.templates?.map((item, index) => (
                        <CardContent
                            key={index}
                            className='group relative rounded-xl overflow-hidden border hover:shadow-md transition-all duration-100 hover:-translate-y-1 cursor-pointer p-0'
                            onClick={() => setSelectedTemplate(item.slug)}

                        >
                            <div className='flex items-stretch h-[10rem] '>
                                <div className='bg-neutral-100 p-4 flex items-center justify-center '>
                                    {/* <div className=''> */}
                                    <img
                                        src={item.fields.image}
                                        alt={item.name}
                                        className='w-20 h-20 object-contain'
                                        loading="lazy"
                                        width={80}
                                        height={80}
                                    />
                                    {/* </div> */}
                                </div>
                                <div className='py-4 px-5 flex-1 bg-neutral-200 space-y-4 text-justify  '>
                                    <div className='flex items-center justify-between'>
                                        <div className='space-y-4 w-[calc(100%-10rem)]'>
                                            <p className='text-neutral-500 text-base font-semibold'>
                                                {item.name}
                                            </p>
                                            <p className='text-neutral-400 text-sm font-semibold'>
                                                {item.fields.description}
                                            </p>
                                        </div>
                                        <div className=''>
                                            <ChevronRight className='text-neutral-600 font-bold m-auto' />
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </CardContent>
                    ))
                }
            </Card>
            {selectedTemplate && (
                <ViewTemplate
                    openTemplate={!!selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    templateSlug={selectedTemplate}
                    projectSlug={projectSlug}
                />
            )}
        </div>
    )
}

export default Template
