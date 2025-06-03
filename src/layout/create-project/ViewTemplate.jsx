import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGetFieldsDataQuery } from '@/redux/api/company/api'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UseTemplate from './UseTemplate'


const ViewTemplate = ({ openTemplate, onClose, templateSlug, projectSlug }) => {
    const [showForm, setShowForm] = useState(false);
    const { data: fieldsData, isLoading } = useGetFieldsDataQuery(
        {
            projectSlug: projectSlug,
            templateSlug: templateSlug
        },
        {
            skip: !openTemplate
        }
    )

    const handleUseTemplate = () => {
        setShowForm(true)
    }
    if (isLoading) {
        return (
            <Dialog open={openTemplate} onOpenChange={onClose}>
                <DialogContent
                    className="max-w-2xl p-0 flex flex-col max-h-[90vh]"
                    style={{
                        scrollbarWidth: 'none',  /* Firefox */
                        msOverflowStyle: 'none',  /* IE and Edge */
                    }}
                >
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-neutral-500" /> {/* Adjust size as needed */}
                        {/* Alternatively, if you don't have a Spinner component: */}
                        {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div> */}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }
    return (
        <>
            <Dialog open={openTemplate} onOpenChange={onClose}>
                <DialogContent
                    className="max-w-2xl p-0 flex flex-col max-h-[90vh]"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {
                        showForm ? (
                            <UseTemplate showForm={showForm} setShowForm={setShowForm} name={fieldsData?.data?.name} />
                        ) : (
                            <>
                                {/* Header Section */}
                                <DialogHeader DialogHeader className="bg-neutral-100 p-6 text-neutral-500 relative">
                                    <DialogTitle className="font-semibold text-xl">
                                        {fieldsData?.data?.name}
                                    </DialogTitle>

                                </DialogHeader>

                                {/* Main Content */}
                                <div className="overflow-y-auto flex-1 p-6 space-y-6 [&::-webkit-scrollbar]:hidden">
                                    {/* Description Section */}
                                    {fieldsData?.data?.fields?.description && (
                                        <div className="space-y-2 text-justify">
                                            <p className="text-neutral-500 font-medium">
                                                {fieldsData.data.fields.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Image and Details Section */}
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Image */}
                                        {fieldsData?.data?.fields?.image && (
                                            <div className="md:w-1/3 flex-shrink-0">
                                                <img
                                                    src={fieldsData.data.fields.image}
                                                    alt={fieldsData.data.name}
                                                    className="w-full h-auto max-w-[200px] mx-auto object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        {/* Details */}
                                        <div className="md:w-2/3 space-y-6">
                                            {/* Recommendation */}
                                            {fieldsData?.data?.fields?.recommendation && (
                                                <div className="space-y-2">
                                                    <span className='text-neutral-500 text-sm font-medium'>
                                                        Recommended for
                                                    </span>
                                                    <p className="text-neutral-500 text-justify font-normal">
                                                        {fieldsData.data.fields.recommendation}
                                                    </p>
                                                </div>
                                            )}

                                            {fieldsData?.data?.fields?.request_type?.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className='text-neutral-500 text-sm font-medium'>
                                                        Request type
                                                    </span>
                                                    {fieldsData?.data?.fields?.request_type?.map((item, index) => (
                                                        <li key={index} className='list-none text-neutral-500 font-normal'>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </div>
                                            )}

                                            {fieldsData?.data?.fields?.service_request_types?.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className='text-neutral-500 text-sm font-medium'>
                                                        Service request types
                                                    </span>
                                                    {fieldsData?.data?.fields?.service_request_types?.map((item, index) => (
                                                        <li key={index} className='list-none text-neutral-500 font-normal'>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </div>
                                            )}

                                            {fieldsData?.data?.fields?.incident_request_types?.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className='text-neutral-500 text-sm font-medium'>
                                                        Incident request types
                                                    </span>
                                                    {fieldsData?.data?.fields?.incident_request_types?.map((item, index) => (
                                                        <li key={index} className='list-none text-neutral-500 font-normal'>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </div>
                                            )}

                                            <div className='flex items-start justify-between gap-x-2'>
                                                {/* Work Type */}
                                                {fieldsData?.data?.fields?.work_type?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-neutral-500 text-sm font-medium">Work Type</p>
                                                        <ul className="list-disc space-y-1">
                                                            {fieldsData.data.fields.work_type.map((item, index) => (
                                                                <li key={index} className="flex items-center gap-x-6 gap-y-6">
                                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${item.color}`}>
                                                                        <img
                                                                            src={item.icon}
                                                                            alt={item.name}
                                                                            className="w-4 h-4 filter brightness-0 invert"
                                                                        />
                                                                    </div>
                                                                    <span className="text-neutral-500">{item.name}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Work Flow */}
                                                {fieldsData?.data?.fields?.work_flow?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-neutral-500 text-sm font-medium">Work Flow</p>
                                                        <ul className="list-disc  space-y-1">
                                                            {fieldsData.data.fields.work_flow.map((item, index) => (
                                                                <div className='w-40'>
                                                                    <li key={index} className={`text-neutral-800 my-2 rounded-sm list-none p-2 ${item.color}`}>
                                                                        {item.name}
                                                                    </li>
                                                                </div>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="py-4 mt-0 border-t border-neutral-200">
                                    <div className='px-5 flex items-center gap-x-5'>
                                        <div >
                                            <Button variant="outline" onClick={onClose}>
                                                Cancle
                                            </Button>
                                        </div>
                                        <div >
                                            <Button variant="teritary" onClick={handleUseTemplate}>Use template</Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </>
                        )
                    }


                </DialogContent>
            </Dialog >

            {/* {showForm && <UseTemplate open={showForm} onClose={() => setShowForm(false)} />} */}
        </>
    )
}

export default ViewTemplate