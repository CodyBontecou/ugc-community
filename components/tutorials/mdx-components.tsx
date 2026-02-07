"use client";

import { useState, type ReactNode } from "react";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Info,
} from "lucide-react";

/* ─── Callout ─── */
type CalloutVariant = "tip" | "warning" | "info" | "success";

const calloutStyles: Record<
  CalloutVariant,
  { bg: string; border: string; icon: ReactNode; label: string }
> = {
  tip: {
    bg: "bg-amber-50/60",
    border: "border-amber-200/60",
    icon: <Lightbulb size={18} className="text-amber-600 flex-shrink-0" />,
    label: "Pro Tip",
  },
  warning: {
    bg: "bg-red-50/60",
    border: "border-red-200/60",
    icon: (
      <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
    ),
    label: "Heads Up",
  },
  info: {
    bg: "bg-sky-50/60",
    border: "border-sky-200/60",
    icon: <Info size={18} className="text-sky-600 flex-shrink-0" />,
    label: "Note",
  },
  success: {
    bg: "bg-emerald-50/60",
    border: "border-emerald-200/60",
    icon: (
      <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
    ),
    label: "Done",
  },
};

export function Callout({
  variant = "tip",
  children,
}: {
  variant?: CalloutVariant;
  children: ReactNode;
}) {
  const style = calloutStyles[variant];
  return (
    <div
      className={`${style.bg} ${style.border} border rounded-[--radius-md] p-4 my-6`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray-500 block mb-1">
            {style.label}
          </span>
          <div className="text-sm text-warm-gray-700 [&>p]:m-0 [&>p+p]:mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Checklist ─── */
export function Checklist({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 space-y-2" role="list">
      {children}
    </div>
  );
}

export function ChecklistItem({
  children,
}: {
  children: ReactNode;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <label
      role="listitem"
      className={`flex items-start gap-3 p-3 rounded-[--radius-md] border cursor-pointer transition-all select-none ${
        checked
          ? "bg-emerald-50/40 border-emerald-200/60"
          : "bg-white border-warm-gray-200 hover:border-warm-gray-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          checked
            ? "bg-emerald-500 border-emerald-500"
            : "border-warm-gray-300"
        }`}
      >
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </div>
      <span
        className={`text-sm leading-relaxed ${
          checked
            ? "text-warm-gray-400 line-through"
            : "text-warm-gray-700"
        }`}
      >
        {children}
      </span>
    </label>
  );
}

/* ─── Step ─── */
export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative pl-12 pb-8 last:pb-0">
      {/* connector line */}
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-warm-gray-200 last:hidden" />
      {/* number badge */}
      <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-bold shadow-sm">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-warm-gray-900 mb-2 !mt-0.5 font-[family-name:var(--font-body)]">
        {title}
      </h3>
      <div className="text-sm text-warm-gray-600 [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3">
        {children}
      </div>
    </div>
  );
}

/* ─── CodeBlock with copy button ─── */
export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-[--radius-md] overflow-hidden border border-warm-gray-200">
      {language && (
        <div className="bg-warm-gray-100 px-4 py-1.5 text-xs font-mono text-warm-gray-500 border-b border-warm-gray-200">
          {language}
        </div>
      )}
      <pre className="bg-warm-gray-50 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-warm-gray-800">{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-warm-gray-100/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-warm-gray-200"
        aria-label="Copy code"
      >
        {copied ? (
          <Check size={14} className="text-emerald-600" />
        ) : (
          <Copy size={14} className="text-warm-gray-500" />
        )}
      </button>
    </div>
  );
}

/* ─── Highlight box for key stats / numbers ─── */
export function Highlight({
  emoji,
  title,
  children,
}: {
  emoji?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-coral/5 to-rose/5 border border-coral/15 rounded-[--radius-md] p-4 my-4">
      <div className="flex items-center gap-2 mb-1">
        {emoji && <span className="text-lg">{emoji}</span>}
        <span className="text-sm font-semibold text-warm-gray-900">
          {title}
        </span>
      </div>
      <div className="text-sm text-warm-gray-600 [&>p]:m-0">
        {children}
      </div>
    </div>
  );
}
