export const MESSAGE_TYPES = ["text", "system"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const CONVERSATION_TYPES = ["direct", "group"] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const PARTICIPANT_ROLES = ["owner", "member"] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const MESSAGE_LIMIT = 50;
export const CONVERSATION_LIMIT = 20;
export const TYPING_TIMEOUT_MS = 3000;
export const POLL_INTERVAL_MS = 3000;

export const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"] as const;
