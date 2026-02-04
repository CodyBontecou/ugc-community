"use client";

import { MessageCircle, Palette, History, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarView = "chat" | "design" | "media" | "history";

interface NavItem {
  id: SidebarView;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat", icon: <MessageCircle size={20} />, label: "Chat" },
  { id: "design", icon: <Palette size={20} />, label: "Design" },
  { id: "media", icon: <ImageIcon size={20} />, label: "Media" },
  { id: "history", icon: <History size={20} />, label: "History" },
];

interface EditorSidebarNavProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export function EditorSidebarNav({ activeView, onViewChange }: EditorSidebarNavProps) {
  return (
    <div className="flex flex-col w-14 bg-[#0a0a0a] border-r border-[#1f1f1f] py-3">
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-1 mx-1 rounded-md transition-colors",
              activeView === item.id
                ? "bg-[#1f1f1f] text-white"
                : "text-[#666] hover:text-white hover:bg-[#1f1f1f]/50"
            )}
            title={item.label}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
