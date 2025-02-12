import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, MoveLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Security = () => {
    const navigate = useNavigate()
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const isButtonDisabled = !currentPassword || !newPassword

    return (
        <div className="flex justify-center my-10">
            <div
                onClick={() => navigate(-1)}
                className='w-12 h-12 flex items-center justify-center p-2 rounded-full bg-neutral-200 cursor-pointer transition-all hover:bg-neutral-300'>
                <MoveLeft size={15} color="#404040   " />
            </div>
            <div className="w-full max-w-[600px] px-6">
                <Card className="w-full">
                    <CardHeader className="gap-y-2">
                        <CardTitle>Security</CardTitle>
                        <p>Change your password</p>
                        <CardDescription className="text-xs">
                            When you change your password, we keep you logged in to this device but may log you out from your other devices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action="" className="space-y-4">
                            <div className="w-full">
                                <Label className="text-xs text-neutral-500">Current password</Label>
                                <div className='flex items-center justify-between'>
                                    <Input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-100 text-sm w-full"
                                    />
                                    <span
                                        className="-ml-32 mr-5 cursor-pointer"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={20} />}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full">
                                <Label className="text-xs text-neutral-500">New password</Label>
                                <div className='flex items-center justify-between'>
                                    <Input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-100 text-sm w-full"
                                    />
                                    <span
                                        className="-ml-32 mr-5 cursor-pointer"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={20} />}
                                    </span>
                                </div>
                            </div>
                            <Button variant="primary" disabled={isButtonDisabled}>
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Security;