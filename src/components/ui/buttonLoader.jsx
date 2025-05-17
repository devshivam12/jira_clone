import React from 'react'
import { Button } from './button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ButtonLoader = ({
    isLoading = false,
    children,
    className = "",
    variant = "default",
    size = "default",
    ...props
}) => {
    return (


        <Button
            className={cn(
                "flex items-center justify-center", // Base styles
                className // Custom classes (will override conflicts)
            )}
            variant={variant}
            size={size}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className={cn(
                        "mr-2 animate-spin h-4 w-4 "
                    )} />
                    {children}
                </>
            ) : (
                children
            )}
        </Button>
    )
}

export default ButtonLoader
