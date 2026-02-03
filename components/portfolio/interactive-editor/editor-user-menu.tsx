"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Settings, LogOut, User, ExternalLink } from "lucide-react";

interface EditorUserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
  };
}

export function EditorUserMenu({ user }: EditorUserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-full transition-transform hover:scale-105">
          <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-white/20 transition-all">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-[#1a1a1a] border-[#333] text-white"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{user.name}</p>
            <p className="text-xs leading-none text-[#888]">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#333]" />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer text-[#ccc] hover:text-white focus:text-white focus:bg-[#2a2a2a]"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="cursor-pointer text-[#ccc] hover:text-white focus:text-white focus:bg-[#2a2a2a]"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {user.username && (
          <DropdownMenuItem
            onClick={() => window.open(`/portfolio/${user.username}`, "_blank")}
            className="cursor-pointer text-[#ccc] hover:text-white focus:text-white focus:bg-[#2a2a2a]"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>View Live Site</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-[#333]" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
