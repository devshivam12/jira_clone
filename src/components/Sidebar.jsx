import React from 'react'
import { Link } from 'react-router-dom'
import { DottedSeparator } from './dotted-separator'
import AppSidebar from './AppSidebar'
import Logo from '../assets/logo.svg'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { SidebarProvider } from './ui/sidebar'

const Sidebar = () => {
    return (
        <aside className='h-full bg-neutral-100 p-4 w-full'>
            <Link href="/">
                <img src={Logo} alt="" className='w-[164px] h-[48px]' />
            </Link>
            <DottedSeparator className="my-4" />

            {/* <WorkspaceSwitcher /> */}

            <DottedSeparator className="my-4" />
            <SidebarProvider>
                <AppSidebar />
            </SidebarProvider>
        </aside>
    )
}

export default Sidebar
