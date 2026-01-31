"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2, X } from "lucide-react";

interface ReplyTo {
  id: string;
  content: string;
  sender: {
    name: string;
    displayName: string | null;
  };
}

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => Promise<void>;
  onTyping?: () => void;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when replying
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(content.trim(), replyTo?.id);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel reply on Escape
    if (e.key === "Escape" && replyTo && onCancelReply) {
      onCancelReply();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
  };

  return (
    <div className="border-t border-warm-gray-100 bg-white">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-warm-gray-50 border-b border-warm-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-warm-gray-500">
              Replying to {replyTo.sender.displayName || replyTo.sender.name}
            </p>
            <p className="text-sm text-warm-gray-600 truncate">{replyTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="flex-1 px-4 py-2 text-sm border border-warm-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSending || disabled}
            className="p-3 bg-coral text-white rounded-full hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-warm-gray-400 mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
