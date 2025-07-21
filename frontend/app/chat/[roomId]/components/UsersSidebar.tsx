import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Copy, Check } from "lucide-react"
import { UserItem } from "./UserItem"
import type { UsersSidebarProps } from "../types"

export const UsersSidebar: React.FC<UsersSidebarProps> = ({
    users,
    currentUsername,
    roomId,
    copied,
    onCopyRoomId,
    onBackClick
}) => {
    const onlineUsers = users.filter(u => u.isOnline)
    const offlineUsers = users.filter(u => !u.isOnline)

    return (
        <div className="hidden lg:flex lg:w-80 bg-white border-r border-gray-200 flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={onBackClick} className="p-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-semibold text-gray-900">Room Details</h2>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Room ID</p>
                            <p className="font-mono font-semibold text-lg">{roomId}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={onCopyRoomId} className="ml-2 bg-transparent">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                        Members ({onlineUsers.length}/{users.length})
                    </h3>
                </div>

                <div className="space-y-3">
                    {/* Online Users */}
                    {onlineUsers.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Online ({onlineUsers.length})
                            </p>
                            <div className="space-y-1">
                                {onlineUsers.map((user, index) => (
                                    <UserItem
                                        key={`online-${index}`}
                                        user={user}
                                        currentUsername={currentUsername}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Offline Users */}
                    {offlineUsers.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Offline ({offlineUsers.length})
                            </p>
                            <div className="space-y-1">
                                {offlineUsers.map((user, index) => (
                                    <UserItem
                                        key={`offline-${index}`}
                                        user={user}
                                        currentUsername={currentUsername}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
