"use client";

import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ComponentProps, ButtonHTMLAttributes } from "react";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn("flex w-max flex-nowrap items-center gap-2", className)}>
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  variant?: string;
  size?: string;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant,
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <button
      className={cn(
        "cursor-pointer rounded-full px-4 py-2 text-sm font-medium",
        "border border-solid border-[#444] bg-[#1a1a1a]",
        "shadow-sm hover:shadow-md",
        "hover:bg-[#2a2a2a] hover:border-[#666]",
        "active:scale-[0.98]",
        "transition-all duration-150 ease-in-out",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      type="button"
      {...props}
    >
      {children || suggestion}
    </button>
  );
};
