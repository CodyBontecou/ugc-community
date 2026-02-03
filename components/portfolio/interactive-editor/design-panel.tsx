"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Settings2, Sparkles, ImageIcon, Video, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DesignSystem,
  ColorScheme,
  COLOR_SCHEMES,
  FONT_OPTIONS,
  SHADOW_PRESETS,
  DEFAULT_DESIGN_SYSTEM,
} from "@/lib/editor/design-system";
import { FontsPanel } from "./design-panels/fonts-panel";
import { ColorsPanel } from "./design-panels/colors-panel";
import { ShadowsPanel } from "./design-panels/shadows-panel";
import type { SelectedElement } from "@/lib/editor/types";
import { ElementPropertiesPanel } from "./design-panels/element-properties-panel";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputHeader,
} from "@/components/ai-elements/prompt-input";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
  type AttachmentData,
} from "@/components/ai-elements/attachments";

type Panel = "main" | "fonts" | "colors" | "shadows";

interface DesignPanelProps {
  designSystem: DesignSystem;
  onDesignSystemChange: (design: DesignSystem) => void;
  selectedElement: SelectedElement | null;
  onElementStyleChange: (selector: string, styles: Record<string, string>) => void;
  onElementContentChange: (selector: string, content: string) => void;
  onDeselect: () => void;
  onElementChat: (message: string) => void;
  isStreaming: boolean;
  onAddImage?: () => void;
  onAddVideo?: () => void;
}

