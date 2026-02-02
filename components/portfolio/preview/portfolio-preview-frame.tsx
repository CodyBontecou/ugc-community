"use client";

/**
 * Portfolio Preview Frame
 *
 * A Figma-like container for the portfolio preview with device controls,
 * zoom, and pan capabilities.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { PortfolioPreviewClient, type PortfolioPreviewClientProps } from "./portfolio-preview-client";

type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceConfig {
  width: number;
  height: number;
  label: string;
  icon: typeof Monitor;
}

const DEVICES: Record<DeviceType, DeviceConfig> = {
  desktop: { width: 1440, height: 900, label: "Desktop", icon: Monitor },
  tablet: { width: 768, height: 1024, label: "Tablet", icon: Tablet },
  mobile: { width: 375, height: 812, label: "Mobile", icon: Smartphone },
};

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

interface PortfolioPreviewFrameProps extends PortfolioPreviewClientProps {
  className?: string;
}

export function PortfolioPreviewFrame({
  className = "",
  ...previewProps
}: PortfolioPreviewFrameProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [zoom, setZoom] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const deviceConfig = DEVICES[device];

  // Calculate the scale to fit the preview in the container
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current) return 0.5;
    const containerWidth = containerRef.current.clientWidth - 80; // padding
    const containerHeight = containerRef.current.clientHeight - 80;
    const scaleX = containerWidth / deviceConfig.width;
    const scaleY = containerHeight / deviceConfig.height;
    return Math.min(scaleX, scaleY, 1);
  }, [deviceConfig.width, deviceConfig.height]);

  // Fit to container on device change
  useEffect(() => {
    const fitZoom = calculateFitZoom();
    setZoom(Math.round(fitZoom * 100) / 100);
  }, [device, calculateFitZoom]);

  // Zoom controls
  const handleZoomIn = () => {
    const currentIdx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    if (currentIdx < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIdx + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIdx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    if (currentIdx > 0) {
      setZoom(ZOOM_LEVELS[currentIdx - 1]);
    }
  };

  const handleFitToScreen = () => {
    setZoom(calculateFitZoom());
  };

  const handleResetZoom = () => {
    setZoom(0.5);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!frameRef.current) return;

    if (!isFullscreen) {
      frameRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      ref={frameRef}
      className={`flex flex-col h-full bg-warm-gray-100 ${className}`}
      style={{ minHeight: 0 }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-warm-gray-200 shrink-0">
        {/* Device Selector */}
        <div className="flex items-center gap-1 bg-warm-gray-100 rounded-lg p-1">
          {(Object.entries(DEVICES) as [DeviceType, DeviceConfig][]).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = device === key;
            return (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-white shadow-sm text-warm-gray-900"
                    : "text-warm-gray-500 hover:text-warm-gray-700"
                }`}
                title={config.label}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-md text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>

          <div className="flex items-center gap-1 min-w-[80px] justify-center">
            <input
              type="range"
              min={25}
              max={200}
              value={zoom * 100}
              onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
              className="w-16 h-1.5 bg-warm-gray-200 rounded-lg appearance-none cursor-pointer accent-coral"
            />
            <span className="text-xs text-warm-gray-500 min-w-[40px]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-md text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <div className="w-px h-5 bg-warm-gray-200 mx-1" />

          <button
            onClick={handleFitToScreen}
            className="p-1.5 rounded-md text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 transition-colors"
            title="Fit to screen"
          >
            <Maximize2 size={18} />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-md text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-100 transition-colors"
            title="Reset zoom"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Device Dimensions */}
        <div className="text-xs text-warm-gray-400 hidden md:block">
          {deviceConfig.width} × {deviceConfig.height}px
        </div>
      </div>

      {/* Preview Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-10"
        style={{
          background: `
            radial-gradient(circle, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          minHeight: 0,
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: deviceConfig.width * zoom,
            height: "auto",
            transition: "width 0.3s ease, height 0.3s ease",
          }}
        >
          {/* Device Frame */}
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: deviceConfig.width,
              minHeight: deviceConfig.height,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {/* Browser Chrome (for desktop) */}
            {device === "desktop" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-warm-gray-50 border-b border-warm-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white border border-warm-gray-200 rounded-md px-3 py-1 text-xs text-warm-gray-400">
                    https://ugc.community/creators/{previewProps.user.subdomain || "username"}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Notch */}
            {device === "mobile" && (
              <div className="flex justify-center py-2 bg-black">
                <div className="w-24 h-5 bg-black rounded-b-xl" />
              </div>
            )}

            {/* Preview Content */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: device === "desktop" ? "calc(100vh - 48px)" : deviceConfig.height - 40,
              }}
            >
              <PortfolioPreviewClient {...previewProps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
