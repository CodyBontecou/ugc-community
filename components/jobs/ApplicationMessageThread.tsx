"use client";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
  };
}

interface ApplicationMessageThreadProps {
  applicationId: string;
  currentUserId: string;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function ApplicationMessageThread({
  applicationId,
  currentUserId,
  messages,
  onSendMessage,
  isLoading = false,
}: ApplicationMessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-warm-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-warm-gray-500">No messages yet</p>
            <p className="text-xs text-warm-gray-400 mt-1">
              Start the conversation below
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender.id === currentUserId;
            const senderName = msg.sender.displayName || msg.sender.name || "Unknown";

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${
                    isCurrentUser
                      ? "bg-coral/10 text-warm-gray-900"
                      : "bg-warm-gray-100 text-warm-gray-900"
                  } rounded-2xl px-4 py-2`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-medium text-warm-gray-500 mb-1">
                      {senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className="text-[10px] text-warm-gray-400 mt-1 text-right">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="border-t border-warm-gray-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 text-sm border border-warm-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-coral text-white rounded-full hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
