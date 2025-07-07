import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectData } from '@/hooks/useProjectData'
import { useGetTeamDetailsQuery } from '@/redux/api/company/team'
import { Users } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TeamCard = () => {
    const navigate = useNavigate()
    const { currentProject } = useProjectData()
    const [getColor, setGetColor] = useState([])

    const [userData] = useState(() => {
        try {
            const storeData = localStorage.getItem("userData")
            return storeData ? JSON.parse(storeData) : null
        } catch (e) {
            console.error("Error parsing userData", e)
            return null
        }
    })
    // console.log("userData", userData)
    // const isAdmin = userData?.role === 'Admin' ? 'Admin' : undefined;
    // console.log('isAdmin', isAdmin)
    // console.log("userData?.member_id", userData?.member_id)

    const { data, isLoading } = useGetTeamDetailsQuery();
    console.log("data", data)

    const defaultColors = useMemo(() => {
        if (currentProject?.template?.fields?.work_type) {
            return currentProject?.template?.fields?.work_type.map(workType => workType.color)
        }
    }, [currentProject])

    console.log("defaultColor", defaultColors)

    const getTeamColor = (index) => {
        return defaultColors[index % defaultColors.length] || 'bg-blue-300'
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.data?.map((team, teamIndex) => {
                // Filter out empty member objects and get the count
                // const validMembers = team.members.filter(member => member?._id)
                const memberCount = team.members.length
                const membersToShow = team.members.slice(0, 4)
                const remainingCount = memberCount > 4 ? memberCount - 4 : 0


                return (
                    <Card key={team._id} onClick={() => navigate(`edit/${team._id}`)} className="rounded-md cursor-pointer px-2 py-2 bg-transparent ease-in-out duration-200 hover:bg-neutral-100/80 shadow-none border transition-all border-neutral-200 hover:border-neutral-300">
                        <CardHeader className="px-2 py-2">
                            <CardTitle className="flex items-center justify-between gap-2 ">
                                <div className={`flex items-center justify-center p-[10px] rounded-md h-9 w-9 ${getTeamColor(teamIndex)}`}>
                                    <Users className="h-10 w-10 text-white" />
                                </div>
                                <div className='flex items-center'>
                                    {membersToShow.map((member) => (
                                        <Avatar key={member._id} className="h-9 p-1 w-9 bg-neutral-200 text-neutral-600 text-xs font-medium -ml-1">
                                            <AvatarImage src={member?.image} /> {/* Add avatar URL if available */}
                                            <AvatarFallback className="text-sm font-normal bg-transparent">
                                                {member?.first_name?.charAt(0)}{member?.last_name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {remainingCount > 0 && (
                                        <Avatar className="border-2 border-white">
                                            <AvatarFallback className="bg-gray-200 text-gray-700">
                                                +{remainingCount}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 py-2"
                        >

                            <span className='text-sm font-semibold text-gray-600'>{team.team_name}</span>

                            <div className="mt-1 text-sm font-normal text-gray-500">
                                Created by: {team.createdBy?.full_name}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

export default TeamCard
