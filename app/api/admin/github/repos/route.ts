import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  updated_at: string;
  owner: {
    login: string;
  };
}

interface GitHubRepoResponse {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current admin's GitHub access token
    const [user] = await db
      .select({
        githubAccessToken: users.githubAccessToken,
        githubUsername: users.githubUsername,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { error: "GitHub not connected", connected: false },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = Math.min(parseInt(searchParams.get("per_page") || "30", 10), 100);

    // Fetch repositories from GitHub API
    const githubUrl = new URL("https://api.github.com/user/repos");
    githubUrl.searchParams.set("page", String(page));
    githubUrl.searchParams.set("per_page", String(perPage));
    githubUrl.searchParams.set("sort", "updated");
    githubUrl.searchParams.set("direction", "desc");
    githubUrl.searchParams.set("affiliation", "owner,collaborator,organization_member");

    const response = await fetch(githubUrl.toString(), {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "GitHub token expired", connected: false },
          { status: 401 }
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter by search term if provided
    let filteredRepos = repos;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRepos = repos.filter(
        (repo) =>
          repo.full_name.toLowerCase().includes(searchLower) ||
          repo.name.toLowerCase().includes(searchLower)
      );
    }

    // Transform response
    const transformedRepos: GitHubRepoResponse[] = filteredRepos.map((repo) => ({
      id: repo.id,
      full_name: repo.full_name,
      name: repo.name,
      private: repo.private,
      updated_at: repo.updated_at,
    }));

    // Check if there are more pages (GitHub uses Link header)
    const linkHeader = response.headers.get("Link");
    const hasMore = linkHeader?.includes('rel="next"') ?? false;

    return NextResponse.json({
      repos: transformedRepos,
      hasMore,
      page,
      perPage,
    });
  } catch (error) {
    console.error("GitHub repos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
