import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmailMultiSelect } from '@/components/ui/EmailMultiSelect';
import { EmailMultiSelectInput } from '@/components/ui/EmailMultiSelectInput';
import { Info } from 'lucide-react';
import TooltipWrapper from '@/components/common/TooltipWrapper';

const UseTemplate = ({ showForm, setShowForm, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);

    const handleSuccess = (members) => {
        console.log("Selected members:", members);
        setSelectedMembers(members);
    };
    return (
        <>
            <DialogHeader className="bg-neutral-100 p-6 text-neutral-500 m-0 ">
                <DialogTitle className="font-semibold text-xl">Create New Project from "{name}" Template </DialogTitle>
                <div className='mt-2  w-10/12'>
                    <p className="text-xs text-justify text-neutral-400 font-normal">
                        Configure your new project based on the {name} template.
                        Set your project details and invite team members to get started.
                    </p>
                </div>
            </DialogHeader>
            <div className="space-y-4 px-6 w-96">
                <div className=''>
                    <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                        Name
                        <span className='text-red-300'>*</span>
                    </Label>
                    <Input
                        type="text"
                        placeholder="Enter your project name"
                        className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                    />
                </div>

                <div className=''>
                    <div className='flex items-center gap-x-2'>
                        <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                            Key
                            <span className='text-red-300'>*</span>
                        </Label>
                        <div>
                            <TooltipWrapper
                                content="Helps quickly recognize which project an issue belongs to (e.g., TEST-101 = Test Project, DEV-205 = Development Project)."
                                className="w-44 shadow-md text-justify"
                                direction="bottom"
                            >
                                <Info className='text-neutral-500 hover:text-neutral-600 cursor-pointer' size={14} />
                            </TooltipWrapper>
                        </div>
                    </div>
                    <Input
                        type="text"
                        placeholder="Enter unique project key"
                        className="px-3 py-2 cursor-pointer hover:bg-neutral-100 focus-0 outline-none border border-neutral-300 rounded-sm ring-none"
                    />
                </div>

                <div>
                    <Label className="felx items-center font-semibold text-neutral-500 text-sm ">
                        Invite people to this project
                        <span className='text-red-300'>*</span>
                    </Label>
                    <EmailMultiSelectInput
                        onSuccess={handleSuccess}
                        placeholder="Add your team members..."
                    />
                </div>
            </div>
            <DialogFooter className="mt-0 border-t border-neutral-200">
                <div className='flex itmes-center p-6 gap-x-5'>
                    <div>
                        <Button variant="outline" onClick={() => setShowForm(!showForm)}>Cancel</Button>
                    </div>
                    <div>
                        <Button variant="teritary">Submit</Button>
                    </div>
                </div>
            </DialogFooter>
        </>

    );
};

export default UseTemplate;