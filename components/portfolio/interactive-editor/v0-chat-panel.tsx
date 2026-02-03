"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Plus,
  ChevronDown,
  Instagram,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import type { SelectedElement, QuickAction } from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface Suggestion {
  title: string;
  description: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  thinkingTime?: number;
  suggestions?: Suggestion[];
  question?: string;
}

interface V0ChatPanelProps {
  selectedElement: SelectedElement | null;
  portfolioId: string;
  fullHtml: string;
  onApplyEdit: (newContent: string, isOuterHtml: boolean) => void;
  onFullPageGenerate: (newHtml: string) => void;
  onDeselect: () => void;
  isStreaming: boolean;
  onStreamingChange: (streaming: boolean) => void;
}

export function V0ChatPanel({
  selectedElement,
  portfolioId,
  fullHtml,
  onApplyEdit,
  onFullPageGenerate,
  onDeselect,
  isStreaming,
  onStreamingChange,
}: V0ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const generateId = () => Math.random().toString(36).substring(7);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const thinkingMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isThinking: true,
      };

      setMessages((prev) => [...prev, userMessage, thinkingMessage]);
      setInput("");
      setError(null);
      setStreamedContent("");
      onStreamingChange(true);

      abortControllerRef.current = new AbortController();
      const startTime = Date.now();

      try {
        // Determine if this is an element edit or a full page request
        const isElementEdit = selectedElement && !message.toLowerCase().includes("whole page") && !message.toLowerCase().includes("entire page");

        if (isElementEdit) {
          // Edit selected element
          const response = await fetch("/api/ai/edit-element", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portfolioId,
              selector: selectedElement.selector,
              currentContent: selectedElement.content,
              outerHtml: selectedElement.outerHtml,
              instruction: message,
              fullHtml,
              tagName: selectedElement.tagName,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate edit");
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response stream");

          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            setStreamedContent(accumulated);
          }

          const thinkingTime = Math.round((Date.now() - startTime) / 1000);

          // Create assistant response
          const assistantMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: `That looks great! I've updated the ${getElementTypeName(selectedElement.tagName).toLowerCase()} based on your request.\n\nWhat would you like me to help you with next? Here are some ideas:`,
            timestamp: new Date(),
            thinkingTime,
            question: "What would you like me to help you build?",
            suggestions: [
              { title: "Make it more prominent", description: "Increase size, add emphasis, or use bolder colors" },
              { title: "Add some animation", description: "Subtle transitions or hover effects" },
              { title: "Change the color scheme", description: "Try different colors or gradients" },
            ],
          };

          setMessages((prev) =>
            prev.filter((m) => !m.isThinking).concat(assistantMessage)
          );

          // Auto-apply the edit
          if (accumulated.trim()) {
            const trimmed = accumulated.trim();
            const tagName = selectedElement.tagName.toLowerCase();
            const isOuterHtml =
              trimmed.startsWith(`<${tagName}`) ||
              trimmed.startsWith(`<${tagName.toUpperCase()}`);
            onApplyEdit(trimmed, isOuterHtml);
          }
        } else {
          // Full page generation request - use refine-html action
          const response = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "refine-html",
              currentHtml: fullHtml,
              feedback: message,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to generate");
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response stream");

          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            setStreamedContent(accumulated);
          }

          const thinkingTime = Math.round((Date.now() - startTime) / 1000);

          const assistantMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: `I've made the requested changes to your portfolio. The updates have been applied to the preview.\n\nWhat would you like me to help you with next? Here are some ideas based on your portfolio:`,
            timestamp: new Date(),
            thinkingTime,
            question: "What would you like me to help you build?",
            suggestions: [
              { title: "Media Kit / Portfolio Site", description: "Showcase your work, brand partnerships, and audience stats" },
              { title: "Link-in-Bio Page", description: "A custom landing page with links to your content and products" },
              { title: "Personal Brand Website", description: "A full site with your story, services, and contact form" },
            ],
          };

          setMessages((prev) =>
            prev.filter((m) => !m.isThinking).concat(assistantMessage)
          );

          // Apply full page update
          if (accumulated.trim()) {
            onFullPageGenerate(accumulated.trim());
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.filter((m) => !m.isThinking));
          return;
        }

        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.isThinking).concat(errorMessage)
        );
        setError(err instanceof Error ? err.message : "Failed to generate");
      } finally {
        onStreamingChange(false);
        setStreamedContent("");
        abortControllerRef.current = null;
      }
    },
    [selectedElement, portfolioId, fullHtml, onApplyEdit, onFullPageGenerate, onStreamingChange]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    sendMessage(suggestion.title);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    onStreamingChange(false);
    setMessages((prev) => prev.filter((m) => !m.isThinking));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Selected Element Indicator */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-[#1a2f1a] border-b border-[#1f1f1f]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-400">
                  Editing: {getElementTypeName(selectedElement.tagName)}
                </span>
              </div>
              <button
                onClick={onDeselect}
                className="p-1 text-[#666] hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[#666] mt-1 truncate">
              {selectedElement.content?.slice(0, 100)}
              {(selectedElement.content?.length || 0) > 100 ? "..." : ""}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-[#999]" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              What would you like to build?
            </p>
            <p className="text-sm text-[#aaa] max-w-[250px] mx-auto">
              {selectedElement
                ? `Describe how you want to change the selected ${getElementTypeName(selectedElement.tagName).toLowerCase()}`
                : "Describe your changes or select an element to edit"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" ? (
              <div className="border-l-2 border-[#333] pl-4 py-1 mb-4">
                <p className="text-[#ccc] text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            ) : message.isThinking ? (
              <div className="flex items-center gap-2 text-[#666]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {message.thinkingTime && (
                  <div className="flex items-center gap-2 text-[#666] text-xs">
                    <Sparkles size={12} />
                    <span>Thought for {message.thinkingTime}s</span>
                  </div>
                )}
                <div className="text-[#ccc] text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="space-y-3 pt-3 mt-3 border-t border-[#1f1f1f]">
                    {message.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isStreaming}
                        className="w-full text-left group disabled:opacity-50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[#666] text-sm font-medium shrink-0">{i + 1}.</span>
                          <div>
                            <span className="text-white text-sm font-medium group-hover:underline">
                              {suggestion.title}
                            </span>
                            <span className="text-[#666] text-sm"> - {suggestion.description}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="p-1.5 text-[#666] hover:text-white transition-colors"
                    title="Copy"
                  >
                    {copiedId === message.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming preview */}
        {streamedContent && (
          <div className="text-[#666] text-xs">
            <p className="mb-2">Generating...</p>
            <div className="max-h-32 overflow-hidden text-ellipsis">
              <code className="text-[10px]">{streamedContent.slice(-500)}</code>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1f1f1f]">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up..."
              disabled={isStreaming}
              rows={1}
              className="w-full px-4 py-3 pr-24 bg-[#1f1f1f] text-white placeholder-[#999] rounded-xl resize-none focus:outline-none focus:ring-0 text-sm"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-[#666] hover:text-white transition-colors"
                title="Attach"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                className="p-2 text-[#666] hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram size={18} />
              </button>
              <button
                type="button"
                className="p-2 text-[#666] hover:text-white transition-colors"
              >
                <ChevronDown size={18} />
              </button>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
                >
                  <X size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 !bg-white !text-black rounded-lg hover:!bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Messages remaining indicator */}
        <div className="flex items-center justify-between mt-3 text-xs text-[#666]">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⚠</span>
            <span>4 messages left today.</span>
          </div>
          <button className="text-green-500 hover:underline">Upgrade Plan</button>
        </div>
      </div>
    </div>
  );
}
