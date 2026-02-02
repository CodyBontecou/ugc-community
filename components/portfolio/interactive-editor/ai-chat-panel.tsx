"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Copy, Check, X, Loader2 } from "lucide-react";

// AI Elements
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";


import type { SelectedElement } from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface SuggestionItem {
  title: string;
  description: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  thinkingTime?: number;
  suggestions?: SuggestionItem[];
}

interface AIChatPanelProps {
  selectedElement: SelectedElement | null;
  portfolioId: string;
  fullHtml: string;
  onApplyEdit: (newContent: string, isOuterHtml: boolean) => void;
  onFullPageGenerate: (newHtml: string) => void;
  onDeselect: () => void;
  isStreaming: boolean;
  onStreamingChange: (streaming: boolean) => void;
}

export function AIChatPanel({
  selectedElement,
  portfolioId,
  fullHtml,
  onApplyEdit,
  onFullPageGenerate,
  onDeselect,
  isStreaming,
  onStreamingChange,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamedContent, setStreamedContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const generateId = () => Math.random().toString(36).substring(7);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const thinkingMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isThinking: true,
      };

      setMessages((prev) => [...prev, userMessage, thinkingMessage]);
      setStreamedContent("");
      onStreamingChange(true);

      abortControllerRef.current = new AbortController();
      const startTime = Date.now();

      try {
        const isElementEdit =
          selectedElement &&
          !message.toLowerCase().includes("whole page") &&
          !message.toLowerCase().includes("entire page");

        if (isElementEdit) {
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

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `I've updated the ${getElementTypeName(selectedElement.tagName).toLowerCase()} based on your request. What would you like to change next?`,
            timestamp: new Date(),
            thinkingTime,
            suggestions: [
              { title: "Make it more prominent", description: "Increase size or emphasis" },
              { title: "Add animation", description: "Subtle transitions" },
              { title: "Change colors", description: "Try different colors" },
            ],
          };

          setMessages((prev) =>
            prev.filter((m) => !m.isThinking).concat(assistantMessage)
          );

          if (accumulated.trim()) {
            const trimmed = accumulated.trim();
            const tagName = selectedElement.tagName.toLowerCase();
            const isOuterHtml =
              trimmed.startsWith(`<${tagName}`) ||
              trimmed.startsWith(`<${tagName.toUpperCase()}`);
            onApplyEdit(trimmed, isOuterHtml);
          }
        } else {
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

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `I've made the requested changes to your portfolio. What would you like me to help you with next?`,
            timestamp: new Date(),
            thinkingTime,
            suggestions: [
              { title: "Add a new section", description: "Testimonials, FAQ, etc." },
              { title: "Update the hero", description: "Change headline or layout" },
              { title: "Improve the design", description: "Colors, spacing, typography" },
            ],
          };

          setMessages((prev) =>
            prev.filter((m) => !m.isThinking).concat(assistantMessage)
          );

          if (accumulated.trim()) {
            onFullPageGenerate(accumulated.trim());
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.filter((m) => !m.isThinking));
          return;
        }

        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.isThinking).concat(errorMessage)
        );
      } finally {
        onStreamingChange(false);
        setStreamedContent("");
        abortControllerRef.current = null;
      }
    },
    [selectedElement, portfolioId, fullHtml, onApplyEdit, onFullPageGenerate, onStreamingChange]
  );

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
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
    <div className="flex flex-col h-full dark">
      {/* Selected Element Indicator */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-green-950/50 border-b border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">
                  Editing: {getElementTypeName(selectedElement.tagName)}
                </span>
              </div>
              <button
                onClick={onDeselect}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
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
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-2">
              What would you like to build?
            </h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
              {selectedElement
                ? `Describe how you want to change the selected ${getElementTypeName(selectedElement.tagName).toLowerCase()}`
                : "Describe your changes or select an element to edit"}
            </p>
            
            {/* Initial suggestions */}
            <div className="mt-6">
              <Suggestions className="justify-center">
                <Suggestion
                  suggestion="Improve the design"
                  onClick={handleSuggestionClick}
                  className="bg-secondary text-secondary-foreground border-border"
                />
                <Suggestion
                  suggestion="Add a testimonials section"
                  onClick={handleSuggestionClick}
                  className="bg-secondary text-secondary-foreground border-border"
                />
                <Suggestion
                  suggestion="Make it more modern"
                  onClick={handleSuggestionClick}
                  className="bg-secondary text-secondary-foreground border-border"
                />
              </Suggestions>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.isThinking ? (
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            ) : (
              <Message from={message.role}>
                <MessageContent>
                  {message.thinkingTime && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                      <Sparkles size={12} />
                      <span>Thought for {message.thinkingTime}s</span>
                    </div>
                  )}
                  <MessageResponse>{message.content}</MessageResponse>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Suggestions>
                        {message.suggestions.map((suggestion, i) => (
                          <Suggestion
                            key={i}
                            suggestion={suggestion.title}
                            onClick={handleSuggestionClick}
                            disabled={isStreaming}
                            className="bg-secondary text-secondary-foreground border-border hover:bg-accent"
                          />
                        ))}
                      </Suggestions>
                    </div>
                  )}
                </MessageContent>
                
                {message.role === "assistant" && !message.isThinking && (
                  <MessageActions>
                    <MessageAction
                      tooltip="Copy"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            )}
          </div>
        ))}

        {/* Streaming preview */}
        {streamedContent && (
          <div className="text-muted-foreground text-xs">
            <p className="mb-2 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </p>
            <div className="max-h-32 overflow-hidden text-ellipsis bg-secondary/50 rounded p-2">
              <code className="text-[10px]">{streamedContent.slice(-500)}</code>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <PromptInput
          onSubmit={({ text }) => sendMessage(text)}
          className="bg-secondary rounded-xl"
        >
          <PromptInputTextarea
            placeholder={
              selectedElement
                ? `Describe changes for the ${getElementTypeName(selectedElement.tagName).toLowerCase()}...`
                : "Ask a follow-up..."
            }
            disabled={isStreaming}
            className="min-h-[60px] bg-transparent border-none focus:ring-0"
          />
          <PromptInputFooter>
            <PromptInputTools>
              {/* Add attachment button etc here if needed */}
            </PromptInputTools>
            {isStreaming ? (
              <PromptInputButton
                onClick={handleCancel}
                variant="destructive"
                size="icon-sm"
              >
                <X size={16} />
              </PromptInputButton>
            ) : (
              <PromptInputSubmit />
            )}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