export function DesignPanel({
  designSystem,
  onDesignSystemChange,
  selectedElement,
  onElementStyleChange,
  onElementContentChange,
  onDeselect,
  onElementChat,
  isStreaming,
  onAddImage,
  onAddVideo,
}: DesignPanelProps) {
  const [activePanel, setActivePanel] = useState<Panel>("main");
  const [elementChatInput, setElementChatInput] = useState("");
  const [chatAttachments, setChatAttachments] = useState<AttachmentData[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const generateId = () => Math.random().toString(36).substring(7);

  const handleRemoveAttachment = useCallback((id: string) => {
    setChatAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.type === "file" && found.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
        const newAttachments: AttachmentData[] = imageFiles.map((file) => ({
          id: generateId(),
          type: "file" as const,
          url: URL.createObjectURL(file),
          mediaType: file.type,
          filename: file.name,
        }));
        setChatAttachments((prev) => [...prev, ...newAttachments]);
      }
    }
  }, []);

  const handleFontChange = (fonts: DesignSystem["fonts"]) => {
    onDesignSystemChange({ ...designSystem, fonts });
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    onDesignSystemChange({ ...designSystem, colors: scheme });
  };

  const handleRadiusChange = (value: number[]) => {
    onDesignSystemChange({ ...designSystem, radius: value[0] });
  };

  const handleShadowChange = (shadows: DesignSystem["shadows"]) => {
    onDesignSystemChange({ ...designSystem, shadows });
  };

  const handleShadowPresetClick = (preset: keyof typeof SHADOW_PRESETS) => {
    const presetValues = SHADOW_PRESETS[preset];
    onDesignSystemChange({
      ...designSystem,
      shadows: {
        preset: preset as DesignSystem["shadows"]["preset"],
        ...presetValues,
      },
    });
  };

  const handleElementChatSubmit = () => {
    if (elementChatInput.trim() && selectedElement) {
      onElementChat(elementChatInput);
      setElementChatInput("");
    }
  };

  // If element is selected, show element properties panel
  if (selectedElement) {
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
        
        <ElementPropertiesPanel
          selectedElement={selectedElement}
          designSystem={designSystem}
          onStyleChange={(styles) =>
            onElementStyleChange(selectedElement.selector, styles)
          }
          onContentChange={(content) =>
            onElementContentChange(selectedElement.selector, content)
          }
          onDeselect={onDeselect}
        />
        
        {/* Element Chat Input */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <Settings2 size={12} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground">
              {selectedElement.tagName.toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 px-1">
            Save before refining this element
          </p>
          
          {/* Attachments Preview */}
          {chatAttachments.length > 0 && (
            <div className="mb-3">
              <Attachments variant="inline">
                {chatAttachments.map((attachment) => (
                  <Attachment
                    key={attachment.id}
                    data={attachment}
                    onRemove={() => handleRemoveAttachment(attachment.id)}
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
            onSubmit={({ text, files }) => {
              // Handle any additional files from paste
              if (files && files.length > 0) {
                const newAttachments: AttachmentData[] = files.map((file) => ({
                  id: generateId(),
                  type: "file" as const,
                  url: file.url || "",
                  mediaType: file.mediaType,
                  filename: file.filename,
                }));
                setChatAttachments((prev) => [...prev, ...newAttachments]);
              }
              if (text?.trim()) {
                onElementChat(text);
                setElementChatInput("");
                setChatAttachments([]);
              }
            }}
            accept="image/*"
            multiple
            className="bg-secondary rounded-xl"
          >
            <PromptInputHeader />
            <PromptInputTextarea
              placeholder="Refine this element..."
              disabled={isStreaming}
              value={elementChatInput}
              onChange={(e) => setElementChatInput(e.target.value)}
              className="min-h-[40px] bg-transparent border-none focus:ring-0 text-sm"
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
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full dark overflow-hidden relative"
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
      <AnimatePresence mode="wait">
        {activePanel === "main" ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-blue-600/20 rounded text-blue-400 text-xs font-medium flex items-center gap-1">
                    <Settings2 size={12} />
                    Page
                  </div>
                  <span className="text-muted-foreground">/</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Fonts Section */}
              <div>
                <button
                  onClick={() => setActivePanel("fonts")}
                  className="w-full flex items-center justify-between py-2 text-sm text-foreground hover:text-foreground/80 transition-colors"
                >
                  <span>Fonts</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
                <Select
                  value={designSystem.fonts.sans}
                  onValueChange={(value) =>
                    handleFontChange({ ...designSystem.fonts, sans: value })
                  }
                >
                  <SelectTrigger className="w-full bg-[#1f1f1f] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.sans.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colors Section */}
              <div>
                <button
                  onClick={() => setActivePanel("colors")}
                  className="w-full flex items-center justify-between py-2 text-sm text-foreground hover:text-foreground/80 transition-colors"
                >
                  <span>Colors</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
                <div className="flex gap-0.5 rounded-md overflow-hidden">
                  <div
                    className="h-10 flex-1"
                    style={{ backgroundColor: designSystem.colors.colors.background }}
                  />
                  <div
                    className="h-10 flex-1"
                    style={{ backgroundColor: designSystem.colors.colors.secondary }}
                  />
                  <div
                    className="h-10 flex-1"
                    style={{ backgroundColor: designSystem.colors.colors.muted }}
                  />
                  <div
                    className="h-10 flex-1"
                    style={{ backgroundColor: designSystem.colors.colors.primary }}
                  />
                  <div
                    className="h-10 flex-1"
                    style={{ backgroundColor: designSystem.colors.colors.accent }}
                  />
                </div>
              </div>

              {/* Radius Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-foreground">Radius</span>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[designSystem.radius]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={handleRadiusChange}
                      className="w-32"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {designSystem.radius.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shadows Section */}
              <div>
                <button
                  onClick={() => setActivePanel("shadows")}
                  className="w-full flex items-center justify-between py-2 text-sm text-foreground hover:text-foreground/80 transition-colors"
                >
                  <span>Shadows</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {(["small", "medium", "large"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleShadowPresetClick(preset)}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        designSystem.shadows.preset === preset
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="w-6 h-4 bg-muted-foreground/20 rounded-sm" />
                      <span className="text-xs capitalize">{preset}</span>
                    </button>
                  ))}
                  {(["none", "glow", "solid"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleShadowPresetClick(preset)}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        designSystem.shadows.preset === preset
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="w-6 h-4 bg-muted-foreground/20 rounded-sm" />
                      <span className="text-xs capitalize">{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Media Section */}
              <div>
                <label className="text-sm text-foreground mb-3 block">Add Media</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onAddImage}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
                  >
                    <ImageIcon size={18} className="text-muted-foreground" />
                    <span className="text-sm">Add Image</span>
                  </button>
                  <button
                    onClick={onAddVideo}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-blue-500 hover:bg-blue-500/10 transition-colors"
                  >
                    <Video size={18} className="text-muted-foreground" />
                    <span className="text-sm">Add Video</span>
                  </button>
                </div>
              </div>

              {/* Select Component Button */}
              <div className="pt-4">
                <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                  Select a component
                </button>
              </div>
            </div>
          </motion.div>
        ) : activePanel === "fonts" ? (
          <FontsPanel
            key="fonts"
            fonts={designSystem.fonts}
            onFontsChange={handleFontChange}
            onBack={() => setActivePanel("main")}
          />
        ) : activePanel === "colors" ? (
          <ColorsPanel
            key="colors"
            colorScheme={designSystem.colors}
            onColorSchemeChange={handleColorSchemeChange}
            onBack={() => setActivePanel("main")}
          />
        ) : (
          <ShadowsPanel
            key="shadows"
            shadows={designSystem.shadows}
            onShadowsChange={handleShadowChange}
            onBack={() => setActivePanel("main")}
          />
        )}
      </AnimatePresence>

      {/* Bottom Chat Input (when no element selected) */}
      {!selectedElement && activePanel === "main" && (
        <div className="p-4 border-t border-border mt-auto">
          {/* Attachments Preview */}
          {chatAttachments.length > 0 && (
            <div className="mb-3">
              <Attachments variant="inline">
                {chatAttachments.map((attachment) => (
                  <Attachment
                    key={attachment.id}
                    data={attachment}
                    onRemove={() => handleRemoveAttachment(attachment.id)}
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
            onSubmit={({ text, files }) => {
              // Handle any additional files from paste
              if (files && files.length > 0) {
                const newAttachments: AttachmentData[] = files.map((file) => ({
                  id: generateId(),
                  type: "file" as const,
                  url: file.url || "",
                  mediaType: file.mediaType,
                  filename: file.filename,
                }));
                setChatAttachments((prev) => [...prev, ...newAttachments]);
              }
              if (text?.trim()) {
                onElementChat(text);
                setChatAttachments([]);
              }
            }}
            accept="image/*"
            multiple
            className="bg-secondary rounded-xl"
          >
            <PromptInputHeader />
            <PromptInputTextarea
              placeholder="Describe your changes..."
              disabled={isStreaming}
              className="min-h-[40px] bg-transparent border-none focus:ring-0 text-sm"
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
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      )}
    </div>
  );
}
