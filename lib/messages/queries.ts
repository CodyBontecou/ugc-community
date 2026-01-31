import { db } from "@/lib/db";
import {
  conversations,
  conversationParticipants,
  messages,
  messageReactions,
  messageReadReceipts,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql, isNull, gt, lt, inArray, or, ilike } from "drizzle-orm";
import type { ConversationType, ParticipantRole } from "./constants";
import { MESSAGE_LIMIT, CONVERSATION_LIMIT, TYPING_TIMEOUT_MS } from "./constants";

// In-memory typing indicators (replace with Redis in production)
const typingIndicators = new Map<string, Map<string, number>>();

// =====================================================
// Conversation Functions
// =====================================================

export async function createConversation(
  createdBy: string,
  type: ConversationType,
  participantIds: string[],
  name?: string
) {
  // For direct conversations, check if one already exists
  if (type === "direct" && participantIds.length === 2) {
    const existingConversation = await findDirectConversation(
      participantIds[0],
      participantIds[1]
    );
    if (existingConversation) {
      return existingConversation;
    }
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      type,
      name,
      createdBy,
    })
    .returning();

  // Add participants
  const participantValues = participantIds.map((userId, index) => ({
    conversationId: conversation.id,
    userId,
    role: (userId === createdBy ? "owner" : "member") as ParticipantRole,
  }));

  await db.insert(conversationParticipants).values(participantValues);

  return conversation;
}

export async function findDirectConversation(userId1: string, userId2: string) {
  // Find a direct conversation where both users are active participants
  const result = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
    .where(
      and(
        eq(conversations.type, "direct"),
        eq(conversationParticipants.userId, userId1),
        isNull(conversationParticipants.leftAt)
      )
    );

  for (const row of result) {
    // Check if the other user is also a participant
    const [otherParticipant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, row.conversationId),
          eq(conversationParticipants.userId, userId2),
          isNull(conversationParticipants.leftAt)
        )
      )
      .limit(1);

    if (otherParticipant) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, row.conversationId))
        .limit(1);
      return conversation;
    }
  }

  return null;
}

export async function addParticipant(
  conversationId: string,
  userId: string,
  role: ParticipantRole = "member"
) {
  const [participant] = await db
    .insert(conversationParticipants)
    .values({
      conversationId,
      userId,
      role,
    })
    .onConflictDoUpdate({
      target: [conversationParticipants.conversationId, conversationParticipants.userId],
      set: {
        leftAt: null, // Rejoin if previously left
        role,
      },
    })
    .returning();

  return participant;
}

export async function removeParticipant(conversationId: string, userId: string) {
  const [participant] = await db
    .update(conversationParticipants)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .returning();

  return participant;
}

export async function getConversation(conversationId: string, userId: string) {
  // First verify user is a participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    )
    .limit(1);

  if (!participant) {
    return null;
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    return null;
  }

  // Get all active participants with user info
  const participants = await db
    .select({
      id: conversationParticipants.id,
      conversationId: conversationParticipants.conversationId,
      userId: conversationParticipants.userId,
      role: conversationParticipants.role,
      joinedAt: conversationParticipants.joinedAt,
      lastReadAt: conversationParticipants.lastReadAt,
      mutedUntil: conversationParticipants.mutedUntil,
      user: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      },
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        isNull(conversationParticipants.leftAt)
      )
    );

  return {
    ...conversation,
    participants,
  };
}

