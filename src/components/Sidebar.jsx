import React from 'react'
import { Link } from 'react-router-dom'
import { DottedSeparator } from './dotted-separator'
import Navigation from './Navigation'
import Logo from '../assets/logo.svg'
import WorkspaceSwitcher from './WorkspaceSwitcher'

const Sidebar = () => {
    return (
        <aside className='h-full bg-neutral-100 p-4 w-full'>
            <Link href="/">
                <img src={Logo} alt="" className='w-[164px] h-[48px]' />
            </Link>
            <DottedSeparator className="my-4" />

            <WorkspaceSwitcher />

            <DottedSeparator className="my-4" />

            <Navigation />
        </aside>
    )
}

export default Sidebar
