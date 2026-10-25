import { boardBindings } from "@/lib/job-board/access";
import { listBoardJobs } from "@/lib/job-board/search";
import { PAY_LABELS, safeLink } from "@/lib/job-board/model";
import { informationMarkdown, informationPages } from "@/lib/agent-content/pages";

export const dynamic = "force-dynamic";
const escape = (value: string) => value.replace(/([\\`*_{}\[\]<>#!|])/g, "\\$1");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  let body: string;
  const page = path.slice(1);
  if (Object.hasOwn(informationPages, page)) {
    body = informationMarkdown(informationPages[page as keyof typeof informationPages]);
  } else if (path === "/" || path === "/jobs") {
    body = "# ugc.community — UGC jobs and creator opportunities\n\nFind reviewed external opportunities and directly posted UGC jobs. Free to browse without an account. Brands can submit jobs for free during launch. Creators can save a reusable profile and quick apply to email-enabled jobs. Other applications go to the original destination.\n\n";
    try {
      const result = await listBoardJobs((await boardBindings()).JOB_BOARD, {
        q: (url.searchParams.get("q") || "").slice(0, 100), source: url.searchParams.get("source") || "",
        pay: url.searchParams.get("pay") || "", page: Number(url.searchParams.get("page")) || 1,
      });
      body += `## Current opportunities\n\n${result.total} opportunities. Page ${result.page} of ${Math.max(1, Math.ceil(result.total / result.pageSize))}.\n\n`;
      if (!result.jobs.length) body += "No opportunities are available for this search. Try [clearing filters](https://ugc.community/jobs) or [submit a job](https://ugc.community/post-job).\n\n";
      for (const job of result.jobs) {
        body += `### ${escape(job.title)}\n\nCompany: ${escape(job.company)}\n\n${job.source_kind === "external" ? "External opportunity" : "Posted directly"} · ${PAY_LABELS[job.compensation_type]}\n\n${escape(job.description)}\n\nCompensation: ${escape(job.compensation_text)}\n\n`;
        for (const [label, value] of [["Deliverables", job.deliverables], ["Eligibility", job.eligibility], ["Usage rights", job.usage_rights], ["Closes (UTC)", job.closing_at], ["Originally posted", job.source_published_at || job.published_at], ["Reviewed", job.verified_at]]) body += `${label}: ${escape(value || "Not stated in the source")}\n\n`;
        const application = safeLink(job.application_url), source = job.source_url && safeLink(job.source_url);
        if (job.email_apply_enabled) body += `[Quick apply by email](https://ugc.community/jobs/${encodeURIComponent(job.id)}/apply)\n\n`;
        else if (application) body += `[Apply at original destination](${application.replace(/\(/g, "%28").replace(/\)/g, "%29")})\n\n`;
        if (source) body += `[Original source](${source.replace(/\(/g, "%28").replace(/\)/g, "%29")})\n\n`;
      }
      if (result.page * result.pageSize < result.total) {
        const next = new URLSearchParams(url.searchParams);
        next.delete("path"); next.set("page", String(result.page + 1));
        body += `[Next page](https://ugc.community/jobs?${next})\n\n`;
      }
    } catch {
      body += "## Feed temporarily unavailable\n\nCurrent opportunities could not be loaded. Please try again shortly; this does not mean there are no jobs.\n\n";
    }
    body += "## How the board works\n\nEvery listing is reviewed before publication. Compensation labels distinguish guaranteed cash, base plus variable, performance-only, affiliate, and gifted or unpaid opportunities. Missing terms are marked as not stated. External listings expire seven days after their last manual freshness review; all listings honor their closing date. Review does not guarantee payment or employer legitimacy.\n\n[Browse jobs](https://ugc.community/jobs) · [Post a job](https://ugc.community/post-job) · [Agent guide](https://ugc.community/guide) · [About](https://ugc.community/about) · [Contact](https://ugc.community/contact) · [Privacy](https://ugc.community/privacy) · [Terms](https://ugc.community/terms)\n";
  } else {
    return new Response("# Page not found\n\nUse the [agent guide](https://ugc.community/guide) to find public resources.\n", { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" } });
  }
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
