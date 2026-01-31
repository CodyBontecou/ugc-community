"use client";

import { useState } from "react";
import { X, UserPlus, UserMinus, Crown, Loader2 } from "lucide-react";

interface Participant {
  id: string;
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

interface ParticipantListProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId: string;
  isOwner: boolean;
  conversationType: string;
  onAddParticipant?: () => void;
  onRemoveParticipant?: (userId: string) => Promise<void>;
  onLeaveConversation?: () => Promise<void>;
}

export function ParticipantList({
  isOpen,
  onClose,
  participants,
  currentUserId,
  isOwner,
  conversationType,
  onAddParticipant,
  onRemoveParticipant,
  onLeaveConversation,
}: ParticipantListProps) {
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRemove = async (userId: string) => {
    if (!onRemoveParticipant) return;

    setRemovingUserId(userId);
    try {
      await onRemoveParticipant(userId);
    } catch (error) {
      console.error("Error removing participant:", error);
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleLeave = async () => {
    if (!onLeaveConversation) return;

    setIsLeaving(true);
    try {
      await onLeaveConversation();
      onClose();
    } catch (error) {
      console.error("Error leaving conversation:", error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-warm-gray-100">
          <h2 className="text-lg font-semibold text-warm-gray-900">Participants</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Add participant button (group only) */}
        {conversationType === "group" && isOwner && onAddParticipant && (
          <button
            type="button"
            onClick={onAddParticipant}
            className="flex items-center gap-3 p-4 text-coral hover:bg-coral/5 transition-colors border-b border-warm-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
              <UserPlus size={18} className="text-coral" />
            </div>
            <span className="font-medium">Add Participant</span>
          </button>
        )}

        {/* Participant list */}
        <div className="flex-1 overflow-y-auto divide-y divide-warm-gray-100">
          {participants.map((participant) => {
            const isCurrentUser = participant.userId === currentUserId;
            const canRemove =
              conversationType === "group" &&
              isOwner &&
              !isCurrentUser &&
              onRemoveParticipant;

            return (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-4"
              >
                {/* Avatar */}
                {participant.user.image ? (
                  <img
                    src={participant.user.image}
                    alt={participant.user.displayName || participant.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium">
                    {(participant.user.displayName || participant.user.name)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-warm-gray-900 truncate">
                      {participant.user.displayName || participant.user.name}
                      {isCurrentUser && (
                        <span className="text-warm-gray-500 ml-1">(you)</span>
                      )}
                    </p>
                    {participant.role === "owner" && (
                      <span title="Owner">
                        <Crown size={14} className="text-amber-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-gray-500 capitalize">
                    {participant.user.role}
                  </p>
                </div>

                {/* Remove button */}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemove(participant.userId)}
                    disabled={removingUserId === participant.userId}
                    className="p-2 text-warm-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    {removingUserId === participant.userId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserMinus size={16} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Leave button (for non-owners in groups) */}
        {conversationType === "group" && !isOwner && onLeaveConversation && (
          <div className="p-4 border-t border-warm-gray-100">
            <button
              type="button"
              onClick={handleLeave}
              disabled={isLeaving}
              className="w-full py-2.5 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLeaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Conversation"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
