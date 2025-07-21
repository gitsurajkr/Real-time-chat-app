

import { useCallback, useEffect, useRef, useState } from "react"

export interface wsMessage {
    type: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'sendMessage' | 'USER_JOIN' | 'USER_LEAVE' | 'HEARTBEAT' | 'USER_TYPING' | 'USER_STOP_TYPING'
    room?: string,
    roomId?: string
    username?: string
    message?: {
        id: string
        content: string
        username: string
        timestamp: string
        userId: string
    }
}

export interface RecieveMessage {
    type: "RECEIVER_MESSAGE" | "USER_JOINED" | "USER_LEFT" | "USER_ONLINE" | "USER_OFFLINE" | "USER_TYPING" | "USER_STOP_TYPING",
    roomId: string,
    username?: string,
    message?: {
        id: string,
        content: string,
        username: string,
        timestamp: string,
        userId: string
    }
}

export interface useWebsocketProps {
    url: string,
    onMessage?: (data: RecieveMessage) => void
    onConnect?: () => void
    onDisconnect?: () => void
}



export const useWebsocket = ({ url, onMessage, onConnect, onDisconnect }: useWebsocketProps) => {
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const wsref = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const reConnectAttempt = useRef(0)
    const maxReconnectAttempt = 5;
    const isConnectingRef = useRef(false) 
    const onMessageRef = useRef(onMessage)
    const onConnectRef = useRef(onConnect)
    const onDisconnectRef = useRef(onDisconnect)

    useEffect(() => {
        onMessageRef.current = onMessage
        onConnectRef.current = onConnect
        onDisconnectRef.current = onDisconnect
    }, [onMessage, onConnect, onDisconnect])

    const connect = useCallback(() => {
        try {
            if (wsref.current?.readyState === WebSocket.OPEN ||
                wsref.current?.readyState === WebSocket.CONNECTING ||
                isConnectingRef.current) {
                console.log("WebSocket already connected or connecting")
                return;
            }

            console.log("Connecting to WebSocket:", url)
            isConnectingRef.current = true

            // debug
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                console.log("Connecting to localhost. Check if backend server is running on which port ")
            }

            wsref.current = new WebSocket(url)

            wsref.current.onopen = () => {
                console.log("WebSocket connected")
                setIsConnected(true);
                setError(null)
                reConnectAttempt.current = 0
                isConnectingRef.current = false
                onConnectRef.current?.()
            }

            wsref.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as RecieveMessage
                    console.log("Received message: ", data)
                    onMessageRef.current?.(data)
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err)
                }
            }

            wsref.current.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason)
                setIsConnected(false)
                isConnectingRef.current = false
                onDisconnectRef.current?.()

                // attempt to reconnect

                if (event.code !== 1000 && reConnectAttempt.current < maxReconnectAttempt) {
                    const delay = Math.min(1000 * Math.pow(2, reConnectAttempt.current), 3000)
                    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reConnectAttempt.current + 1}/${maxReconnectAttempt})`)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reConnectAttempt.current++
                        connect()
                    }, delay)

                } else if (reConnectAttempt.current >= maxReconnectAttempt) {
                    setError('Failed to reconnect after multiple attempts')
                }
            }

            wsref.current.onerror = (err) => {
                console.error('WebSocket error occurred. This usually means connection failed or was rejected.', err)
                setError('Connection failed. Please check if the server is running.')
                isConnectingRef.current = false
            }

        } catch (err) {
            console.error('Error creating WebSocket connection:', err)
            setError('Failed to create WebSocket connection')
            isConnectingRef.current = false
        }
    }, [url]) 


    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        reConnectAttempt.current = 0

        if (wsref.current) {
            wsref.current.close(1000, 'Disconnected by user')
            wsref.current = null
        }
        
        isConnectingRef.current = false
        setIsConnected(false)
        setError(null)
    }, [])

    const sendMessage = useCallback((message: wsMessage) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("Sending message: ", message)
            wsref.current.send(JSON.stringify(message))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot send message:', message)
            return false
        }
    }, [])

    const subscribeToRoom = useCallback((room: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("Sending subscription: ", { type: 'SUBSCRIBE', room })
            wsref.current.send(JSON.stringify({ type: 'SUBSCRIBE', room }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot subscribe to room:', room)
            return false
        }
    }, [])

    const unsubscribeToRoom = useCallback((room: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("Sending unsubscription: ", { type: 'UNSUBSCRIBE', room })
            wsref.current.send(JSON.stringify({ type: 'UNSUBSCRIBE', room }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot unsubscribe from room:', room)
            return false
        }
    }, [])

    const sendChatMessage = useCallback((roomId: string, message: {
        id: string
        content: string
        username: string
        timestamp: string
        userId: string
    }) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("Sending chat message: ", { type: 'sendMessage', roomId, message })
            wsref.current.send(JSON.stringify({ type: 'sendMessage', roomId, message }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot send chat message:', message)
            return false
        }
    }, [])

    const joinRoom = useCallback((roomId: string, username: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("User joining room: ", { type: 'USER_JOIN', roomId, username })
            wsref.current.send(JSON.stringify({ type: 'USER_JOIN', roomId, username }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot join room:', roomId)
            return false
        }
    }, [])

    const leaveRoom = useCallback((roomId: string, username: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("User leaving room: ", { type: 'USER_LEAVE', roomId, username })
            wsref.current.send(JSON.stringify({ type: 'USER_LEAVE', roomId, username }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot leave room:', roomId)
            return false
        }
    }, [])

    const sendHeartbeat = useCallback((roomId: string, username: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            wsref.current.send(JSON.stringify({ type: 'HEARTBEAT', roomId, username }))
            return true
        }
        return false
    }, [])

    const sendTyping = useCallback((roomId: string, username: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("User started typing: ", { type: 'USER_TYPING', roomId, username })
            wsref.current.send(JSON.stringify({ type: 'USER_TYPING', roomId, username }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot send typing event:', roomId)
            return false
        }
    }, [])

    const sendStopTyping = useCallback((roomId: string, username: string) => {
        if (wsref.current?.readyState === WebSocket.OPEN) {
            console.log("User stopped typing: ", { type: 'USER_STOP_TYPING', roomId, username })
            wsref.current.send(JSON.stringify({ type: 'USER_STOP_TYPING', roomId, username }))
            return true
        } else {
            console.warn('WebSocket is not connected. Cannot send stop typing event:', roomId)
            return false
        }
    }, [])


    useEffect(() => {
        // Disconnect any existing connection before connecting to new URL
        if (wsref.current && wsref.current.readyState !== WebSocket.CLOSED) {
            wsref.current.close(1000, 'URL changed')
        }
        
        connect()

        return () => {
            disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]) 

    return {
        isConnected,
        error,
        sendMessage,
        subscribeToRoom,
        unsubscribeToRoom,
        sendChatMessage,
        joinRoom,
        leaveRoom,
        sendHeartbeat,
        sendTyping,
        sendStopTyping,
        connect,
        disconnect
    }
}

