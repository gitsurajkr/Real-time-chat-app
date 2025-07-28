import React, { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTime, getInitials, getAvatarColor } from "../utils"
import { TypingIndicator } from "./TypingIndicator"
import type { MessageListProps, Message } from "../types"

// Simple skeleton loader component
const ImageSkeleton = () => (
  <div className="w-40 h-32 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z" />
    </svg>
  </div>
);


export const MessageList: React.FC<MessageListProps> = (props) => {
    const { messages, messagesEndRef, typingUsers = [], currentUsername } = props;
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [localMessages, setLocalMessages] = useState<Message[]>(messages);

    // Keep localMessages in sync with props.messages
    React.useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    // Scroll to bottom when messages change
    React.useEffect(() => {
        if (messagesEndRef && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [localMessages, messagesEndRef]);


    // For download
    const handleDownload = (imageUrl: string) => {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = 'chat-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // For enlarge (lens icon just toggles modal)
    const handleEnlarge = (imageUrl: string) => {
        setModalImage(imageUrl);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalImage(null);
    };

    return (
        <ScrollArea className="flex-1 p-2 md:p-4 overflow-y-auto">
            <div className="space-y-2 md:space-y-4 pb-4">
                {localMessages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm md:text-base">No messages yet. Start the conversation!</p>
                    </div>
                )}

                {localMessages.map((message: Message, index: number) => (
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
                          <div className={`rounded-2xl px-3 py-2 md:px-4 ${message.isOwn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
                            {message.isUploading ? (
                              <ImageSkeleton />
                            ) : message.imageUrl ? (
                              <div className="relative group">
                                <img
                                  src={message.imageUrl}
                                  alt="sent image"
                                  className="max-w-xs rounded-lg cursor-pointer"
                                  onClick={() => handleEnlarge(message.imageUrl!)}
                                />
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>
                       
                          {message.imageUrl && !message.isUploading && (
                            <div className="flex gap-2 mt-1 mb-1 opacity-80 justify-left">
                              <button title="Download" onClick={() => handleDownload(message.imageUrl!)} className="hover:text-green-600">
                                <svg className="w-8 h-8 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                ))}
                <TypingIndicator
                    typingUsers={typingUsers}
                    currentUsername={currentUsername}
                />

                <div ref={messagesEndRef} />
            </div>

            {/* Modal for enlarged image */}
            {showModal && modalImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={closeModal}>
                    <div className="bg-white rounded-lg p-4 max-w-lg w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img src={modalImage} alt="enlarged" className="max-h-[70vh] rounded-lg mb-4" />
                        <div className="flex gap-4">
                            <button onClick={() => handleDownload(modalImage)} className="px-3 py-1 flex c items-center bg-gray-200 rounded hover:bg-green-200">                                              
                                <svg className="w-8 h-8 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z" /></svg>
                                Download</button>
                            <button onClick={closeModal} className="px-3 py-1  flex items-center gap-1 justify-between">
                                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ScrollArea>
    )
}
