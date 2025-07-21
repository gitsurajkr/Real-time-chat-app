import React from "react"
import { Button } from "@/components/ui/button"
import { CardHeader } from "@/components/ui/card"
import { ArrowLeft, Users, Copy, Check, Wifi, WifiOff } from "lucide-react"
import type { ChatHeaderProps } from "../types"

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    roomId,
    isConnected,
    users,
    error,
    copied,
    onCopyRoomId,
    onBackClick,
    onShowUsersList
}) => {
    return (
        <CardHeader className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm p-2 md:p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBackClick}
                        className="p-1 md:p-2 lg:hidden"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="">
                        <div className="flex items-center space-x-2">
                            <h1 className="text-sm md:text-lg font-semibold text-gray-900">Room {roomId}</h1>
                            {isConnected ? (
                                <Wifi className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                            ) : (
                                <WifiOff className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {isConnected
                                ? `${users.filter(u => u.isOnline).length} members online`
                                : 'Connecting to server...'
                            }
                            {error && <span className="text-red-500 ml-2">• {error}</span>}
                            {!isConnected && !error && (
                                <span className="text-orange-500 ml-2">• Backend is Down</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="lg:hidden flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShowUsersList}
                        className="bg-transparent p-1 h-7 w-7 md:h-8 md:w-8"
                    >
                        <Users className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCopyRoomId}
                        className="bg-transparent p-1 h-7 w-7 md:h-8 md:w-8"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </div>
            </div>
        </CardHeader>
    )
}
