import React, { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import type { MessageInputProps } from "../types"
import Image from "next/image"

export const MessageInput: React.FC<MessageInputProps> = ({
    input,
    setInput,
    onSubmit,
    isConnected,
    onTyping,
    onStopTyping,
    onSendImage
}) => {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isTypingRef = useRef(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const handleImageClick = () => fileInputRef.current?.click()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2MB")
            return
        }
        onSendImage?.(file)
        e.target.value = "" // reset input
    }

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInput(value)

        // Handle typing indicators
        if (value.trim() && onTyping && onStopTyping) {
            // User started typing
            if (!isTypingRef.current) {
                isTypingRef.current = true
                onTyping()
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            // Set new timeout to stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false
                onStopTyping()
            }, 2000)
        } else if (!value.trim() && isTypingRef.current && onStopTyping) {
            // User cleared input, stop typing immediately
            isTypingRef.current = false
            onStopTyping()
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [setInput, onTyping, onStopTyping])

    const handleSubmit = useCallback((e: React.FormEvent) => {
        // Stop typing when message is sent
        if (isTypingRef.current && onStopTyping) {
            isTypingRef.current = false
            onStopTyping()
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
        onSubmit(e)
    }, [onSubmit, onStopTyping])

    return (
        <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm p-2 md:p-4 flex-shrink-0 safe-area-inset-bottom">
            <form onSubmit={handleSubmit} className="flex space-x-2">

                <button
                    type="button"
                    onClick={handleImageClick}
                    className="text-blue-500 hover:text-blue-600 cursor-pointer"
                    title="Send image"
                >
                    <Image src="/Imageicon.png" alt="image" width={40} height={40} className="rounded-md"/>
                </button>

                <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <Input
                    value={input}
                    onChange={handleInputChange}
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
    )
}