export async function listUserConversations(
  userId: string,
  limit = CONVERSATION_LIMIT,
  offset = 0
) {
  // Get conversations where user is active participant
  const userConversations = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    );

  if (userConversations.length === 0) {
    return { conversations: [], total: 0 };
  }

  const conversationIds = userConversations.map((c) => c.conversationId);
  const lastReadMap = new Map(
    userConversations.map((c) => [c.conversationId, c.lastReadAt])
  );

  // Get conversation details with last message
  const conversationList = await db
    .select()
    .from(conversations)
    .where(inArray(conversations.id, conversationIds))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(limit)
    .offset(offset);

  // Get participants for each conversation
  const conversationsWithDetails = await Promise.all(
    conversationList.map(async (conv) => {
      // Get participants
      const participants = await db
        .select({
          userId: conversationParticipants.userId,
          role: conversationParticipants.role,
          user: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            image: users.image,
            role: users.role,
          },
        })
        .from(conversationParticipants)
        .innerJoin(users, eq(users.id, conversationParticipants.userId))
        .where(
          and(
            eq(conversationParticipants.conversationId, conv.id),
            isNull(conversationParticipants.leftAt)
          )
        );

      // Get last message
      const [lastMessage] = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
          sender: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
          },
        })
        .from(messages)
        .innerJoin(users, eq(users.id, messages.senderId))
        .where(
          and(
            eq(messages.conversationId, conv.id),
            isNull(messages.deletedAt)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get unread count
      const lastReadAt = lastReadMap.get(conv.id);
      let unreadCount = 0;
      if (lastReadAt) {
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              gt(messages.createdAt, lastReadAt),
              isNull(messages.deletedAt)
            )
          );
        unreadCount = result?.count || 0;
      } else {
        // Never read - count all messages
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              isNull(messages.deletedAt)
            )
          );
        unreadCount = result?.count || 0;
      }

      return {
        ...conv,
        participants,
        lastMessage: lastMessage || null,
        unreadCount,
      };
    })
  );

  return {
    conversations: conversationsWithDetails,
    total: conversationIds.length,
  };
}

// =====================================================
// Message Functions
// =====================================================

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  type: "text" | "system" = "text",
  replyToId?: string
) {
  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId,
      content,
      type,
      replyToId,
    })
    .returning();

  // Update conversation lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: message.createdAt, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // Clear typing indicator for sender
  clearTypingIndicator(conversationId, senderId);

  return message;
}

export async function getMessages(
  conversationId: string,
  limit = MESSAGE_LIMIT,
  offset = 0,
  before?: Date
) {
  const conditions = [
    eq(messages.conversationId, conversationId),
    isNull(messages.deletedAt),
  ];

  if (before) {
    conditions.push(lt(messages.createdAt, before));
  }

  const messageList = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      replyToId: messages.replyToId,
      metadata: messages.metadata,
      editedAt: messages.editedAt,
      createdAt: messages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      },
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  // Get reactions for each message
  const messagesWithReactions = await Promise.all(
    messageList.map(async (msg) => {
      const reactions = await db
        .select({
          id: messageReactions.id,
          emoji: messageReactions.emoji,
          userId: messageReactions.userId,
          createdAt: messageReactions.createdAt,
          user: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
          },
        })
        .from(messageReactions)
        .innerJoin(users, eq(users.id, messageReactions.userId))
        .where(eq(messageReactions.messageId, msg.id));

      // Get reply-to message if exists
      let replyTo = null;
      if (msg.replyToId) {
        const [replyMessage] = await db
          .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            sender: {
              id: users.id,
              name: users.name,
              displayName: users.displayName,
            },
          })
          .from(messages)
          .innerJoin(users, eq(users.id, messages.senderId))
          .where(eq(messages.id, msg.replyToId))
          .limit(1);
        replyTo = replyMessage || null;
      }

      return {
        ...msg,
        reactions,
        replyTo,
      };
    })
  );

  // Reverse to chronological order
  return messagesWithReactions.reverse();
}

export async function markConversationRead(conversationId: string, userId: string) {
  const [updated] = await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .returning();

  return updated;
}

export async function getUnreadCount(userId: string) {
  // Get all user's conversations
  const userConversations = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    );

  let totalUnread = 0;

  for (const conv of userConversations) {
    if (conv.lastReadAt) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.conversationId),
            gt(messages.createdAt, conv.lastReadAt),
            isNull(messages.deletedAt)
          )
        );
      totalUnread += result?.count || 0;
    } else {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.conversationId),
            isNull(messages.deletedAt)
          )
        );
      totalUnread += result?.count || 0;
    }
  }

  return totalUnread;
}

