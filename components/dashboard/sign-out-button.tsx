"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth/client";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      {isLoading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
