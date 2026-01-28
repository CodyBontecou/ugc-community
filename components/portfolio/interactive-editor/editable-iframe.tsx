"use client";

import { useEffect, useRef, useCallback } from "react";
import { injectEditorScript } from "@/lib/editor/editor-injection-script";
import type { IframeMessage, SelectedElement } from "@/lib/editor/types";

interface EditableIframeProps {
  html: string;
  onElementSelect: (element: SelectedElement) => void;
  onElementHover?: (element: SelectedElement | null) => void;
  onElementRefresh?: (element: SelectedElement) => void;
  selectedSelector?: string | null;
  isRefreshLoading?: boolean;
  className?: string;
}

export function EditableIframe({
  html,
  onElementSelect,
  onElementHover,
  onElementRefresh,
  selectedSelector,
  isRefreshLoading = false,
  className = "",
}: EditableIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastHtmlRef = useRef<string>("");

  // Handle messages from iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin (same origin for srcdoc iframes)
      if (event.source !== iframeRef.current?.contentWindow) return;

      const message = event.data as IframeMessage;

      switch (message.type) {
        case "element-selected":
          if (message.payload) {
            onElementSelect(message.payload);
          }
          break;
        case "element-hover":
          onElementHover?.(message.payload || null);
          break;
        case "element-unhover":
          onElementHover?.(null);
          break;
        case "refresh-element":
          if (message.payload) {
            onElementRefresh?.(message.payload);
          }
          break;
        case "ready":
          // Iframe is ready, update selection if needed
          if (selectedSelector) {
            iframeRef.current?.contentWindow?.postMessage(
              { type: "update-selection", selector: selectedSelector },
              "*"
            );
          }
          break;
      }
    },
    [onElementSelect, onElementHover, onElementRefresh, selectedSelector]
  );

  // Set up message listener
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (!iframeRef.current || html === lastHtmlRef.current) return;

    const injectedHtml = injectEditorScript(html);
    lastHtmlRef.current = html;

    // Use srcdoc for better security and control
    iframeRef.current.srcdoc = injectedHtml;
  }, [html]);

  // Send deselection message when selector is cleared
  useEffect(() => {
    if (!selectedSelector && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "deselect" }, "*");
    }
  }, [selectedSelector]);

  // Send stop-loading message when refresh loading ends
  useEffect(() => {
    if (!isRefreshLoading && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "stop-loading" }, "*");
    }
  }, [isRefreshLoading]);

  return (
    <iframe
      ref={iframeRef}
      title="Portfolio Preview"
      className={`w-full h-full border-0 ${className}`}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
