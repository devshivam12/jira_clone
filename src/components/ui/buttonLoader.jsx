import React from 'react'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

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
            className={className}
            variant={variant}
            size={size}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {children}
                </>
            ) : (
                children
            )}
        </Button>
    )
}

export default ButtonLoader
