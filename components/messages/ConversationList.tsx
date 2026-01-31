"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Plus, Users } from "lucide-react";
import { UnreadBadge } from "./UnreadBadge";
import { ConversationListSkeleton } from "./MessageSkeleton";

interface Participant {
  userId: string;
  user: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    role: string;
  };
}

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
  };
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  lastMessageAt: Date | string | null;
  participants: Participant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  currentUserId: string;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  currentUserId,
  isLoading = false,
  searchQuery = "",
  onSearchChange,
}: ConversationListProps) {
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;

    // For direct conversations, show the other participant's name
    if (conversation.type === "direct") {
      const other = conversation.participants.find((p) => p.userId !== currentUserId);
      return other?.user.displayName || other?.user.name || "Unknown";
    }

    // For groups without a name, list participants
    const names = conversation.participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => p.user.displayName || p.user.name)
      .slice(0, 3);

    if (names.length === 0) return "No participants";
    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return null; // Use group icon
    }

    const other = conversation.participants.find((p) => p.userId !== currentUserId);
    return other?.user.image;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-warm-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-warm-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-gray-900">Messages</h2>
          <button
            type="button"
            onClick={onNewConversation}
            className="p-2 text-coral hover:bg-coral/10 rounded-full transition-colors"
            title="New conversation"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            />
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-warm-gray-100 flex items-center justify-center mb-4">
              <Users size={24} className="text-warm-gray-400" />
            </div>
            <p className="text-sm text-warm-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onNewConversation}
                className="mt-4 text-sm text-coral hover:underline"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-warm-gray-100">
            {filteredConversations.map((conversation) => {
              const name = getConversationName(conversation);
              const avatar = getConversationAvatar(conversation);
              const isSelected = conversation.id === selectedId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-warm-gray-50 transition-colors ${
                    isSelected ? "bg-coral/5" : ""
                  }`}
                >
                  {/* Avatar */}
                  {conversation.type === "group" ? (
                    <div className="w-12 h-12 rounded-full bg-warm-gray-200 flex items-center justify-center flex-shrink-0">
                      <Users size={20} className="text-warm-gray-500" />
                    </div>
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium flex-shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium truncate ${
                          conversation.unreadCount > 0
                            ? "text-warm-gray-900"
                            : "text-warm-gray-700"
                        }`}
                      >
                        {name}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-[10px] text-warm-gray-400 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          conversation.unreadCount > 0
                            ? "text-warm-gray-700 font-medium"
                            : "text-warm-gray-500"
                        }`}
                      >
                        {conversation.lastMessage.senderId === currentUserId && "You: "}
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <UnreadBadge count={conversation.unreadCount} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
