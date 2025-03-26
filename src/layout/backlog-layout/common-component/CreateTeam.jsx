import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CircleAlert } from 'lucide-react';
import TooltipWrapper from '@/components/common/TooltipWrapper';
import { Checkbox } from "@/components/ui/checkbox"


const CreateTeam = ({ openTeam, onClose }) => {
    return (
        <Dialog open={openTeam} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-neutral-600 mb-2">Create New Team</DialogTitle>
                    <DialogDescription className="text-sm font-normal">
                        Bring everyone together with one team you can @mention, filter, and assign work to.
                        What’s a team?
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-6'>
                    <div className="flex items-start gap-y-2 flex-col">
                        {/* <div className="grid grid-cols-4 items-center gap-4"> */}
                        <Label htmlFor="name" className="text-right text-neutral-500">
                            Team Name
                        </Label>
                        <Input
                            id="name"
                            className="col-span-3"
                            placeholder="e.g. HR Team, Redesign Team, Team Paython"
                        />
                        {/* </div> */}
                        <div className='flex items-center gap-2'>
                            <span className='text-right text-neutral-500 font-normal text-xs'>Who can see this</span>
                            <TooltipWrapper content={"Your team name is visible to anyone in your organisation. It may be visible on work shared outside your organisation."} className="w-40 shadow-md">
                                <CircleAlert size={15} className='text-neutral-500 cursor-pointer hover:text-neutral-700' />
                            </TooltipWrapper>
                        </div>
                    </div>
                    <div className="flex items-start gap-y-2 flex-col">
                        <Label htmlFor="name" className="text-right text-neutral-500">
                            Who should be in this team?
                        </Label>

                        <div className='w-full'>
                            <Input type="text" placeholder="Need to create" />
                        </div>

                        <span className='text-right text-neutral-500 font-normal text-xs'>You can invite up to 50 people at once.</span>
                    </div>

                    <div className='flex items-start flex-col gap-y-2'>
                        <Label className="text-right text-neutral-500">
                            Membership controls
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="terms" className="text-neutral-500 border border-neutral-500" />
                            <label
                                htmlFor="terms"
                                className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-500 "
                            >
                                Accept terms and conditions
                            </label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="default" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="teritary" type="submit" onClick={() => {
                        // Handle team creation here
                        onClose();
                    }}>
                        Create Team
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateTeam
