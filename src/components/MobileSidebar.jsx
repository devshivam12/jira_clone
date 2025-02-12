import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MenuIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const MobileSidebar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        setIsOpen(false)
    }, [location.pathname])
    return (
        <Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="secondary" className="lg:hidden ">
                    <MenuIcon className='size-4 text-neutral-500' />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}

export default MobileSidebar
