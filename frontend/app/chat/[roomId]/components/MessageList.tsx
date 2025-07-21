import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTime, getInitials, getAvatarColor } from "../utils"
import { TypingIndicator } from "./TypingIndicator"
import type { MessageListProps } from "../types"

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    messagesEndRef,
    typingUsers = [],
    currentUsername
}) => {
    return (
        <ScrollArea className="flex-1 p-2 md:p-4 overflow-y-auto">
            <div className="space-y-2 md:space-y-4 pb-4">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm md:text-base">No messages yet. Start the conversation!</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex items-start space-x-2 md:space-x-3 ${message.isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                        <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                            <AvatarFallback className={`${getAvatarColor(message.username)} text-white text-xs`}>
                                {getInitials(message.username)}
                            </AvatarFallback>
                        </Avatar>

                        <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${message.isOwn ? "items-end" : "items-start"}`}>
                            <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                                <span className="text-xs font-medium text-gray-600">{message.username}</span>
                                <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                            </div>
                            <div
                                className={`rounded-2xl px-3 py-2 md:px-4 ${message.isOwn
                                        ? "bg-blue-500 text-white rounded-br-md"
                                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator */}
                <TypingIndicator 
                    typingUsers={typingUsers} 
                    currentUsername={currentUsername}
                />
                
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    )
}
