/**
 * Types for the Interactive HTML Portfolio Editor
 */

// Message types for iframe communication
export interface SelectedElement {
  selector: string; // CSS selector path like "section:nth-child(2) > div > h2"
  content: string; // Current text/HTML content
  tagName: string; // "H2", "P", "A", etc.
  outerHtml: string; // Full element HTML for context
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface IframeMessage {
  type: "element-selected" | "element-hover" | "element-unhover" | "refresh-element" | "ready";
  payload?: SelectedElement | null;
}

// Quick actions for AI editing - Text
export type TextQuickAction =
  | "rewrite"
  | "shorten"
  | "expand"
  | "professional"
  | "casual"
  | "energetic";

// Quick actions for AI editing - Style
export type StyleQuickAction =
  | "bolder"
  | "larger"
  | "smaller"
  | "colorful"
  | "subtle"
  | "uppercase";

export type QuickAction = TextQuickAction | StyleQuickAction;

export const TEXT_QUICK_ACTIONS: TextQuickAction[] = [
  "rewrite",
  "shorten",
  "expand",
  "professional",
  "casual",
  "energetic",
];

export const STYLE_QUICK_ACTIONS: StyleQuickAction[] = [
  "bolder",
  "larger",
  "smaller",
  "colorful",
  "subtle",
  "uppercase",
];

export const QUICK_ACTION_LABELS: Record<QuickAction, string> = {
  // Text actions
  rewrite: "Rewrite",
  shorten: "Shorten",
  expand: "Expand",
  professional: "Professional",
  casual: "Casual",
  energetic: "Energetic",
  // Style actions
  bolder: "Bolder",
  larger: "Larger",
  smaller: "Smaller",
  colorful: "Colorful",
  subtle: "Subtle",
  uppercase: "Uppercase",
};

export const QUICK_ACTION_DESCRIPTIONS: Record<QuickAction, string> = {
  // Text actions
  rewrite: "Fresh wording, same meaning",
  shorten: "Make it more concise",
  expand: "Add more detail",
  professional: "Polished, formal tone",
  casual: "Friendly, conversational",
  energetic: "More excitement and energy",
  // Style actions
  bolder: "Increase font weight",
  larger: "Increase font size",
  smaller: "Decrease font size",
  colorful: "Add vibrant color",
  subtle: "Softer, muted styling",
  uppercase: "Transform to uppercase",
};

// AI Edit Request
export interface AIEditRequest {
  portfolioId: string;
  selector: string;
  currentContent: string;
  instruction: string;
  quickAction?: QuickAction;
  fullHtml: string;
  tagName: string;
}

// History state for undo/redo
export interface HistoryState {
  past: string[]; // Previous HTML states (max 50)
  present: string; // Current HTML
  future: string[]; // Undone states for redo
}

export const MAX_HISTORY_SIZE = 50;

// Section data for reordering
export interface SectionInfo {
  id: string;
  index: number;
  title: string;
  tagName: string;
  preview: string; // First 100 chars of text content
}

// Editor state
export interface EditorState {
  html: string;
  selectedElement: SelectedElement | null;
  isEditing: boolean;
  isStreaming: boolean;
  pendingEdit: string | null;
  history: HistoryState;
  isSaving: boolean;
  lastSaved: Date | null;
}
