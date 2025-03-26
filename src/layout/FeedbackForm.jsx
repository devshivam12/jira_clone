import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

const FeedbackForm = () => {
    const [selectedFeedback, setSelectedFeedback] = useState("")
    const [open, setOpen] = useState(false)
    return (
        <div>
            <Dialog
                open={open}
                onOpenChange={setOpen}
                className=" rounded-sm shadow-none border-none"
            >
                <DialogTrigger asChild className='w-full flex justify-start items-center'>
                    <Button variant="muted" className="flex items-center gap-2 text-neutral-700 font-normal text-md hover:bg-neutral-300 hover:rounded-sm cursor-pointer py-2 px-4"><Send size={15} />Give feedback</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-sm bg-neutral-200 shadow-none">
                    <DialogHeader className="space-y-2">
                        <DialogTitle>Share your feedback</DialogTitle>
                        <p className='text-neutral-800'>Required fields are marked with an asterisk*</p>
                        <DialogDescription className="text-neutral-500">
                            Real humans are reading these every day. It directs our roadmap and helps keep us connected to you. Tell us what you think. We're listening.
                        </DialogDescription>
                    </DialogHeader>
                    <form className={cn("grid items-start gap-4")}>
                        <div className="grid gap-2 space-y-2">
                            <div>
                                <Label className="text-neutral-700">
                                    Select feedback
                                </Label>
                                <Select onValueChange={setSelectedFeedback}>
                                    <SelectTrigger className="w-full border border-neutral-600 bg-neutral-300 ">
                                        <SelectValue placeholder="Choose one" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-200">
                                        <SelectItem
                                            className="cursor-pointer hover:bg-neutral-300"
                                            value="question"
                                        >
                                            Ask a question
                                        </SelectItem>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-neutral-300"
                                            value="comment"
                                        >
                                            Leave a comment

                                        </SelectItem>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-neutral-300"
                                            value="bug"
                                        >Report bug

                                        </SelectItem>
                                        <SelectItem
                                            className="cursor-pointer hover:bg-neutral-300"
                                            value="suggestion"
                                        >
                                            Suggest an improvement

                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                {selectedFeedback && (
                                    <div className="grid gap-2">
                                        <Label className="text-neutral-700">
                                            {selectedFeedback === "question"
                                                ? "Your Question*"
                                                : selectedFeedback === "comment"
                                                    ? "Your Comment*"
                                                    : selectedFeedback === "bug"
                                                        ? "Describe the Bug*"
                                                        : "Your Suggestion*"}
                                        </Label>
                                        <Textarea
                                            className="w-full border border-neutral-600  p-2 rounded-sm resize-none h-36 bg-neutral-300"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='flex items-center justify-end gap-2'>
                            <Button variant="default" className="text-xs">Cancle</Button>
                            <Button variant="teritary" className="text-xs">Save changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default FeedbackForm
