export interface Message {
    id: string
    content: string
    username: string
    timestamp: Date
    isOwn: boolean
}

export interface User {
    username: string
    joinedAt: Date
    isOnline: boolean
    lastSeen?: Date
}

export interface ChatRoomProps {
    roomId: string
    username: string
}

export interface MessageInputProps {
    input: string
    setInput: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    isConnected: boolean
}

export interface MessageListProps {
    messages: Message[]
    messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export interface UsersSidebarProps {
    users: User[]
    currentUsername: string
    roomId: string
    copied: boolean
    onCopyRoomId: () => void
    onBackClick: () => void
}

export interface MobileUsersListProps {
    users: User[]
    currentUsername: string
    showUsersList: boolean
    onClose: () => void
}

export interface ChatHeaderProps {
    roomId: string
    isConnected: boolean
    users: User[]
    error?: string | null
    copied: boolean
    onCopyRoomId: () => void
    onBackClick: () => void
    onShowUsersList: () => void
}
