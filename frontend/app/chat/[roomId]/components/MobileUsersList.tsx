import React from "react"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { UserItem } from "./UserItem"
import type { MobileUsersListProps } from "../types"

export const MobileUsersList: React.FC<MobileUsersListProps> = ({
    users,
    currentUsername,
    showUsersList,
    onClose
}) => {
    if (!showUsersList) return null

    const onlineUsers = users.filter(u => u.isOnline)
    const offlineUsers = users.filter(u => !u.isOnline)

    return (
        <div className="lg:hidden fixed inset-0 bg-opacity-50 z-50" onClick={onClose}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Room Members</h2>
                        <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                            ×
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
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
                                            key={`mobile-online-${index}`}
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
                                            key={`mobile-offline-${index}`}
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
        </div>
    )
}
