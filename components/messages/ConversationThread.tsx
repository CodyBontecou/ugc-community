"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, MoreVertical, Users, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { MessageSkeleton } from "./MessageSkeleton";

interface Participant {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    role: string;
  };
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string;
    displayName: string | null;
  };
}

interface ReplyTo {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
  };
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    role: string;
  };
  reactions: Reaction[];
  replyTo: ReplyTo | null;
}

interface TypingUser {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  participants: Participant[];
}

interface ConversationThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  typingUsers?: TypingUser[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onBack?: () => void;
  onSendMessage: (content: string, replyToId?: string) => Promise<void>;
  onTyping?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onLoadMore?: () => void;
  onOpenParticipants?: () => void;
  onMarkRead?: () => void;
}

export function ConversationThread({
  conversation,
  messages,
  currentUserId,
  typingUsers = [],
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onBack,
  onSendMessage,
  onTyping,
  onReact,
  onRemoveReaction,
  onLoadMore,
  onOpenParticipants,
  onMarkRead,
}: ConversationThreadProps) {
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    sender: { name: string; displayName: string | null };
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Get conversation name
  const getConversationName = () => {
    if (!conversation) return "";
    if (conversation.name) return conversation.name;

    if (conversation.type === "direct") {
      const other = conversation.participants.find((p) => p.userId !== currentUserId);
      return other?.user.displayName || other?.user.name || "Unknown";
    }

    const names = conversation.participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => p.user.displayName || p.user.name)
      .slice(0, 3);

    if (names.length === 0) return "No participants";
    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  // Get conversation avatar
  const getAvatar = () => {
    if (!conversation || conversation.type === "group") return null;
    const other = conversation.participants.find((p) => p.userId !== currentUserId);
    return other?.user.image;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);

    // Load more when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (conversation && onMarkRead) {
      onMarkRead();
    }
  }, [conversation, onMarkRead]);

  const handleReply = (message: Message) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      sender: {
        name: message.sender.name,
        displayName: message.sender.displayName,
      },
    });
  };

  const handleSend = async (content: string, replyToId?: string) => {
    await onSendMessage(content, replyToId);
    setReplyTo(null);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-warm-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-warm-gray-200 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-warm-gray-400" />
          </div>
          <p className="text-warm-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const name = getConversationName();
  const avatar = getAvatar();

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-warm-gray-100">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-warm-gray-500 hover:text-warm-gray-700 lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Avatar */}
        {conversation.type === "group" ? (
          <div className="w-10 h-10 rounded-full bg-warm-gray-200 flex items-center justify-center">
            <Users size={18} className="text-warm-gray-500" />
          </div>
        ) : avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-warm-gray-900 truncate">{name}</h3>
          <p className="text-xs text-warm-gray-500">
            {conversation.participants.length} participant
            {conversation.participants.length !== 1 ? "s" : ""}
          </p>
        </div>

        {onOpenParticipants && (
          <button
            type="button"
            onClick={onOpenParticipants}
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={20} className="animate-spin text-warm-gray-400" />
          </div>
        )}

        {isLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-warm-gray-500">No messages yet</p>
            <p className="text-sm text-warm-gray-400 mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              id={message.id}
              content={message.content}
              createdAt={message.createdAt}
              sender={message.sender}
              isCurrentUser={message.senderId === currentUserId}
              reactions={message.reactions}
              replyTo={message.replyTo}
              onReply={() => handleReply(message)}
              onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
              onRemoveReaction={
                onRemoveReaction ? (emoji) => onRemoveReaction(message.id, emoji) : undefined
              }
              currentUserId={currentUserId}
            />
          ))
        )}

        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} />

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
