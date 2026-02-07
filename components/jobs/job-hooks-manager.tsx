"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Check,
  Pencil,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";

interface HookRow {
  id: string;
  hookText: string;
  screenshotUrl: string | null;
  sortOrder: number;
}

interface JobHooksManagerProps {
  jobId: string;
}

export function JobHooksManager({ jobId }: JobHooksManagerProps) {
  const [hooks, setHooks] = useState<HookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline add state
  const [isAdding, setIsAdding] = useState(false);
  const [newHookText, setNewHookText] = useState("");
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHookText, setEditHookText] = useState("");
  const [editScreenshotUrl, setEditScreenshotUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // CSV import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newHookInputRef = useRef<HTMLInputElement>(null);

  const fetchHooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/hooks`);
      if (res.ok) {
        const data = await res.json();
        setHooks(data.hooks);
      } else {
        setError("Failed to load hooks");
      }
    } catch {
      setError("Failed to load hooks");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchHooks();
  }, [fetchHooks]);

  // Focus the input when "Add Row" is clicked
  useEffect(() => {
    if (isAdding && newHookInputRef.current) {
      newHookInputRef.current.focus();
    }
  }, [isAdding]);

  // --- Add ---
  const handleAdd = async () => {
    if (!newHookText.trim()) return;
    setIsSavingNew(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/hooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hookText: newHookText.trim(),
          screenshotUrl: newScreenshotUrl.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHooks((prev) => [...prev, data.hook]);
        setNewHookText("");
        setNewScreenshotUrl("");
        setIsAdding(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add hook");
      }
    } catch {
      setError("Failed to add hook");
    } finally {
      setIsSavingNew(false);
    }
  };

  // --- Edit ---
  const startEdit = (hook: HookRow) => {
    setEditingId(hook.id);
    setEditHookText(hook.hookText);
    setEditScreenshotUrl(hook.screenshotUrl || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditHookText("");
    setEditScreenshotUrl("");
  };

  const saveEdit = async () => {
    if (!editingId || !editHookText.trim()) return;
    setIsSavingEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/hooks/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hookText: editHookText.trim(),
          screenshotUrl: editScreenshotUrl.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHooks((prev) =>
          prev.map((h) => (h.id === editingId ? data.hook : h))
        );
        cancelEdit();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update hook");
      }
    } catch {
      setError("Failed to update hook");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Delete ---
  const handleDelete = async (hookId: string) => {
    setDeletingId(hookId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/hooks/${hookId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHooks((prev) => prev.filter((h) => h.id !== hookId));
      } else {
        setError("Failed to delete hook");
      }
    } catch {
      setError("Failed to delete hook");
    } finally {
      setDeletingId(null);
    }
  };

  // --- CSV Import ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string);
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await fetch(
        `/api/admin/jobs/${jobId}/hooks/import?mode=${importMode}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: csvText,
        }
      );
      const data = await res.json();
      if (res.ok) {
        setImportResult(`Successfully imported ${data.imported} hook${data.imported !== 1 ? "s" : ""}`);
        await fetchHooks();
        // Close modal after a short delay so user can see the result
        setTimeout(() => {
          setShowImportModal(false);
          setCsvText("");
          setImportResult(null);
          setImportMode("append");
        }, 1500);
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-warm-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-warm-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-coral" />
            Hooks &amp; Screenshots
          </h3>
          <p className="text-sm text-warm-gray-500 mt-0.5">
            Add hooks and optional reference screenshots for creators to use as inspiration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-warm-gray-600 bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] hover:bg-warm-gray-100 transition-colors"
          >
            <Upload size={14} />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-coral rounded-[--radius-md] hover:bg-coral/90 transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            Add Row
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[--radius-md] px-4 py-2 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-warm-gray-200 rounded-[--radius-lg] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
              <th className="text-left text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-4 py-3 w-10">
                #
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-4 py-3">
                Hook Text
              </th>
              <th className="text-left text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-4 py-3 w-64">
                Screenshot URL
              </th>
              <th className="text-right text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-4 py-3 w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-100">
            {hooks.length === 0 && !isAdding && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-warm-gray-400">
                  No hooks yet. Add one manually or import from CSV.
                </td>
              </tr>
            )}

            {hooks.map((hook, i) => (
              <tr
                key={hook.id}
                className="group hover:bg-warm-gray-50/50 transition-colors"
              >
                {editingId === hook.id ? (
                  <>
                    <td className="px-4 py-2 text-sm text-warm-gray-400 align-top pt-3">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editHookText}
                        onChange={(e) => setEditHookText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-coral/30 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral bg-white"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editScreenshotUrl}
                        onChange={(e) => setEditScreenshotUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral bg-white"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={saveEdit}
                          disabled={isSavingEdit || !editHookText.trim()}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          {isSavingEdit ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-warm-gray-400 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-warm-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-gray-800">
                      {hook.hookText}
                    </td>
                    <td className="px-4 py-3">
                      {hook.screenshotUrl ? (
                        <a
                          href={hook.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-coral hover:text-coral/80 transition-colors"
                        >
                          <ImageIcon size={12} />
                          <span className="truncate max-w-[180px]">
                            {hook.screenshotUrl.replace(/^https?:\/\//, "")}
                          </span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-xs text-warm-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(hook)}
                          className="p-1.5 text-warm-gray-400 hover:text-coral hover:bg-coral/5 rounded-[--radius-md] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(hook.id)}
                          disabled={deletingId === hook.id}
                          className="p-1.5 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === hook.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Inline add row */}
            {isAdding && (
              <tr className="bg-coral/[0.02]">
                <td className="px-4 py-2 text-sm text-warm-gray-400 align-top pt-3">
                  {hooks.length + 1}
                </td>
                <td className="px-4 py-2">
                  <input
                    ref={newHookInputRef}
                    type="text"
                    value={newHookText}
                    onChange={(e) => setNewHookText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewHookText("");
                        setNewScreenshotUrl("");
                      }
                    }}
                    placeholder="Enter hook text..."
                    className="w-full px-3 py-1.5 text-sm border border-coral/30 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral bg-white"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewHookText("");
                        setNewScreenshotUrl("");
                      }
                    }}
                    placeholder="https://... (optional)"
                    className="w-full px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral bg-white"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleAdd}
                      disabled={isSavingNew || !newHookText.trim()}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      {isSavingNew ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewHookText("");
                        setNewScreenshotUrl("");
                      }}
                      className="p-1.5 text-warm-gray-400 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hook count */}
      {hooks.length > 0 && (
        <p className="text-xs text-warm-gray-400">
          {hooks.length} hook{hooks.length !== 1 ? "s" : ""} total
        </p>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-[--radius-xl] border border-warm-gray-200 shadow-xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-gray-100">
              <h4 className="text-base font-semibold text-warm-gray-900 flex items-center gap-2">
                <Upload size={18} className="text-coral" />
                Import Hooks from CSV
              </h4>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvText("");
                  setImportResult(null);
                }}
                className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded-[--radius-md] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-warm-gray-600 mb-3">
                  Upload a CSV file or paste CSV data below. Expected format:
                </p>
                <div className="bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] px-3 py-2 text-xs font-mono text-warm-gray-600">
                  hookText,screenshotUrl<br />
                  &quot;Try this product for 30 days&quot;,https://example.com/img.png<br />
                  &quot;POV: you found the best skincare routine&quot;,
                </div>
              </div>

              {/* File upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-50 border border-warm-gray-200 border-dashed rounded-[--radius-md] hover:bg-warm-gray-100 transition-colors w-full justify-center"
                >
                  <Upload size={16} />
                  Choose CSV file
                </button>
              </div>

              {/* Text area */}
              <div>
                <label className="block text-sm font-medium text-warm-gray-600 mb-1">
                  Or paste CSV data:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 text-sm font-mono border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral resize-none"
                  placeholder={`hookText,screenshotUrl\n"Your hook text here",https://...`}
                />
              </div>

              {/* Import mode */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-warm-gray-600">Mode:</label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                    className="text-coral focus:ring-coral/20"
                  />
                  <span className="text-warm-gray-700">Append</span>
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-coral focus:ring-coral/20"
                  />
                  <span className="text-warm-gray-700">Replace all</span>
                </label>
              </div>

              {importMode === "replace" && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[--radius-md] px-3 py-2 text-xs text-amber-700">
                  <AlertCircle size={14} />
                  This will delete all existing hooks and replace them with the imported data.
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-[--radius-md] px-3 py-2 text-sm text-green-700">
                  <Check size={14} />
                  {importResult}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-warm-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvText("");
                  setImportResult(null);
                }}
                className="px-4 py-2 text-sm text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !csvText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-coral rounded-[--radius-md] hover:bg-coral/90 transition-colors disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
