
import React from 'react'
import { Globe, Frame, ChartNoAxesGantt, SquareKanban, SquareLibrary } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { RiTeamFill } from 'react-icons/ri'
const routes = [
    {
        label: "Summary",
        href: "/dashboard/summary",
        icon: Globe
    },
    {
        label: "Timeline",
        href: "/dashboard/timeline",
        icon: ChartNoAxesGantt
    },
    {
        label: "Backlog",
        href: "/dashboard/backlog",
        icon: Frame
    },
    {
        label: "Board",
        href: "/dashboard/board",
        icon: SquareKanban
    },
    {
        label: "Forms",
        href: "/dashboard/forms",
        icon: SquareLibrary
    },
    {
        label : "Team",
        href: "/dashboard/people",
        icon: RiTeamFill
    }
]

const Navigation = () => {
    const location = useLocation()

    return (
        <ul className='flex flex-col'>
            {routes.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                return (
                    <Link key={item.href} to={item.href}>
                        <div className={cn(
                            "flex items-center gap-2.5 rounded-md p-2.5 font-medium py-3 transition text-neutral-500 hover:bg-neutral-200 hover:text-primary",
                            isActive && "bg-neutral-200 shadow-sm hover:opacity-100 text-primary"
                        )}>
                           <Icon className={cn("size-5 transition", isActive ? "text-primary" : "text-neutral-500 group-hover:text-neutral-700")} />
                            {item.label}
                        </div>
                    </Link>
                )
            })}
        </ul>
    )
}

export default Navigation
