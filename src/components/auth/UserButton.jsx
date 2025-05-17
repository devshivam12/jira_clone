import React, { useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu'
import { eachMonthOfInterval } from 'date-fns'
import { DottedSeparator } from '../dotted-separator'
import { Loader, LogOut, SquareArrowOutUpRight } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { server } from '@/constant/config'
import { Link, useNavigate, useRoutes } from 'react-router-dom'
import { userNotExist } from '@/redux/reducers/auth'
import { useToast } from '@/hooks/use-toast'
import ApiService from '@/api/apiService'
import { useLogoutMutation } from '@/redux/api/authApi'

const apiSerivce = new ApiService()


const UserButton = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [userData, setUserData] = useState(() => {
        const storeData = localStorage.getItem("userData");
        return storeData ? JSON.parse(storeData) : null
    })
    console.log("userData", userData)
    const [logout, { isLoading }] = useLogoutMutation()

    const { toast } = useToast()

    const fullName = userData?.first_name.charAt(0).toUpperCase() + userData?.first_name.slice(1) + " " + userData?.last_name.charAt(0).toUpperCase() + userData?.last_name.slice(1)
    console.log("fullName", fullName)

    const name = userData?.first_name.charAt(0).toUpperCase() + userData?.last_name.charAt(0).toUpperCase()
    console.log("name", name)
    const avatarFallback = userData?.first_name.charAt(0).toUpperCase() ?? userData?.email.charAt(0).toUpperCase() ?? "U";

    const handleLogout = async () => {
        try {
            const response = await logout().unwrap()
            window.location.href = '/login'
            localStorage.clear()
            dispatch(userNotExist())
            toast({
                title: "Logout success",
                description: response.message,
                variant: "success",
            })
        } catch (error) {
            console.log("error", error)
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "success",
            })
        }
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className='outline-none relative'>
                <Avatar className="size-10 hover:opacity-75 transition border border-neutral-300 ">
                    <AvatarFallback className="bg-neutral-200 font-medium text-neutral-500 flex items-center ">
                        {name}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-70" sideOffset={10}>
                <div className='flex items-center gap-2 px-3 py-4'>
                    <Avatar className="size-[48px] border border-neutral-200 ">
                        <AvatarFallback className="bg-neutral-200 text-xl font-medium text-neutral-500 flex items-center ">
                            {name}
                        </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col '>
                        <p className="text-sm font-medium text-neutral-900">
                            {fullName || "User"}
                        </p>
                        <p className='text-xs text-neutral-500'>
                            {userData?.email}
                        </p>
                    </div>
                </div>
                <DropdownMenuItem className='h-10 flex items-center justify-between gap-2 px-3 cursor-pointer mb-2'>
                    <Link to={'/manage-account'} className='text-neutral-700'>
                        Manage Account
                    </Link>
                    <SquareArrowOutUpRight className='size-4 mr-2' />
                </DropdownMenuItem>

                <DottedSeparator className="mb-1" />

                <div className='h-10 flex items-center justify-between gap-2 px-3  '>
                    <p className='text-neutral-700 text-sm'>
                        Jira
                    </p>
                </div>

                <DropdownMenuItem className='h-10 flex items-center justify-between gap-2 px-3 cursor-pointer '>
                    <p className='text-neutral-700'>
                        Open Quick
                    </p>
                </DropdownMenuItem>

                <DropdownMenuItem className='h-10 flex items-center justify-between gap-2 px-3 cursor-pointer '>
                    <p className='text-neutral-700'>
                        Profile
                    </p>
                </DropdownMenuItem>

                <DropdownMenuItem className='h-10 flex items-center justify-between gap-2 px-3 cursor-pointer '>
                    <p className='text-neutral-700'>
                        Personal Settings
                    </p>
                </DropdownMenuItem>

                <DropdownMenuItem className='h-10 flex items-center justify-between gap-2 px-3 cursor-pointer'>
                    <p className='text-neutral-700'>
                        Notifications
                    </p>
                </DropdownMenuItem>
                <DottedSeparator className="mb-1 mt-1" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer" >
                    <LogOut className='size-4 mr-2' />
                    Log Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserButton
