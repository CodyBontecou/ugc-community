"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Copy, Check, X, Loader2, ImageIcon } from "lucide-react";

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
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputHeader,
  PromptInputProvider,
  useProviderAttachments,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

import type { SelectedElement } from "@/lib/editor/types";
import { getElementTypeName } from "@/lib/editor/html-element-selector";

interface SuggestionItem {
  title: string;
  description: string;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  errorText?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  thinkingTime?: number;
  suggestions?: SuggestionItem[];
  reasoning?: string;
  toolCalls?: ToolCall[];
  attachments?: AttachmentData[];
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

// Inner component that uses the provider hooks
function AIChatPanelContent({
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
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Use provider for attachments and text input
  const { files: attachments, add: addAttachments, remove: removeAttachment, clear: clearAttachments } = useProviderAttachments();
  const { textInput } = usePromptInputController();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedContent]);

  const generateId = () => Math.random().toString(36).substring(7);

  const convertBlobUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 data after the data URL prefix
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() && attachments.length === 0) return;

      // Convert attachments to AttachmentData format for storing in message
      const messageAttachments: AttachmentData[] = attachments.map((a) => ({
        id: a.id,
        type: "file" as const,
        url: a.url || "",
        mediaType: a.mediaType,
        filename: a.filename,
      }));

      // Convert attachments to base64 for API
      const imageAttachments = await Promise.all(
        attachments
          .filter((a) => a.mediaType?.startsWith("image/"))
          .map(async (a) => {
            if (a.url) {
              const base64 = await convertBlobUrlToBase64(a.url);
              return base64 ? { mediaType: a.mediaType, data: base64 } : null;
            }
            return null;
          })
      );
      const validImages = imageAttachments.filter((img): img is { mediaType: string; data: string } => img !== null);

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp: new Date(),
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
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
      clearAttachments(); // Clear attachments after sending
      textInput.clear(); // Clear text input
      onStreamingChange(true);

      abortControllerRef.current = new AbortController();
      const startTime = Date.now();

      try {
        const isElementEdit =
          selectedElement &&
          !message.toLowerCase().includes("whole page") &&
          !message.toLowerCase().includes("entire page");

        // Create tool call for analyzing current state
        const analysisTool: ToolCall = {
          name: isElementEdit ? "analyze_element" : "analyze_page",
          input: isElementEdit 
            ? { selector: selectedElement?.selector, tagName: selectedElement?.tagName }
            : { action: "refine-html" },
          state: "input-available",
        };

        // Update message with tool call
        setMessages((prev) =>
          prev.map((m) =>
            m.isThinking
              ? { ...m, toolCalls: [analysisTool] }
              : m
          )
        );

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
              images: validImages.length > 0 ? validImages : undefined,
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
          let reasoning = "";

          // Update tool to show it's processing
          setMessages((prev) =>
            prev.map((m) =>
              m.isThinking && m.toolCalls
                ? {
                    ...m,
                    toolCalls: m.toolCalls.map((t) => ({ ...t, state: "output-available" as const, output: "Processing..." })),
                  }
                : m
            )
          );

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // Check for reasoning markers (if your API supports them)
            if (chunk.includes("<thinking>")) {
              const thinkStart = chunk.indexOf("<thinking>") + 10;
              const thinkEnd = chunk.indexOf("</thinking>");
              if (thinkEnd > thinkStart) {
                reasoning = chunk.substring(thinkStart, thinkEnd);
              }
            } else {
              accumulated += chunk;
            }
            
            setStreamedContent(accumulated);
          }

          const thinkingTime = Math.round((Date.now() - startTime) / 1000);

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `I've updated the ${getElementTypeName(selectedElement.tagName).toLowerCase()} based on your request. What would you like to change next?`,
            timestamp: new Date(),
            thinkingTime,
            reasoning: reasoning || undefined,
            toolCalls: [
              {
                ...analysisTool,
                state: "output-available",
                output: { status: "success", changes: "Applied edits" },
              },
            ],
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
              images: validImages.length > 0 ? validImages : undefined,
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
          let reasoning = "";

          // Update tool to show it's processing
          setMessages((prev) =>
            prev.map((m) =>
              m.isThinking && m.toolCalls
                ? {
                    ...m,
                    toolCalls: m.toolCalls.map((t) => ({ ...t, state: "output-available" as const, output: "Processing..." })),
                  }
                : m
            )
          );

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // Check for reasoning markers
            if (chunk.includes("<thinking>")) {
              const thinkStart = chunk.indexOf("<thinking>") + 10;
              const thinkEnd = chunk.indexOf("</thinking>");
              if (thinkEnd > thinkStart) {
                reasoning = chunk.substring(thinkStart, thinkEnd);
              }
            } else {
              accumulated += chunk;
            }
            
            setStreamedContent(accumulated);
          }

          const thinkingTime = Math.round((Date.now() - startTime) / 1000);

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `I've made the requested changes to your portfolio. What would you like me to help you with next?`,
            timestamp: new Date(),
            thinkingTime,
            reasoning: reasoning || undefined,
            toolCalls: [
              {
                ...analysisTool,
                state: "output-available",
                output: { status: "success", action: "Page updated" },
              },
            ],
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
    [selectedElement, portfolioId, fullHtml, onApplyEdit, onFullPageGenerate, onStreamingChange, attachments, clearAttachments, textInput]
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

  // Handle drag events for visual feedback
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        addAttachments(imageFiles);
      }
    }
  }, [addAttachments]);

  return (
    <div 
      className="flex flex-col h-full dark relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ImageIcon size={20} />
              <span>Drop images here</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            
            {/* Initial suggestions */}
            <div className="mt-6">
              <Suggestions className="justify-center flex-wrap gap-3">
                <Suggestion
                  suggestion="Improve the design"
                  onClick={handleSuggestionClick}
                  className="!border !border-solid !border-[#555] !bg-[#2a2a2a] hover:!bg-[#3a3a3a] hover:!border-[#777] text-white"
                />
                <Suggestion
                  suggestion="Add a testimonials section"
                  onClick={handleSuggestionClick}
                  className="!border !border-solid !border-[#555] !bg-[#2a2a2a] hover:!bg-[#3a3a3a] hover:!border-[#777] text-white"
                />
                <Suggestion
                  suggestion="Make it more modern"
                  onClick={handleSuggestionClick}
                  className="!border !border-solid !border-[#555] !bg-[#2a2a2a] hover:!bg-[#3a3a3a] hover:!border-[#777] text-white"
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
                  {/* Show tool calls while thinking */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mb-3">
                      {message.toolCalls.map((tool, idx) => (
                        <Tool key={idx} defaultOpen={true}>
                          <ToolHeader
                            title={tool.name}
                            type="tool-invocation"
                            state={tool.state}
                          />
                          <ToolContent>
                            <ToolInput input={tool.input} />
                            {tool.output && (
                              <ToolOutput output={tool.output} errorText={tool.errorText} />
                            )}
                          </ToolContent>
                        </Tool>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            ) : (
              <Message from={message.role}>
                <MessageContent>
                  {/* Show user attachments */}
                  {message.role === "user" && message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3">
                      <Attachments variant="grid">
                        {message.attachments.map((attachment) => (
                          <Attachment key={attachment.id} data={attachment}>
                            <AttachmentPreview />
                          </Attachment>
                        ))}
                      </Attachments>
                    </div>
                  )}

                  {/* Reasoning/Thinking Display */}
                  {message.reasoning && (
                    <Reasoning defaultOpen={false} duration={message.thinkingTime}>
                      <ReasoningTrigger />
                      <ReasoningContent>{message.reasoning}</ReasoningContent>
                    </Reasoning>
                  )}

                  {/* Tool Calls Display */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mb-3">
                      {message.toolCalls.map((tool, idx) => (
                        <Tool key={idx} defaultOpen={false}>
                          <ToolHeader
                            title={tool.name}
                            type="tool-invocation"
                            state={tool.state}
                          />
                          <ToolContent>
                            <ToolInput input={tool.input} />
                            {tool.output && (
                              <ToolOutput output={tool.output} errorText={tool.errorText} />
                            )}
                          </ToolContent>
                        </Tool>
                      ))}
                    </div>
                  )}

                  {message.thinkingTime && !message.reasoning && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                      <Sparkles size={12} />
                      <span>Thought for {message.thinkingTime}s</span>
                    </div>
                  )}
                  <MessageResponse>{message.content}</MessageResponse>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Suggestions className="flex-wrap gap-3">
                        {message.suggestions.map((suggestion, i) => (
                          <Suggestion
                            key={i}
                            suggestion={suggestion.title}
                            onClick={handleSuggestionClick}
                            disabled={isStreaming}
                            className="!border !border-solid !border-[#555] !bg-[#2a2a2a] hover:!bg-[#3a3a3a] hover:!border-[#777] text-white"
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
      <div 
        className="p-4 border-t border-border" 
        style={{ 
          ['--ring' as string]: 'transparent', 
          ['--tw-ring-color' as string]: 'transparent',
          ['--color-ring' as string]: 'transparent'
        }}
      >
        {/* Attachments Preview - now using provider state */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <Attachments variant="inline">
              {attachments.map((attachment) => (
                <Attachment
                  key={attachment.id}
                  data={{
                    id: attachment.id,
                    type: "file",
                    url: attachment.url || "",
                    mediaType: attachment.mediaType,
                    filename: attachment.filename,
                  }}
                  onRemove={() => removeAttachment(attachment.id)}
                >
                  <AttachmentPreview />
                  <AttachmentInfo />
                  <AttachmentRemove />
                </Attachment>
              ))}
            </Attachments>
          </div>
        )}

        <PromptInput
          onSubmit={({ text }) => {
            sendMessage(text);
          }}
          accept="image/*"
          multiple
          noFocusRing={true}
          className="bg-secondary rounded-xl [&_[data-slot=input-group]]:border-[#333] [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]:has(:focus-visible)]:shadow-none [&_[data-slot=input-group]:has(:focus-visible)]:border-[#333]"
        >
          <PromptInputHeader>
            {/* File input handler for PromptInputActionAddAttachments */}
          </PromptInputHeader>
          <PromptInputTextarea
            placeholder={
              selectedElement
                ? `Describe changes for the ${getElementTypeName(selectedElement.tagName).toLowerCase()}...`
                : "Ask a follow-up..."
            }
            disabled={isStreaming}
            className="min-h-[60px] bg-transparent !border-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!ring-transparent focus-visible:!border-transparent focus-visible:!shadow-none !outline-none"
          />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments label="Add images" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
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
              <PromptInputSubmit className="!bg-white !text-black hover:!bg-gray-200" />
            )}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

// Main export wraps everything in PromptInputProvider
export function AIChatPanel(props: AIChatPanelProps) {
  return (
    <PromptInputProvider>
      <AIChatPanelContent {...props} />
    </PromptInputProvider>
  );
}
