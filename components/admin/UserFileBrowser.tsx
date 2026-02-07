"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileImage,
  FileVideo,
  Image,
  Code,
  Type,
  Database,
  Loader2,
  Trash2,
  Pencil,
  X,
  Save,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Braces,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

interface PortfolioFile {
  source: "portfolio";
  path: string;
  fullPath: string;
  url: string;
  size: number;
  uploadedAt: string;
  editable: boolean;
  category: string;
}

interface MediaFile {
  source: "media";
  id: string;
  path: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  size: number;
  mimeType: string;
  mediaType: string;
  uploadedAt: string;
  editable: false;
  category: string;
}

type UserFile = PortfolioFile | MediaFile;

interface UserFileBrowserProps {
  userId: string;
  subdomain: string | null;
}

// =====================================================
// Helpers
// =====================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFileIcon(file: UserFile) {
  if (file.source === "media") {
    return file.mediaType === "video" ? FileVideo : FileImage;
  }

  switch (file.category) {
    case "markup":
      return FileCode;
    case "style":
      return Code;
    case "script":
      return Braces;
    case "data":
      return Database;
    case "image":
      return Image;
    case "font":
      return Type;
    case "text":
      return FileText;
    default:
      return File;
  }
}

function getIconColor(file: UserFile): string {
  if (file.source === "media") {
    return file.mediaType === "video" ? "text-purple-500" : "text-pink-500";
  }

  switch (file.category) {
    case "markup":
      return "text-orange-500";
    case "style":
      return "text-blue-500";
    case "script":
      return "text-yellow-600";
    case "data":
      return "text-green-500";
    case "image":
      return "text-pink-500";
    case "font":
      return "text-warm-gray-500";
    case "text":
      return "text-warm-gray-500";
    default:
      return "text-warm-gray-400";
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    markup: "HTML",
    style: "CSS",
    script: "JavaScript",
    data: "Data",
    image: "Images",
    font: "Fonts",
    text: "Text",
    video: "Video",
    other: "Other",
  };
  return labels[category] || category;
}

// Build a tree structure from flat file paths
interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  file: UserFile | null;
}

function buildFileTree(files: UserFile[]): TreeNode {
  const root: TreeNode = { name: "/", path: "", children: [], file: null };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children.push({
          name: part,
          path: file.path,
          children: [],
          file,
        });
      } else {
        let child = current.children.find(
          (c) => c.name === part && c.file === null
        );
        if (!child) {
          child = {
            name: part,
            path: parts.slice(0, i + 1).join("/"),
            children: [],
            file: null,
          };
          current.children.push(child);
        }
        current = child;
      }
    }
  }

  // Sort: folders first, then files alphabetically
  function sortTree(node: TreeNode) {
    node.children.sort((a, b) => {
      const aIsDir = a.file === null;
      const bIsDir = b.file === null;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortTree);
  }
  sortTree(root);

  return root;
}

// =====================================================
// Sub-Components
// =====================================================

