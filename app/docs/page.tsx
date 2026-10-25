import type { Metadata } from "next";
import Link from "next/link";
import { informationPages } from "@/lib/agent-content/pages";
import { InformationPage } from "@/components/information-page";

export const metadata: Metadata = { title: "ugc.community API, MCP and CLI documentation", description: "Public read-only UGC jobs API, OpenAPI contract, MCP connection, and CLI usage. No authentication required.", alternates: { canonical: "/docs" } };
export default function DocsPage() {
  return <InformationPage name="docs"><section className="mt-10 space-y-6">
    <h2 className="text-3xl">Example requests</h2>
    <pre className="overflow-auto rounded-xl bg-warm-gray-900 p-5 text-sm text-white"><code>{`curl 'https://ugc.community/api/v1/jobs?q=skincare&pay=cash'\ncurl 'https://ugc.community/api/v1/jobs/JOB_ID'\n\ncurl https://ugc.community/mcp \\\n  -H 'Content-Type: application/json' \\\n  -H 'Accept: application/json, text/event-stream' \\\n  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'\n\nnpm install -g https://ugc.community/downloads/ugc-community-cli-1.0.1.tgz\nugc-jobs jobs --q skincare --pay cash --json`}</code></pre>
    <p>Connect an MCP host to <code>https://ugc.community/mcp</code> using Streamable HTTP. The tools are <code>search_jobs</code> and <code>get_job</code>. Both are read-only. No API key or OAuth is required.</p>
    <nav aria-label="Developer resources" className="flex flex-wrap gap-5 text-rose"><Link href="/openapi.json">OpenAPI specification</Link><Link href="/.well-known/mcp/server-card.json">MCP server card</Link><a href="/downloads/ugc-community-cli-1.0.1.tgz">Download the CLI</a><a href="https://github.com/CodyBontecou/ugc-community/tree/main/packages/cli">CLI source</a><Link href="/guide">Agent browsing guide</Link></nav>
    <p className="text-sm text-warm-gray-600">{informationPages.docs.description}</p>
  </section></InformationPage>;
}
