// Vercel API Configuration
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional

const VERCEL_API_BASE = "https://api.vercel.com";

// =====================================================
// Types
// =====================================================

export interface Domain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: DomainVerification[];
  createdAt: number;
  updatedAt: number;
}

export interface DomainVerification {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

export interface DomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: DomainVerification[];
}

export type VerificationStatus = {
  verified: boolean;
  verification?: DomainVerification[];
};

export class VercelApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

// =====================================================
// Internal Helpers
// =====================================================

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function buildUrl(path: string): string {
  const url = new URL(path, VERCEL_API_BASE);
  if (VERCEL_TEAM_ID) {
    url.searchParams.set("teamId", VERCEL_TEAM_ID);
  }
  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new VercelApiError(
      error.error?.message || `Vercel API error: ${response.status}`,
      response.status,
      error.error?.code
    );
  }
  return response.json();
}

// =====================================================
// Domain Management Functions
// =====================================================

/**
 * Add a domain to a Vercel project
 * POST /v10/projects/{projectId}/domains
 */
export async function addDomain(
  projectId: string,
  domain: string
): Promise<DomainResponse> {
  const response = await fetch(
    buildUrl(`/v10/projects/${projectId}/domains`),
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );

  return handleResponse<DomainResponse>(response);
}

/**
 * Remove a domain from a Vercel project
 * DELETE /v10/projects/{projectId}/domains/{domain}
 */
export async function removeDomain(
  projectId: string,
  domain: string
): Promise<void> {
  const response = await fetch(
    buildUrl(`/v10/projects/${projectId}/domains/${encodeURIComponent(domain)}`),
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new VercelApiError(
      error.error?.message || `Failed to remove domain: ${response.status}`,
      response.status,
      error.error?.code
    );
  }
}

/**
 * Get all domains for a Vercel project
 * GET /v10/projects/{projectId}/domains
 */
export async function getDomains(projectId: string): Promise<Domain[]> {
  const response = await fetch(
    buildUrl(`/v10/projects/${projectId}/domains`),
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await handleResponse<{ domains: Domain[] }>(response);
  return data.domains;
}

/**
 * Verify a domain's configuration status
 * GET /v10/projects/{projectId}/domains/{domain}
 */
export async function verifyDomain(
  projectId: string,
  domain: string
): Promise<VerificationStatus> {
  const response = await fetch(
    buildUrl(`/v10/projects/${projectId}/domains/${encodeURIComponent(domain)}`),
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await handleResponse<Domain>(response);
  return {
    verified: data.verified,
    verification: data.verification,
  };
}

// =====================================================
// Git Repository Integration
// =====================================================

export interface GitRepository {
  type: "github" | "gitlab" | "bitbucket";
  repo: string;
  sourceless?: boolean;
  productionBranch?: string;
}

export interface ProjectGitConfig {
  repo: GitRepository | null;
}

/**
 * Link a GitHub repository to a Vercel project
 * PATCH /v9/projects/{projectId}
 */
export async function linkGitHubRepo(
  projectId: string,
  repoFullName: string
): Promise<ProjectGitConfig> {
  const response = await fetch(
    buildUrl(`/v9/projects/${projectId}`),
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        gitRepository: {
          type: "github",
          repo: repoFullName,
        },
      }),
    }
  );

  const data = await handleResponse<{ link?: GitRepository }>(response);
  return {
    repo: data.link || null,
  };
}

/**
 * Get project details including git repository configuration
 * GET /v9/projects/{projectId}
 */
export async function getProject(projectId: string): Promise<{
  id: string;
  name: string;
  link?: GitRepository;
}> {
  const response = await fetch(
    buildUrl(`/v9/projects/${projectId}`),
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return handleResponse<{
    id: string;
    name: string;
    link?: GitRepository;
  }>(response);
}
