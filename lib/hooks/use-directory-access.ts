"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

interface UseDirectoryAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  isBrand: boolean;
  isAdmin: boolean;
}

export function useDirectoryAccess(): UseDirectoryAccessResult {
  const { data: session, isPending } = useSession();
  const [hasAccess, setHasAccess] = useState(false);
  const [isBrand, setIsBrand] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (isPending) return;

      if (!session?.user) {
        setHasAccess(false);
        setIsBrand(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          const userIsBrand = data.profile?.role === "brand";
          const userIsAdmin = data.profile?.isAdmin === true;
          setIsBrand(userIsBrand);
          setIsAdmin(userIsAdmin);
          setHasAccess(userIsBrand || userIsAdmin);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [session, isPending]);

  return { hasAccess, isLoading, isBrand, isAdmin };
}
