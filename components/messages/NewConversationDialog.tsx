"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, Users, Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
  role: string;
  interactionType?: "application" | "saved" | "admin";
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (participantIds: string[], type: "direct" | "group", name?: string) => Promise<void>;
  currentUserId: string;
}

export function NewConversationDialog({
  isOpen,
  onClose,
  onCreateConversation,
  currentUserId,
}: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load messageable users on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadMessageableUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/messages/messageable-users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users.filter((u: User) => u.id !== currentUserId));
        }
      } catch (error) {
        console.error("Error loading messageable users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessageableUsers();
  }, [isOpen, currentUserId]);

  // Filter users by search query (client-side filtering since we already have all messageable users)
  const filteredUsers = searchQuery.trim()
    ? users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const name = user.name?.toLowerCase() || "";
        const displayName = user.displayName?.toLowerCase() || "";
        return name.includes(query) || displayName.includes(query);
      })
    : users;

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setSelectedUsers([]);
      setGroupName("");
    }
  }, [isOpen]);

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map((u) => u.id);
      const type = selectedUsers.length === 1 ? "direct" : "group";
      const name = type === "group" && groupName.trim() ? groupName.trim() : undefined;

      await onCreateConversation(participantIds, type, name);
      onClose();
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-warm-gray-100">
          <h2 className="text-lg font-semibold text-warm-gray-900">New Conversation</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-warm-gray-100">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-coral/10 text-coral rounded-full text-sm"
                >
                  {user.displayName || user.name}
                  <X size={14} />
                </button>
              ))}
            </div>

            {/* Group name input (only for multiple users) */}
            {selectedUsers.length > 1 && (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name (optional)"
                className="w-full mt-3 px-4 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
            )}
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-warm-gray-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-warm-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-warm-gray-500">
              {searchQuery
                ? "No users found matching your search"
                : "No users to message yet. Connect with creators through job applications or save creators to your list."}
            </div>
          ) : (
            <div className="divide-y divide-warm-gray-100">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-warm-gray-50 transition-colors ${
                      isSelected ? "bg-coral/5" : ""
                    }`}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.displayName || user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium">
                        {(user.displayName || user.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-gray-900 truncate">
                        {user.displayName || user.name}
                      </p>
                      <p className="text-xs text-warm-gray-500">
                        <span className="capitalize">{user.role}</span>
                        {user.interactionType && user.interactionType !== "admin" && (
                          <span className="text-warm-gray-400">
                            {" "}
                            &middot;{" "}
                            {user.interactionType === "application"
                              ? "via job"
                              : "saved"}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-coral flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-warm-gray-100">
          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || isCreating}
            className="w-full py-2.5 bg-coral text-white rounded-lg font-medium hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : selectedUsers.length > 1 ? (
              <>
                <Users size={18} />
                Create Group
              </>
            ) : (
              "Start Conversation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
