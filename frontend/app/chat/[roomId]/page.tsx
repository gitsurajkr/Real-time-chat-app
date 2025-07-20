"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Users, Copy, Check, Wifi, WifiOff } from "lucide-react"
import { useWebsocket, type RecieveMessage } from "@/lib/useWebSocket"
import { v4 as uuidv4 } from 'uuid'

interface Message {
    id: string
    content: string
    username: string
    timestamp: Date
    isOwn: boolean
    
}

interface User {
    username: string
    joinedAt: Date
    isOnline: boolean
    lastSeen?: Date
}

export default function ChatRoom() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Get roomId from URL params
    const roomId = params.roomId as string || uuidv4()
    const username = searchParams.get("username") || "Anonymous"


    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [users, setUsers] = useState<User[]>([{ username, joinedAt: new Date(), isOnline: true }])
    const [copied, setCopied] = useState(false)
    const [showUsersList, setShowUsersList] = useState(false)

    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])
    // WebSocket connection
    const { isConnected, error, subscribeToRoom, unsubscribeToRoom, sendChatMessage, joinRoom, leaveRoom, sendHeartbeat } = useWebsocket({
        // check here 
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
        onMessage: (data: RecieveMessage) => {
            if (data.type === 'RECEIVER_MESSAGE' && data.roomId === roomId) {
                const newMessage: Message = {
                    id: data.message!.id,
                    content: data.message!.content,
                    username: data.message!.username,
                    timestamp: new Date(data.message!.timestamp),
                    isOwn: data.message!.username === username
                }

                // Add message only if it doesn't already exist (avoid duplicates)
                setMessages((prev) => {
                    const messageExists = prev.find(msg => msg.id === newMessage.id)
                    if (!messageExists) {
                        return [...prev, newMessage]
                    }
                    return prev
                })

                // Add user to online users if not already present
                setUsers((prev) => {
                    const userExists = prev.find(u => u.username === data.message!.username)
                    if (!userExists && data.message!.username !== username) {
                        return [...prev, {
                            username: data.message!.username,
                            joinedAt: new Date(),
                            isOnline: true
                        }]
                    } else if (userExists && data.message!.username !== username) {
                        // Mark user as online if they were offline
                        return prev.map(user => 
                            user.username === data.message!.username 
                                ? { ...user, isOnline: true }
                                : user
                        )
                    }
                    return prev
                })
            }
            
            // Handle user join/leave events
            if (data.type === 'USER_JOINED' && data.username && data.username !== username) {
                setUsers((prev) => {
                    const userExists = prev.find(u => u.username === data.username)
                    if (!userExists) {
                        return [...prev, {
                            username: data.username!,
                            joinedAt: new Date(),
                            isOnline: true
                        }]
                    } else {
                        return prev.map(user => 
                            user.username === data.username 
                                ? { ...user, isOnline: true }
                                : user
                        )
                    }
                })
            }
            
            if (data.type === 'USER_LEFT' && data.username && data.username !== username) {
                setUsers((prev) => prev.map(user => 
                    user.username === data.username 
                        ? { ...user, isOnline: false, lastSeen: new Date() }
                        : user
                ))
            }
            
            // Handle heartbeat-based online status updates
            if (data.type === 'USER_ONLINE' && data.username && data.username !== username) {
                setUsers((prev) => {
                    const userExists = prev.find(u => u.username === data.username)
                    if (!userExists) {
                        return [...prev, {
                            username: data.username!,
                            joinedAt: new Date(),
                            isOnline: true
                        }]
                    } else {
                        return prev.map(user => 
                            user.username === data.username 
                                ? { ...user, isOnline: true }
                                : user
                        )
                    }
                })
            }
            
            if (data.type === 'USER_OFFLINE' && data.username && data.username !== username) {
                setUsers((prev) => prev.map(user => 
                    user.username === data.username 
                        ? { ...user, isOnline: false, lastSeen: new Date() }
                        : user
                ))
            }
        },
        onConnect: () => {
            console.log('Connected to chat server')
            // Join the room when connected
            if (roomId && username) {
                joinRoom(roomId, username)
            }
        },
        onDisconnect: () => {
            console.log('Disconnected from chat server')
            // Mark current user as offline in UI
            setUsers((prev) => prev.map(user => 
                user.username === username 
                    ? { ...user, isOnline: false, lastSeen: new Date() }
                    : user
            ))
        }
    })

    useEffect(() => {
        if (isConnected && roomId) {
            // Subscribe to room and join as user
            subscribeToRoom(roomId)
            joinRoom(roomId, username)
        }

        return () => {
            if (roomId) {
                // Leave room and unsubscribe when component unmounts
                leaveRoom(roomId, username)
                unsubscribeToRoom(roomId)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, roomId])

    // Heartbeat system to keep user online
    useEffect(() => {
        if (!isConnected || !roomId || !username) return

        const heartbeatInterval = setInterval(() => {
            sendHeartbeat(roomId, username)
        }, 15000) // Send heartbeat every 15 seconds

        return () => clearInterval(heartbeatInterval)
    }, [isConnected, roomId, username, sendHeartbeat])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !isConnected) return

        const messageId = uuidv4()
        const messageData = {
            id: messageId,
            content: input.trim(),
            username,
            timestamp: new Date().toISOString(),
            userId: uuidv4()
        }

        // Send message via WebSocket to your backend
        const success = sendChatMessage(roomId, messageData)

        if (success) {
            // Add message to local state immediately for better UX (own message)
            const newMessage: Message = {
                id: messageData.id,
                content: messageData.content,
                username: messageData.username,
                timestamp: new Date(messageData.timestamp),
                isOwn: true,
            }
            setMessages((prev) => {
                // Check if message already exists before adding
                const messageExists = prev.find(msg => msg.id === newMessage.id)
                if (!messageExists) {
                    return [...prev, newMessage]
                }
                return prev
            })
            setInput("")
        } else {
            console.error('Failed to send message - WebSocket not connected')
        }
    }

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    }

    const formatLastSeen = (date: Date) => {
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return "Just now"
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`

        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getAvatarColor = (name: string) => {
        const colors = [
            "bg-red-500",
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-teal-500",
        ]
        const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[index % colors.length]
    }

    return (
        <div className="flex h-[100dvh] max-h-[100dvh] bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className="hidden lg:flex lg:w-80 bg-white border-r border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="p-2">
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
                            <Button variant="outline" size="sm" onClick={copyRoomId} className="ml-2 bg-transparent">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Users className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">
                            Members ({users.filter(u => u.isOnline).length}/{users.length})
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {/* Online Users */}
                        {users.filter(u => u.isOnline).length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    Online ({users.filter(u => u.isOnline).length})
                                </p>
                                <div className="space-y-1">
                                    {users.filter(u => u.isOnline).map((user, index) => (
                                        <div key={`online-${index}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={`${getAvatarColor(user.username)} text-white text-xs`}>
                                                        {getInitials(user.username)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user.username}
                                                    {user.username === username && (
                                                        <Badge variant="secondary" className="ml-2 text-xs">
                                                            You
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-xs text-green-600">Online</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Offline Users */}
                        {users.filter(u => !u.isOnline).length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    Offline ({users.filter(u => !u.isOnline).length})
                                </p>
                                <div className="space-y-1">
                                    {users.filter(u => !u.isOnline).map((user, index) => (
                                        <div key={`offline-${index}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8 opacity-60">
                                                    <AvatarFallback className={`${getAvatarColor(user.username)} text-white text-xs`}>
                                                        {getInitials(user.username)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-500 truncate">
                                                    {user.username}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : "Offline"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showUsersList && (
                <div className="lg:hidden fixed inset-0 bg-opacity-50 z-50" onClick={() => setShowUsersList(false)}>
                    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Room Members</h2>
                                <Button variant="ghost" size="sm" onClick={() => setShowUsersList(false)} className="p-2">
                                    ×
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="flex items-center space-x-2 mb-4">
                                <Users className="h-5 w-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-900">
                                    Members ({users.filter(u => u.isOnline).length}/{users.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {/* Online Users */}
                                {users.filter(u => u.isOnline).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                            Online ({users.filter(u => u.isOnline).length})
                                        </p>
                                        <div className="space-y-1">
                                            {users.filter(u => u.isOnline).map((user, index) => (
                                                <div key={`mobile-online-${index}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className={`${getAvatarColor(user.username)} text-white text-xs`}>
                                                                {getInitials(user.username)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user.username}
                                                            {user.username === username && (
                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-green-600">Online</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline Users */}
                                {users.filter(u => !u.isOnline).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                            Offline ({users.filter(u => !u.isOnline).length})
                                        </p>
                                        <div className="space-y-1">
                                            {users.filter(u => !u.isOnline).map((user, index) => (
                                                <div key={`mobile-offline-${index}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8 opacity-60">
                                                            <AvatarFallback className={`${getAvatarColor(user.username)} text-white text-xs`}>
                                                                {getInitials(user.username)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-500 truncate">
                                                            {user.username}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : "Offline"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] max-h-[100dvh]">
                <Card className="flex-1 m-1 md:m-4 shadow-sm flex flex-col h-full max-h-full overflow-hidden gap-0 rounded-none md:rounded-lg">
                    {/* Sticky Header */}
                    <CardHeader className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm p-2 md:p-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/")}
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
                                    onClick={() => setShowUsersList(true)}
                                    className="bg-transparent p-1 h-7 w-7 md:h-8 md:w-8"
                                >
                                    <Users className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyRoomId}
                                    className="bg-transparent p-1 h-7 w-7 md:h-8 md:w-8"
                                >
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 p-2 md:p-4 overflow-y-auto" ref={scrollAreaRef}>
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
                                {/* Invisible element to scroll to */}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Sticky Message Input */}
                        <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm p-2 md:p-4 flex-shrink-0 safe-area-inset-bottom">
                            <form onSubmit={handleSubmit} className="flex space-x-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 rounded-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm h-9 md:h-10"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || !isConnected}
                                    className="rounded-full h-9 w-9 md:h-10 md:w-10 p-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 flex-shrink-0"
                                >
                                    <Send className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