function FileTreeNode({
  node,
  depth,
  onSelect,
  onDelete,
  selectedPath,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (file: UserFile) => void;
  onDelete: (file: UserFile) => void;
  selectedPath: string | null;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.file === null;
  const isSelected = node.file && node.path === selectedPath;

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md text-sm hover:bg-warm-gray-50 transition-colors group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown size={14} className="text-warm-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-warm-gray-400 flex-shrink-0" />
          )}
          <FolderOpen
            size={15}
            className={`flex-shrink-0 ${expanded ? "text-amber-500" : "text-amber-400"}`}
          />
          <span className="text-warm-gray-700 truncate font-medium">
            {node.name}
          </span>
          <span className="text-warm-gray-300 text-xs ml-auto flex-shrink-0">
            {node.children.length}
          </span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                onDelete={onDelete}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const file = node.file!;
  const Icon = getFileIcon(file);
  const iconColor = getIconColor(file);

  return (
    <div
      className={`flex items-center gap-1.5 py-1 px-2 rounded-md text-sm cursor-pointer transition-colors group ${
        isSelected
          ? "bg-coral/8 text-coral"
          : "hover:bg-warm-gray-50 text-warm-gray-600"
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect(file)}
    >
      <div className="w-[14px] flex-shrink-0" />
      <Icon size={15} className={`flex-shrink-0 ${isSelected ? "text-coral" : iconColor}`} />
      <span className="truncate flex-1">{node.name}</span>
      <span className="text-warm-gray-300 text-xs flex-shrink-0 mr-1">
        {formatBytes(file.size)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file);
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-warm-gray-300 hover:text-red-500 transition-all flex-shrink-0"
        title="Delete file"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function FileEditor({
  file,
  userId,
  onClose,
  onSaved,
}: {
  file: UserFile;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/users/${userId}/files/content?path=${encodeURIComponent(file.path)}`
        );
        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json();
        setContent(data.content);
        setOriginalContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [file.path, userId]);

  const hasChanges = content !== originalContent;

  const handleSave = useCallback(async () => {
    if (content === null || content === originalContent) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/users/${userId}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.path, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setOriginalContent(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [content, originalContent, userId, file.path, onSaved]);

  // Keyboard shortcut: Cmd/Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saving) handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChanges, saving, handleSave]);

  const lineCount = content?.split("\n").length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-gray-200 bg-warm-gray-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={16} className="text-warm-gray-500 flex-shrink-0" />
          <span className="text-sm font-mono text-warm-gray-700 truncate">
            {file.path}
          </span>
          {hasChanges && (
            <span className="w-2 h-2 rounded-full bg-coral flex-shrink-0" title="Unsaved changes" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={12} />
              Saved
            </span>
          )}
          {error && (
            <span className="text-xs text-red-500 max-w-[200px] truncate">{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-warm-gray-800 text-white rounded-md text-xs font-medium hover:bg-warm-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Save
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-warm-gray-400 hover:text-warm-gray-600 rounded-md hover:bg-warm-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-warm-gray-400" />
        </div>
      ) : error && content === null ? (
        <div className="flex-1 flex items-center justify-center text-warm-gray-500 text-sm">
          {error}
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          {/* Line numbers + textarea */}
          <div className="absolute inset-0 flex overflow-auto">
            <div className="flex-shrink-0 py-3 px-2 bg-warm-gray-50 border-r border-warm-gray-100 select-none">
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className="text-[11px] font-mono text-warm-gray-300 text-right leading-[20px] px-1"
                  style={{ minWidth: "2.5rem" }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={content || ""}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 p-3 font-mono text-[13px] leading-[20px] text-warm-gray-800 bg-white resize-none focus:outline-none border-none"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      )}

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-warm-gray-200 bg-warm-gray-50/50 text-xs text-warm-gray-400">
        <span>{lineCount} lines</span>
        <span className="font-mono">
          {file.path.includes(".") ? file.path.split(".").pop()?.toUpperCase() : "TXT"}
        </span>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: UserFile }) {
  const isImage =
    file.category === "image" ||
    (file.source === "media" && file.mediaType === "image");
  const isVideo = file.source === "media" && file.mediaType === "video";

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-gray-200 bg-warm-gray-50/50">
        <div className="flex items-center gap-2 min-w-0">
          {(() => {
            const Icon = getFileIcon(file);
            return <Icon size={16} className={getIconColor(file)} />;
          })()}
          <span className="text-sm font-mono text-warm-gray-700 truncate">
            {file.path}
          </span>
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-coral hover:text-coral/80"
        >
          Open <ExternalLink size={12} />
        </a>
      </div>

      {/* Preview Body */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[repeating-conic-gradient(#f5f3f0_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
        {isImage ? (
          <img
            src={file.source === "media" && (file as MediaFile).thumbnailUrl
              ? (file as MediaFile).thumbnailUrl!
              : file.url}
            alt={file.path}
            className="max-w-full max-h-[400px] object-contain rounded-md shadow-sm"
          />
        ) : isVideo ? (
          <video
            src={file.url}
            controls
            className="max-w-full max-h-[400px] rounded-md shadow-sm"
          />
        ) : (
          <div className="text-center text-warm-gray-400">
            <File size={48} className="mx-auto mb-3" />
            <p className="text-sm font-medium">No preview available</p>
            <p className="text-xs mt-1">{formatBytes(file.size)}</p>
          </div>
        )}
      </div>

      {/* Preview Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-warm-gray-200 bg-warm-gray-50/50 text-xs text-warm-gray-400">
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.uploadedAt)}</span>
      </div>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function UserFileBrowser({ userId, subdomain }: UserFileBrowserProps) {
  const [portfolioFiles, setPortfolioFiles] = useState<PortfolioFile[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [editingFile, setEditingFile] = useState<UserFile | null>(null);
  const [activeTab, setActiveTab] = useState<"portfolio" | "media">("portfolio");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<UserFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/files`);
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setPortfolioFiles(data.portfolio || []);
      setMediaFiles(data.media || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleSelectFile = (file: UserFile) => {
    if (file.editable) {
      setEditingFile(file);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
      setEditingFile(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const body: Record<string, string> = { source: deleteTarget.source };
      if (deleteTarget.source === "portfolio") {
        body.path = deleteTarget.path;
        body.url = deleteTarget.url;
      } else {
        body.id = (deleteTarget as MediaFile).id;
      }

      const res = await fetch(`/api/admin/users/${userId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      // Remove from local state
      if (deleteTarget.source === "portfolio") {
        setPortfolioFiles((prev) => prev.filter((f) => f.path !== deleteTarget.path));
      } else {
        setMediaFiles((prev) => prev.filter((f) => f.id !== (deleteTarget as MediaFile).id));
      }

      // Clear selection if we deleted the active file
      if (selectedFile?.path === deleteTarget.path) setSelectedFile(null);
      if (editingFile?.path === deleteTarget.path) setEditingFile(null);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const currentFiles = activeTab === "portfolio" ? portfolioFiles : mediaFiles;
  const tree = useMemo(() => buildFileTree(currentFiles), [currentFiles]);

  const totalPortfolioSize = portfolioFiles.reduce((s, f) => s + f.size, 0);
  const totalMediaSize = mediaFiles.reduce((s, f) => s + f.size, 0);

  const activeFile = editingFile || selectedFile;

  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-warm-gray-200">
        <div className="flex items-center gap-2.5">
          <HardDrive size={18} className="text-warm-gray-500" />
          <h3 className="text-base font-semibold text-warm-gray-900">
            User Files
          </h3>
          {!loading && (
            <span className="text-xs text-warm-gray-400 bg-warm-gray-50 px-2 py-0.5 rounded-full">
              {portfolioFiles.length + mediaFiles.length} files · {formatBytes(totalPortfolioSize + totalMediaSize)}
            </span>
          )}
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-warm-gray-500 hover:text-warm-gray-700 hover:bg-warm-gray-50 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-gray-200">
        <button
          onClick={() => {
            setActiveTab("portfolio");
            setSelectedFile(null);
            setEditingFile(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "portfolio"
              ? "border-coral text-coral"
              : "border-transparent text-warm-gray-500 hover:text-warm-gray-700"
          }`}
        >
          <FileCode size={15} />
          Site Files
          <span className="text-xs bg-warm-gray-100 text-warm-gray-500 px-1.5 py-0.5 rounded-full">
            {portfolioFiles.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("media");
            setSelectedFile(null);
            setEditingFile(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "media"
              ? "border-coral text-coral"
              : "border-transparent text-warm-gray-500 hover:text-warm-gray-700"
          }`}
        >
          <Image size={15} />
          Media Library
          <span className="text-xs bg-warm-gray-100 text-warm-gray-500 px-1.5 py-0.5 rounded-full">
            {mediaFiles.length}
          </span>
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-warm-gray-300" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-warm-gray-500">
          <AlertTriangle size={24} className="mb-2 text-amber-400" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchFiles}
            className="mt-2 text-xs text-coral hover:text-coral/80"
          >
            Retry
          </button>
        </div>
      ) : currentFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-warm-gray-400">
          <FolderOpen size={32} className="mb-3" />
          <p className="text-sm font-medium">
            {activeTab === "portfolio"
              ? subdomain
                ? "No site files uploaded yet"
                : "No subdomain configured"
              : "No media files uploaded yet"}
          </p>
        </div>
      ) : (
        <div className="flex" style={{ minHeight: "400px", maxHeight: "600px" }}>
          {/* File Tree Sidebar */}
          <div className="w-72 flex-shrink-0 border-r border-warm-gray-200 overflow-y-auto bg-white">
            <div className="py-1">
              {tree.children.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  onSelect={handleSelectFile}
                  onDelete={setDeleteTarget}
                  selectedPath={activeFile?.path || null}
                />
              ))}
            </div>

            {/* Storage summary */}
            <div className="px-3 py-2.5 border-t border-warm-gray-100 mt-auto">
              <div className="text-xs text-warm-gray-400">
                {activeTab === "portfolio" ? (
                  <>
                    {portfolioFiles.length} files · {formatBytes(totalPortfolioSize)}
                  </>
                ) : (
                  <>
                    {mediaFiles.length} files · {formatBytes(totalMediaSize)}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {editingFile ? (
              <FileEditor
                file={editingFile}
                userId={userId}
                onClose={() => setEditingFile(null)}
                onSaved={fetchFiles}
              />
            ) : selectedFile ? (
              <FilePreview file={selectedFile} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-warm-gray-400 px-6">
                <File size={36} className="mb-3" />
                <p className="text-sm font-medium">Select a file to preview</p>
                <p className="text-xs mt-1 text-center">
                  Click a text file to open the editor, or an image/binary file to preview it
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-warm-gray-900">Delete File</h4>
                  <p className="text-sm text-warm-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-warm-gray-50 rounded-lg px-3 py-2.5 mb-4">
                <p className="text-sm font-mono text-warm-gray-700 break-all">
                  {deleteTarget.path}
                </p>
                <p className="text-xs text-warm-gray-400 mt-1">
                  {deleteTarget.source === "portfolio" ? "Site file" : "Media file"} · {formatBytes(deleteTarget.size)}
                </p>
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 mb-3">{deleteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 bg-warm-gray-50 border-t border-warm-gray-200">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-warm-gray-600 hover:bg-warm-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
