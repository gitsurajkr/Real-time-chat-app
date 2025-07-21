import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import type { MessageInputProps } from "../types"

export const MessageInput: React.FC<MessageInputProps> = ({
    input,
    setInput,
    onSubmit,
    isConnected
}) => {
    return (
        <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm p-2 md:p-4 flex-shrink-0 safe-area-inset-bottom">
            <form onSubmit={onSubmit} className="flex space-x-2">
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
    )
}
