export interface Message {
    id: string
    content: string
    username: string
    timestamp: Date 
    isOwn?: boolean,
    imageUrl?: string
    isUploading?: boolean;
    replyTo?: {
        id: string;
        username: string;
        content: string;
    };
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
    onTyping?: () => void
    onStopTyping?: () => void,
    onSendImage?: (file: File ) => void
    replyingTo?: Message | null;
    onCancelReply?: () => void;
}

export interface MessageListProps {
    messages: Message[]
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    typingUsers?: string[]
    currentUsername: string
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
