
import React from "react"

interface TypingIndicatorProps {
    typingUsers: string[]
    currentUsername: string
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingUsers,
    currentUsername
}) => {
    const otherTypingUsers = typingUsers.filter(user => user !== currentUsername)
    
    if (otherTypingUsers.length === 0) return null

    const getTypingText = () => {
        if (otherTypingUsers.length === 1) {
            return `${otherTypingUsers[0]} is typing...`
        } else if (otherTypingUsers.length === 2) {
            return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`
        } else if (otherTypingUsers.length === 3) {
            return `${otherTypingUsers[0]}, ${otherTypingUsers[1]}, and ${otherTypingUsers[2]} are typing...`
        } else {
            return `${otherTypingUsers[0]}, ${otherTypingUsers[1]}, and ${otherTypingUsers.length - 2} others are typing...`
        }
    }

    return (
        <div className="flex items-center space-x-2 px-2 md:px-4 py-2 text-sm text-gray-500">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
            <span className="italic">{getTypingText()}</span>
        </div>
    )
}
