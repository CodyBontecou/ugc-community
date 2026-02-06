"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileArchive,
  FileCode,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

interface PortfolioUploadDropzoneProps {
  userId: string;
  subdomain: string | null;
  siteEnabled: boolean;
  onUploadComplete?: () => void;
}

interface UploadResult {
  success: boolean;
  filesUploaded?: number;
  filesDeleted?: number;
  skippedFiles?: string[];
  siteUrl?: string;
  uploadedFiles?: string[];
  error?: string;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

// =====================================================
// Helpers
// =====================================================

const ACCEPTED_EXTENSIONS = [
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".webmanifest",
  ".xml",
  ".txt",
  ".zip",
];

function getFileIcon(filename: string) {
  if (filename.endsWith(".zip")) return FileArchive;
  return FileCode;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =====================================================
// Component
// =====================================================

export function PortfolioUploadDropzone({
  userId,
  subdomain,
  siteEnabled,
  onUploadComplete,
}: PortfolioUploadDropzoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Prevent default drag behaviors
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("dragging");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if we're leaving the dropzone entirely
    if (
      dropzoneRef.current &&
      !dropzoneRef.current.contains(e.relatedTarget as Node)
    ) {
      setState((prev) => (prev === "dragging" ? "idle" : prev));
    }
  }, []);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setStagedFiles(files);
    setResult(null);
    setErrorMessage(null);
    setState("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setStagedFiles([]);
    setResult(null);
    setErrorMessage(null);
    setState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (stagedFiles.length === 0) return;

    setState("uploading");
    setResult(null);
    setErrorMessage(null);

    const formData = new FormData();
    for (const file of stagedFiles) {
      formData.append("files", file);
    }
    if (replaceExisting) {
      formData.append("replace", "true");
    }

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/portfolio-upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: UploadResult = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        setState("success");
        onUploadComplete?.();
      } else {
        setErrorMessage(data.error || "Upload failed");
        setState("error");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
      setState("error");
    }
  }, [stagedFiles, replaceExisting, userId, onUploadComplete]);

  // No subdomain configured
  if (!subdomain) {
    return (
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            Portfolio Upload
          </h3>
        </div>
        <div className="rounded-xl border-2 border-dashed border-warm-gray-200 p-8 text-center">
          <AlertTriangle
            size={32}
            className="mx-auto text-amber-400 mb-3"
          />
          <p className="text-warm-gray-600 font-medium">
            Subdomain required
          </p>
          <p className="text-sm text-warm-gray-400 mt-1">
            Configure a subdomain for this user before uploading a portfolio.
          </p>
        </div>
      </div>
    );
  }

  const totalSize = stagedFiles.reduce((sum, f) => sum + f.size, 0);
  const hasZip = stagedFiles.some((f) => f.name.endsWith(".zip"));

  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            Portfolio Upload
          </h3>
        </div>
        {siteEnabled && (
          <a
            href={`https://${subdomain}.ugc.community`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-coral hover:text-coral/80 flex items-center gap-1"
          >
            View live site
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Dropzone */}
      <div
        ref={dropzoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          state !== "uploading" && fileInputRef.current?.click()
        }
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          state === "dragging"
            ? "border-coral bg-coral/5 scale-[1.01]"
            : state === "uploading"
              ? "border-warm-gray-300 bg-warm-gray-50 cursor-wait"
              : "border-warm-gray-200 hover:border-warm-gray-300 hover:bg-warm-gray-50/50"
        } p-8`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={state === "uploading"}
        />

        <div className="text-center">
          {state === "dragging" ? (
            <>
              <div className="w-14 h-14 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-3">
                <Upload size={28} className="text-coral" />
              </div>
              <p className="text-coral font-semibold text-lg">
                Drop files here
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-warm-gray-100 flex items-center justify-center mx-auto mb-3">
                <Upload size={28} className="text-warm-gray-400" />
              </div>
              <p className="text-warm-gray-700 font-medium">
                Drag &amp; drop portfolio files here
              </p>
              <p className="text-sm text-warm-gray-400 mt-1">
                or click to browse — accepts .zip, .html, .css, .js, images,
                fonts
              </p>
            </>
          )}
        </div>
      </div>

      {/* Staged Files List */}
      {stagedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-warm-gray-700">
              {stagedFiles.length} file{stagedFiles.length !== 1 ? "s" : ""}{" "}
              selected
              <span className="text-warm-gray-400 font-normal ml-1">
                ({formatFileSize(totalSize)})
              </span>
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-sm text-warm-gray-400 hover:text-red-500 transition-colors"
              disabled={state === "uploading"}
            >
              Clear all
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-warm-gray-100 p-2">
            {stagedFiles.map((file, idx) => {
              const Icon = getFileIcon(file.name);
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-warm-gray-50 group"
                >
                  <Icon size={16} className="text-warm-gray-400 flex-shrink-0" />
                  <span className="text-sm text-warm-gray-700 truncate flex-1">
                    {file.name}
                  </span>
                  <span className="text-xs text-warm-gray-400 flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-warm-gray-400 hover:text-red-500 transition-all"
                    disabled={state === "uploading"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                disabled={state === "uploading"}
                className="rounded border-warm-gray-300 text-coral focus:ring-coral/20"
              />
              <span className="text-sm text-warm-gray-600">
                Replace existing portfolio files
              </span>
            </label>
          </div>

          {hasZip && (
            <p className="text-xs text-warm-gray-400 flex items-center gap-1">
              <FileArchive size={12} />
              Zip files will be extracted automatically
            </p>
          )}

          {/* Upload Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={state === "uploading" || stagedFiles.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-warm-gray-800 text-white rounded-lg text-sm font-medium hover:bg-warm-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "uploading" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading to {subdomain}.ugc.community…
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload to {subdomain}.ugc.community
              </>
            )}
          </button>
        </div>
      )}

      {/* Success */}
      {state === "success" && result && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800">
                Portfolio deployed successfully!
              </p>
              <p className="text-sm text-green-700 mt-1">
                {result.filesUploaded} file
                {result.filesUploaded !== 1 ? "s" : ""} uploaded
                {result.filesDeleted
                  ? ` (${result.filesDeleted} old files replaced)`
                  : ""}
              </p>

              {result.skippedFiles && result.skippedFiles.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Skipped: {result.skippedFiles.join(", ")}
                </p>
              )}

              {result.uploadedFiles && (
                <details className="mt-2">
                  <summary className="text-xs text-green-600 cursor-pointer hover:text-green-700">
                    View uploaded files
                  </summary>
                  <ul className="mt-1 space-y-0.5">
                    {result.uploadedFiles.map((f) => (
                      <li
                        key={f}
                        className="text-xs text-green-600 font-mono pl-3"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex items-center gap-3 mt-3">
                {result.siteUrl && (
                  <a
                    href={result.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900"
                  >
                    <ExternalLink size={14} />
                    View Site
                  </a>
                )}
                <button
                  onClick={clearAll}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Upload another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {state === "error" && errorMessage && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Upload failed</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              <button
                onClick={() => {
                  setState("idle");
                  setErrorMessage(null);
                }}
                className="text-sm text-red-600 hover:text-red-700 mt-2 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
