import React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials, getAvatarColor, formatLastSeen } from "../utils"
import type { User } from "../types"

interface UserItemProps {
    user: User
    currentUsername: string
    keyPrefix?: string
}

export const UserItem: React.FC<UserItemProps> = ({
    user,
    currentUsername,
    
}) => {
    return (
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="relative">
                <Avatar className={`h-8 w-8 ${!user.isOnline ? 'opacity-60' : ''}`}>
                    <AvatarFallback className={`${getAvatarColor(user.username)} text-white text-xs`}>
                        {getInitials(user.username)}
                    </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${user.isOnline ? 'text-gray-900' : 'text-gray-500'}`}>
                    {user.username}
                    {user.username === currentUsername && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                            You
                        </Badge>
                    )}
                </p>
                <p className={`text-xs ${user.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    {user.isOnline 
                        ? "Online" 
                        : user.lastSeen 
                            ? `Last seen ${formatLastSeen(user.lastSeen)}` 
                            : "Offline"
                    }
                </p>
            </div>
        </div>
    )
}
