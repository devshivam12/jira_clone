import React from 'react'
import UserButton from './auth/UserButton'
import MobileSidebar from './MobileSidebar'


const Navbar = () => {
    return (
        <nav className='pt-4 px-6 flex items-center justify-between'>
            <div className=" flex-col hidden lg:flex">
                <h1 className='text-2xl font-semibold'>
                    Home
                </h1>
                <p className='text-muted-foreground'>
                    Monitor all of your project and task
                </p>
            </div>
            <MobileSidebar />
            <UserButton />
        </nav>
    )
}

export default Navbar
