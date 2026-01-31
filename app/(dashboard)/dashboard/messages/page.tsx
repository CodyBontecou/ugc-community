"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { ParticipantList } from "@/components/messages/ParticipantList";
import { useMessagePolling } from "@/lib/hooks/use-message-polling";
import { useTypingPolling } from "@/lib/hooks/use-typing-polling";

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

interface MessageData {
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

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  lastMessageAt: Date | null;
  participants: Participant[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      displayName: string | null;
    };
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    type: string;
    name: string | null;
    participants: Participant[];
  } | null>(null);
  const [initialMessages, setInitialMessages] = useState<MessageData[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use polling hooks - cast to any to avoid type conflicts
  const { messages, isPolling } = useMessagePolling(
    selectedConversationId,
    initialMessages as any
  );
  const { typingUsers, setTyping } = useTypingPolling(selectedConversationId);

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUser();
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setInitialMessages([]);
      return;
    }

    async function fetchConversation() {
      setIsLoadingMessages(true);
      try {
        const [convResponse, msgResponse] = await Promise.all([
          fetch(`/api/messages/conversations/${selectedConversationId}`),
          fetch(`/api/messages/conversations/${selectedConversationId}/messages`),
        ]);

        if (convResponse.ok) {
          const convData = await convResponse.json();
          setSelectedConversation(convData.conversation);
        }

        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          setInitialMessages(msgData.messages || []);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchConversation();
  }, [selectedConversationId]);

  // Mark conversation as read
  const handleMarkRead = useCallback(async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/messages/conversations/${selectedConversationId}/read`, {
        method: "POST",
      });
      // Update local unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error("Error marking read:", error);
    }
  }, [selectedConversationId]);

  // Send message
  const handleSendMessage = async (content: string, replyToId?: string) => {
    if (!selectedConversationId) return;

    const response = await fetch(
      `/api/messages/conversations/${selectedConversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, replyToId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    // Refresh conversations to update last message
    fetchConversations();
  };

  // Add reaction
  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedConversationId) return;

    await fetch(
      `/api/messages/conversations/${selectedConversationId}/reactions/${messageId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }
    );
  };

  // Remove reaction
  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!selectedConversationId) return;

    await fetch(
      `/api/messages/conversations/${selectedConversationId}/reactions/${messageId}?emoji=${encodeURIComponent(emoji)}`,
      { method: "DELETE" }
    );
  };

  // Create conversation
  const handleCreateConversation = async (
    participantIds: string[],
    type: "direct" | "group",
    name?: string
  ) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, participantIds, name }),
    });

    if (!response.ok) {
      throw new Error("Failed to create conversation");
    }

    const data = await response.json();
    await fetchConversations();
    setSelectedConversationId(data.conversation.id);
  };

  // Remove participant
  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedConversationId) return;

    await fetch(
      `/api/messages/conversations/${selectedConversationId}/participants?userId=${userId}`,
      { method: "DELETE" }
    );

    // Refresh conversation
    const response = await fetch(
      `/api/messages/conversations/${selectedConversationId}`
    );
    if (response.ok) {
      const data = await response.json();
      setSelectedConversation(data.conversation);
    }
  };

  // Leave conversation
  const handleLeaveConversation = async () => {
    if (!selectedConversationId || !currentUserId) return;

    await fetch(
      `/api/messages/conversations/${selectedConversationId}/participants?userId=${currentUserId}`,
      { method: "DELETE" }
    );

    setSelectedConversationId(null);
    setSelectedConversation(null);
    fetchConversations();
  };

  // Check if current user is owner
  const isOwner =
    selectedConversation?.participants.find((p) => p.userId === currentUserId)
      ?.role === "owner";

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-pulse text-warm-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversation list - hidden on mobile when conversation selected */}
      <div
        className={`w-full lg:w-1/3 lg:max-w-sm ${
          selectedConversationId ? "hidden lg:block" : ""
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          onNewConversation={() => setShowNewDialog(true)}
          currentUserId={currentUserId}
          isLoading={isLoadingConversations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Conversation thread */}
      <div
        className={`flex-1 ${
          !selectedConversationId ? "hidden lg:flex" : ""
        }`}
      >
        <ConversationThread
          conversation={selectedConversation}
          messages={messages as any}
          currentUserId={currentUserId}
          typingUsers={typingUsers}
          isLoading={isLoadingMessages}
          onBack={() => setSelectedConversationId(null)}
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
          onOpenParticipants={() => setShowParticipants(true)}
          onMarkRead={handleMarkRead}
        />
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreateConversation={handleCreateConversation}
        currentUserId={currentUserId}
      />

      {/* Participant list dialog */}
      {selectedConversation && (
        <ParticipantList
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          participants={selectedConversation.participants.map((p) => ({
            id: p.userId,
            ...p,
          }))}
          currentUserId={currentUserId}
          isOwner={isOwner}
          conversationType={selectedConversation.type}
          onRemoveParticipant={handleRemoveParticipant}
          onLeaveConversation={handleLeaveConversation}
        />
      )}
    </div>
  );
}
