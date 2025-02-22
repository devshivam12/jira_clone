import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Link } from 'lucide-react'
import React from 'react'

const Share = () => {
    return (
        <Card className='flex flex-col rounded-sm bg-neutral-100 shadow-neutral-200'>
            <CardHeader>
                <CardTitle>Share</CardTitle>
                <p className='font-normal text-neutral-500 text-sm'>Required fields are marked with an asterisk*</p>
            </CardHeader>
            <CardContent>
                <form action="" className='space-y-4'>
                    <div className='space-y-2'>
                        <Label>
                            Name or teams
                        </Label>
                        <Input
                            type="text"
                            placeholder="e.g. Howrang, Team Yosai"
                            className="border-neutral-300"
                            required
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label>
                            Message (optional)
                        </Label>
                        <Textarea
                            type="text"
                            placeholder="Enything you should known?"
                            className="border-neutral-300"
                        />
                    </div>
                    <div className='flex items-center justify-between'>
                        <div className="flex items-center gap-2 hover:underline cursor-pointer">
                            <Link className='text-neutral-600 rounded-full w-8 h-8 flex items-centerr justify-center py-1 px-2 bg-neutral-200 ' />
                            <span className='text-neutral-600'>copy link</span>
                        </div>
                        <Button variant="teritary">Share</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default Share
