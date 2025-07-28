"use client"

import type { Message } from "./types"


import React from "react"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { v4 as uuidv4 } from 'uuid'
import { useChat } from "./hooks/useChat"
import {
    MessageInput,
    MessageList,
    UsersSidebar,
    MobileUsersList,
    ChatHeader
} from "./components"

export default function ChatRoom() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Get roomId from URL params
    const roomId = params.roomId as string || uuidv4()
    const username = searchParams.get("username") || "Anonymous"

    // Use the custom hook for all chat functionality
    const {
        messages,
        input,
        setInput,
        users,
        copied,
        showUsersList,
        setShowUsersList,
        scrollAreaRef,
        messagesEndRef,
        isConnected,
        error,
        handleSubmit: baseHandleSubmit,
        copyRoomId,
        typingUsers,
        handleTyping,
        handleStopTyping,
        handleSendImage
    } = useChat({ roomId, username })

    // Reply state
    const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)

    const handleBackClick = () => {
        router.push("/")
    }

    const handleShowUsersList = () => {
        setShowUsersList(true)
    }

    const handleCloseUsersList = () => {
        setShowUsersList(false)
    }

    // Custom handleSubmit to include reply info
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !isConnected) return

        // Compose replyTo info if replying
        let replyTo: { id: string; username: string; content: string } | undefined = undefined;
        if (replyingTo) {
            replyTo = {
                id: replyingTo.id,
                username: replyingTo.username,
                content: replyingTo.content
            }
        }

        // Call base handleSubmit with replyTo
        baseHandleSubmit(e, replyTo)
        setReplyingTo(null)
    }

    return (
        <div className="flex h-[100dvh] max-h-[100dvh] bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <UsersSidebar
                users={users}
                currentUsername={username}
                roomId={roomId}
                copied={copied}
                onCopyRoomId={copyRoomId}
                onBackClick={handleBackClick}
            />

            {/* Mobile Users List */}
            <MobileUsersList
                users={users}
                currentUsername={username}
                showUsersList={showUsersList}
                onClose={handleCloseUsersList}
            />

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] max-h-[100dvh]">
                <Card className="flex-1 m-1 md:m-4 shadow-sm flex flex-col h-full max-h-full overflow-hidden gap-0 rounded-none md:rounded-lg">
                    {/* Chat Header */}
                    <ChatHeader
                        roomId={roomId}
                        isConnected={isConnected}
                        users={users}
                        error={error}
                        copied={copied}
                        onCopyRoomId={copyRoomId}
                        onBackClick={handleBackClick}
                        onShowUsersList={handleShowUsersList}
                    />

                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        {/* Message List */}
                        <MessageList
                            messages={messages}
                            messagesEndRef={messagesEndRef}
                            typingUsers={typingUsers}
                            currentUsername={username}
                            onReply={(msg) => setReplyingTo(msg)}
                            replyingTo={replyingTo}
                        />

                        {/* Message Input */}
                        <MessageInput
                            input={input}
                            setInput={setInput}
                            onSubmit={handleSubmit}
                            isConnected={isConnected}
                            onTyping={handleTyping}
                            onStopTyping={handleStopTyping}
                            onSendImage={handleSendImage}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

