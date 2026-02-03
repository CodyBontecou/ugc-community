"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Check,
  X,
  Globe,
  Copy,
  ExternalLink,
  History,
  Rocket,
  RotateCcw,
  Clock,
  CircleDot,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  html: string;
  onPublishSuccess: () => void;
  onHtmlChange?: (html: string) => void;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface Version {
  id: string;
  versionNumber: number;
  title: string | null;
  htmlContent: string;
  createdAt: string;
}

type TabType = "deploy" | "versions";

export function PublishDialog({
  open,
  onOpenChange,
  portfolioId,
  html,
  onPublishSuccess,
  onHtmlChange,
}: PublishDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("deploy");
  const [subdomain, setSubdomain] = useState("");
  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [deployedHtml, setDeployedHtml] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Version history
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [deployingVersionId, setDeployingVersionId] = useState<string | null>(null);

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ugc.community";
  const publishedUrl = currentSubdomain ? `https://${currentSubdomain}.${domain}` : null;

  // Check if current draft differs from deployed version
  const hasUndeployedChanges = deployedHtml !== null && html !== deployedHtml;

  // Fetch initial data
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      Promise.all([
        fetch("/api/user/subdomain").then(r => r.json()),
        fetch(`/api/portfolios/${portfolioId}`).then(r => r.json()),
      ])
        .then(([subdomainData, portfolioData]) => {
          if (subdomainData.subdomain) {
            setCurrentSubdomain(subdomainData.subdomain);
            setSubdomain(subdomainData.subdomain);
            setAvailabilityStatus("available");
          }
          if (portfolioData.isPublished) {
            setIsPublished(true);
            setDeployedHtml(portfolioData.htmlContent);
          }
        })
        .catch(err => {
          console.error("Error fetching data:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });

      // Fetch versions
      fetchVersions();
    }
  }, [open, portfolioId]);

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/versions`);
      const data = await response.json();
      if (data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Check subdomain availability with debounce
  useEffect(() => {
    if (!subdomain || subdomain === currentSubdomain) {
      if (subdomain === currentSubdomain && currentSubdomain) {
        setAvailabilityStatus("available");
        setAvailabilityMessage("This is your current subdomain");
      } else {
        setAvailabilityStatus("idle");
      }
      return;
    }

    const timer = setTimeout(async () => {
      setAvailabilityStatus("checking");
      setSuggestions([]);

      try {
        const response = await fetch(`/api/user/subdomain?check=${encodeURIComponent(subdomain)}`);
        const data = await response.json();

        if (data.available) {
          setAvailabilityStatus("available");
          setAvailabilityMessage("");
        } else {
          if (data.reason === "Already taken") {
            setAvailabilityStatus("taken");
          } else {
            setAvailabilityStatus("invalid");
          }
          setAvailabilityMessage(data.reason || "Not available");
          setSuggestions(data.suggestions || []);
        }
      } catch {
        setAvailabilityStatus("idle");
        setAvailabilityMessage("Error checking availability");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [subdomain, currentSubdomain]);

  // Deploy current draft
  const handleDeploy = useCallback(async () => {
    if (!subdomain || availabilityStatus !== "available") return;

    setIsPublishing(true);
    setError(null);

    try {
      // Step 1: Save the HTML content
      const htmlResponse = await fetch(`/api/portfolios/${portfolioId}/html`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: html }),
      });

      if (!htmlResponse.ok) {
        const err = await htmlResponse.json();
        throw new Error(err.error || "Failed to save portfolio");
      }

      // Step 2: Claim/update the subdomain (if changed)
      if (subdomain !== currentSubdomain) {
        const subdomainResponse = await fetch("/api/user/subdomain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain }),
        });

        if (!subdomainResponse.ok) {
          const err = await subdomainResponse.json();
          throw new Error(err.error || "Failed to claim subdomain");
        }

        setCurrentSubdomain(subdomain);
      }

      // Step 3: Mark portfolio as published
      const publishResponse = await fetch(`/api/portfolios/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });

      if (!publishResponse.ok) {
        const err = await publishResponse.json();
        throw new Error(err.error || "Failed to publish portfolio");
      }

      // Step 4: Create a version snapshot
      await fetch(`/api/portfolios/${portfolioId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: html,
          title: `Deployed ${new Date().toLocaleDateString()}`,
        }),
      });

      setDeployedHtml(html);
      setIsPublished(true);
      onPublishSuccess();

      // Refresh versions list
      fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy");
    } finally {
      setIsPublishing(false);
    }
  }, [subdomain, availabilityStatus, portfolioId, html, currentSubdomain, onPublishSuccess]);

  // Deploy a specific version (rollback)
  const handleDeployVersion = useCallback(async (version: Version) => {
    if (!currentSubdomain) {
      setError("Please set a subdomain first");
      setActiveTab("deploy");
      return;
    }

    setDeployingVersionId(version.id);
    setError(null);

    try {
      // Step 1: Update the portfolio's HTML content with the version's content
      const htmlResponse = await fetch(`/api/portfolios/${portfolioId}/html`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: version.htmlContent }),
      });

      if (!htmlResponse.ok) {
        const err = await htmlResponse.json();
        throw new Error(err.error || "Failed to deploy version");
      }

      // Step 2: Ensure portfolio is published
      const publishResponse = await fetch(`/api/portfolios/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });

      if (!publishResponse.ok) {
        const err = await publishResponse.json();
        throw new Error(err.error || "Failed to publish portfolio");
      }

      // Step 3: Create a new version snapshot for this deployment
      await fetch(`/api/portfolios/${portfolioId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: version.htmlContent,
          title: `Rolled back to v${version.versionNumber}`,
        }),
      });

      setDeployedHtml(version.htmlContent);
      setIsPublished(true);

      // Update the editor with the rolled-back content
      if (onHtmlChange) {
        onHtmlChange(version.htmlContent);
      }

      onPublishSuccess();
      fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy version");
    } finally {
      setDeployingVersionId(null);
    }
  }, [currentSubdomain, portfolioId, onHtmlChange, onPublishSuccess]);

  // Load version into editor (preview without deploying)
  const handleLoadVersion = useCallback((version: Version) => {
    if (onHtmlChange) {
      onHtmlChange(version.htmlContent);
    }
    onOpenChange(false);
  }, [onHtmlChange, onOpenChange]);

  const handleCopyUrl = useCallback(() => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publishedUrl]);

  const getStatusIcon = () => {
    switch (availabilityStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="h-4 w-4 text-green-500" />;
      case "taken":
      case "invalid":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const isVersionDeployed = (version: Version) => {
    return deployedHtml === version.htmlContent;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0a] border-[#1f1f1f] text-white p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Globe className="h-5 w-5" />
            <span className="text-white">Publish & Deploy</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Deploy your portfolio to your subdomain or rollback to a previous version.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-[#1f1f1f]">
          <button
            onClick={() => setActiveTab("deploy")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "deploy"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Rocket className="h-4 w-4" />
            Deploy
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "versions"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            Versions
            {versions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#1f1f1f] text-zinc-300 rounded">
                {versions.length}
              </span>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : (
          <>
            {/* Deploy Tab */}
            {activeTab === "deploy" && (
              <div className="p-6 space-y-4">
                {/* Status Banner */}
                {isPublished && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CircleDot className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm text-green-400 font-medium">Your portfolio is live</p>
                      {hasUndeployedChanges && (
                        <p className="text-xs text-yellow-400 mt-0.5">
                          You have undeployed changes
                        </p>
                      )}
                    </div>
                    {publishedUrl && (
                      <a
                        href={publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Subdomain input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Subdomain
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="yourname"
                        className="pr-8 bg-[#1f1f1f] border-[#333] text-white placeholder:text-zinc-500 focus-visible:ring-white/20"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {getStatusIcon()}
                      </div>
                    </div>
                    <span className="text-sm text-zinc-400 whitespace-nowrap">
                      .{domain}
                    </span>
                  </div>

                  {/* Availability message */}
                  {availabilityMessage && availabilityStatus !== "available" && (
                    <p className="text-sm text-red-400">
                      {availabilityMessage}
                    </p>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-400">Suggestions:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSubdomain(s)}
                            className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300 hover:text-white transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview URL */}
                {subdomain && availabilityStatus === "available" && (
                  <div className="p-3 bg-[#1f1f1f] rounded-lg border border-[#333]">
                    <p className="text-xs text-zinc-400 mb-1">
                      {isPublished ? "Your portfolio is live at:" : "Your portfolio will be live at:"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`https://${subdomain}.${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                      >
                        https://{subdomain}.{domain}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      <button
                        onClick={handleCopyUrl}
                        className="p-1.5 hover:bg-[#333] rounded transition-colors flex-shrink-0"
                        title="Copy URL"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Deploy Button */}
                <button
                  onClick={handleDeploy}
                  disabled={!subdomain || availabilityStatus !== "available" || isPublishing}
                  className="w-full h-10 px-4 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-400 disabled:border disabled:border-zinc-700"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : isPublished && !hasUndeployedChanges ? (
                    <>
                      <Check className="h-4 w-4" />
                      Up to date
                    </>
                  ) : isPublished ? (
                    <>
                      <Rocket className="h-4 w-4" />
                      Deploy Changes
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Deploy
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === "versions" && (
              <div className="flex flex-col">
                {isLoadingVersions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <History className="h-10 w-10 text-zinc-600 mb-3" />
                    <p className="text-sm text-zinc-400">No versions yet</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Versions are created when you deploy your portfolio
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[320px]">
                    <div className="p-4 space-y-2">
                      {versions.map((version, index) => {
                        const isDeployed = isVersionDeployed(version);
                        const isDeploying = deployingVersionId === version.id;

                        return (
                          <div
                            key={version.id}
                            className={`p-3 rounded-lg border transition-colors ${
                              isDeployed
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-[#1f1f1f] border-[#333] hover:border-[#444]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">
                                    v{version.versionNumber}
                                  </span>
                                  {isDeployed && (
                                    <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                                      Live
                                    </span>
                                  )}
                                  {index === 0 && !isDeployed && (
                                    <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                {version.title && (
                                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                    {version.title}
                                  </p>
                                )}
                                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {!isDeployed && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleLoadVersion(version)}
                                      className="h-8 px-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700"
                                      title="Load into editor"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeployVersion(version)}
                                      disabled={isDeploying || !currentSubdomain}
                                      className="h-8 px-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 disabled:opacity-100 disabled:text-zinc-500 disabled:border-zinc-800"
                                      title={currentSubdomain ? "Deploy this version" : "Set subdomain first"}
                                    >
                                      {isDeploying ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-4 pt-0">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