// =====================================================
// Reaction Functions
// =====================================================

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const [reaction] = await db
    .insert(messageReactions)
    .values({
      messageId,
      userId,
      emoji,
    })
    .onConflictDoNothing()
    .returning();

  return reaction;
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    );
}

// =====================================================
// Search Functions
// =====================================================

export async function searchMessages(userId: string, query: string, limit = 20) {
  // Get user's conversations first
  const userConversations = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    );

  if (userConversations.length === 0) {
    return [];
  }

  const conversationIds = userConversations.map((c) => c.conversationId);

  const results = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      content: messages.content,
      createdAt: messages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
      },
      conversation: {
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
      },
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        isNull(messages.deletedAt),
        ilike(messages.content, `%${query}%`)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return results;
}

// =====================================================
// Polling Functions
// =====================================================

export async function getConversationUpdates(conversationId: string, since: Date) {
  // Get new messages since timestamp
  const newMessages = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      replyToId: messages.replyToId,
      metadata: messages.metadata,
      editedAt: messages.editedAt,
      createdAt: messages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      },
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        gt(messages.createdAt, since),
        isNull(messages.deletedAt)
      )
    )
    .orderBy(messages.createdAt);

  // Get new reactions since timestamp
  const newReactions = await db
    .select({
      id: messageReactions.id,
      messageId: messageReactions.messageId,
      emoji: messageReactions.emoji,
      userId: messageReactions.userId,
      createdAt: messageReactions.createdAt,
      user: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
      },
    })
    .from(messageReactions)
    .innerJoin(users, eq(users.id, messageReactions.userId))
    .innerJoin(messages, eq(messages.id, messageReactions.messageId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        gt(messageReactions.createdAt, since)
      )
    );

  return {
    messages: newMessages,
    reactions: newReactions,
  };
}

// =====================================================
// Typing Indicator Functions (In-Memory)
// =====================================================

export function setTypingIndicator(conversationId: string, userId: string) {
  if (!typingIndicators.has(conversationId)) {
    typingIndicators.set(conversationId, new Map());
  }
  typingIndicators.get(conversationId)!.set(userId, Date.now());
}

export function clearTypingIndicator(conversationId: string, userId: string) {
  const conversationTyping = typingIndicators.get(conversationId);
  if (conversationTyping) {
    conversationTyping.delete(userId);
  }
}

export async function getTypingIndicators(conversationId: string, excludeUserId?: string) {
  const conversationTyping = typingIndicators.get(conversationId);
  if (!conversationTyping) {
    return [];
  }

  const now = Date.now();
  const activeUsers: string[] = [];

  for (const [userId, timestamp] of conversationTyping.entries()) {
    if (now - timestamp < TYPING_TIMEOUT_MS) {
      if (!excludeUserId || userId !== excludeUserId) {
        activeUsers.push(userId);
      }
    } else {
      // Clean up stale entries
      conversationTyping.delete(userId);
    }
  }

  if (activeUsers.length === 0) {
    return [];
  }

  // Get user info for typing users
  const typingUsers = await db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      image: users.image,
    })
    .from(users)
    .where(inArray(users.id, activeUsers));

  return typingUsers;
}

// =====================================================
// Participant Helpers
// =====================================================

export async function isParticipant(conversationId: string, userId: string) {
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    )
    .limit(1);

  return !!participant;
}

export async function getParticipants(conversationId: string) {
  return db
    .select({
      id: conversationParticipants.id,
      userId: conversationParticipants.userId,
      role: conversationParticipants.role,
      joinedAt: conversationParticipants.joinedAt,
      lastReadAt: conversationParticipants.lastReadAt,
      user: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      },
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        isNull(conversationParticipants.leftAt)
      )
    );
}
