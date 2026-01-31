"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  Loader2,
} from "lucide-react";
import { useNotifications, type Notification } from "@/lib/contexts/NotificationContext";

interface NotificationDropdownProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, typeof Briefcase> = {
  job_application: Briefcase,
  application_accepted: CheckCircle,
  application_rejected: XCircle,
  application_info_requested: HelpCircle,
  new_message: MessageSquare,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  job_application: "text-blue-500 bg-blue-50",
  application_accepted: "text-green-500 bg-green-50",
  application_rejected: "text-warm-gray-400 bg-warm-gray-50",
  application_info_requested: "text-amber-500 bg-amber-50",
  new_message: "text-lavender bg-lavender/10",
};

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[--radius-lg] shadow-lg border border-warm-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-gray-100">
        <h3 className="font-medium text-warm-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-coral hover:text-coral/80 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-warm-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-warm-gray-50 flex items-center justify-center mb-3">
              <Bell size={24} className="text-warm-gray-300" />
            </div>
            <p className="text-sm text-warm-gray-500">No notifications yet</p>
            <p className="text-xs text-warm-gray-400 mt-1">
              We&apos;ll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-gray-50">
            {notifications.slice(0, 10).map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              const colorClass =
                NOTIFICATION_COLORS[notification.type] || "text-warm-gray-400 bg-warm-gray-50";

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-warm-gray-50 transition-colors ${
                    !notification.readAt ? "bg-coral/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p
                          className={`text-sm ${
                            !notification.readAt
                              ? "font-medium text-warm-gray-900"
                              : "text-warm-gray-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.readAt && (
                          <span className="w-2 h-2 rounded-full bg-coral flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-warm-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-warm-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="px-4 py-2 border-t border-warm-gray-100">
          <button
            onClick={() => {
              router.push("/dashboard/notifications");
              onClose();
            }}
            className="text-xs text-warm-gray-500 hover:text-warm-gray-700 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </motion.div>
  );
}
