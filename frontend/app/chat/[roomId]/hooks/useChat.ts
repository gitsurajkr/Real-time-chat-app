"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useWebsocket, type RecieveMessage } from "@/lib/useWebSocket"
import { v4 as uuidv4 } from 'uuid'
import type { Message, User } from "../types"

interface UseChatProps {
    roomId: string
    username: string
}

export const useChat = ({ roomId, username }: UseChatProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [users, setUsers] = useState<User[]>([{ username, joinedAt: new Date(), isOnline: true }])
    const [copied, setCopied] = useState(false)
    const [showUsersList, setShowUsersList] = useState(false)
    const [typingUsers, setTypingUsers] = useState<string[]>([])

    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // WebSocket connection
    // 
    const { isConnected, error, subscribeToRoom, unsubscribeToRoom, sendChatMessage, joinRoom, leaveRoom, sendHeartbeat, sendTyping, sendStopTyping } = useWebsocket({
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
            
            // Handle typing events
            if (data.type === 'USER_TYPING' && data.username && data.username !== username && data.roomId === roomId) {
                setTypingUsers(prev => {
                    if (!prev.includes(data.username!)) {
                        return [...prev, data.username!]
                    }
                    return prev
                })
            }
            
            if (data.type === 'USER_STOP_TYPING' && data.username && data.roomId === roomId) {
                setTypingUsers(prev => prev.filter(user => user !== data.username))
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

    // Typing handlers with WebSocket integration
    const handleTyping = useCallback(() => {
        if (isConnected && roomId && username) {
            sendTyping(roomId, username)
        }
    }, [isConnected, roomId, username, sendTyping])

    const handleStopTyping = useCallback(() => {
        if (isConnected && roomId && username) {
            sendStopTyping(roomId, username)
        }
    }, [isConnected, roomId, username, sendStopTyping])

    return {
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
        handleSubmit,
        copyRoomId,
        typingUsers,
        handleTyping,
        handleStopTyping
    }
}
