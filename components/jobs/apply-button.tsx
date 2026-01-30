"use client";

import { useState } from "react";
import { Check, Loader2, Heart } from "lucide-react";

interface ApplyButtonProps {
  jobId: string;
  hasApplied?: boolean;
  onApply?: () => void;
}

export function ApplyButton({ jobId, hasApplied = false, onApply }: ApplyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (applied || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
      });

      if (response.ok) {
        setApplied(true);
        onApply?.();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to apply");
      }
    } catch (err) {
      console.error("Error applying to job:", err);
      setError("Failed to apply");
    } finally {
      setIsLoading(false);
    }
  };

  if (applied) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 font-medium rounded-full cursor-default"
      >
        <Check size={18} />
        Interested
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleApply}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Heart size={18} />
        )}
        I'm Interested
      </button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
