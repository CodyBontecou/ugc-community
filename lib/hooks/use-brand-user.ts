"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

interface UseBrandUserResult {
  isBrand: boolean;
  isLoading: boolean;
}

export function useBrandUser(): UseBrandUserResult {
  const { data: session, isPending } = useSession();
  const [isBrand, setIsBrand] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBrandStatus() {
      if (isPending) return;

      if (!session?.user) {
        setIsBrand(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setIsBrand(data.profile?.role === "brand");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkBrandStatus();
  }, [session, isPending]);

  return { isBrand, isLoading };
}
