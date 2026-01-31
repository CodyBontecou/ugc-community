"use client";

import { formatDistanceToNow } from "date-fns";
import { Reply } from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";

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

interface MessageBubbleProps {
  id: string;
  content: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
  };
  isCurrentUser: boolean;
  reactions?: Reaction[];
  replyTo?: ReplyTo | null;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  currentUserId?: string;
}

export function MessageBubble({
  id,
  content,
  createdAt,
  sender,
  isCurrentUser,
  reactions = [],
  replyTo,
  onReply,
  onReact,
  onRemoveReaction,
  currentUserId,
}: MessageBubbleProps) {
  const senderName = sender.displayName || sender.name || "Unknown";
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user.displayName || reaction.user.name);
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {} as Record<string, { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }>);

  const handleReactionClick = (emoji: string, hasCurrentUser: boolean) => {
    if (hasCurrentUser && onRemoveReaction) {
      onRemoveReaction(emoji);
    } else if (!hasCurrentUser && onReact) {
      onReact(emoji);
    }
  };

  return (
    <div className={`group flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%]">
        {/* Reply preview */}
        {replyTo && (
          <div
            className={`mb-1 px-3 py-1 text-xs rounded-lg border-l-2 ${
              isCurrentUser
                ? "bg-coral/5 border-coral/30 text-warm-gray-600"
                : "bg-warm-gray-50 border-warm-gray-300 text-warm-gray-600"
            }`}
          >
            <span className="font-medium">
              {replyTo.sender.displayName || replyTo.sender.name}
            </span>
            <p className="truncate">{replyTo.content}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2 ${
            isCurrentUser
              ? "bg-coral/10 text-warm-gray-900"
              : "bg-warm-gray-100 text-warm-gray-900"
          }`}
        >
          {!isCurrentUser && (
            <p className="text-xs font-medium text-warm-gray-500 mb-1">{senderName}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          <p className="text-[10px] text-warm-gray-400 mt-1 text-right">{timeAgo}</p>

          {/* Action buttons on hover */}
          <div
            className={`absolute top-0 ${
              isCurrentUser ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
          >
            {onReply && (
              <button
                type="button"
                onClick={onReply}
                className="p-1 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                title="Reply"
              >
                <Reply size={16} />
              </button>
            )}
            {onReact && <ReactionPicker onSelect={onReact} />}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={`flex gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
            {Object.values(reactionGroups).map((group) => (
              <button
                key={group.emoji}
                type="button"
                onClick={() => handleReactionClick(group.emoji, group.hasCurrentUser)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  group.hasCurrentUser
                    ? "bg-coral/10 border-coral/30 text-coral"
                    : "bg-warm-gray-50 border-warm-gray-200 text-warm-gray-600 hover:bg-warm-gray-100"
                }`}
                title={group.users.join(", ")}
              >
                <span>{group.emoji}</span>
                <span>{group.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
