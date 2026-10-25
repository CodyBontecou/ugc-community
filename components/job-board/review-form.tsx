"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PAY_LABELS, PAY_TYPES, type BoardJob } from "@/lib/job-board/model";

export function ReviewForm({ job }: { job: BoardJob }) {
  const [error, setError] = useState(""), [pending, setPending] = useState(false);
  const router = useRouter();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "").trim();
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    setPending(true); setError("");
    try {
      const response = await fetch("/api/job-board/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id: job.id, expectedUpdatedAt: job.updated_at, action, company: value("company"), title: value("title"), description: value("description"),
        compensationType: value("compensationType"), compensationText: value("compensationText"), cashAmount: value("cashAmount") ? Number(value("cashAmount")) : null,
        deliverables: value("deliverables"), eligibility: value("eligibility"), usageRights: value("usageRights"), applicationUrl: value("applicationUrl"), applicationEmail: value("applicationEmail"),
        closingAt: value("closingDate") ? `${value("closingDate")}T23:59:59.000Z` : null, campaignKey: value("campaignKey"), notes: value("notes"), verified: form.get("verified") === "on",
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review failed");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Review failed"); }
    finally { setPending(false); }
  }
  const input = "block w-full mt-1 rounded-xl border border-warm-gray-200 bg-white px-3 py-2 font-normal";
  return <form onSubmit={save} className="mt-5 grid gap-4 text-sm">
    <div className="grid sm:grid-cols-2 gap-4"><label>Company<input name="company" defaultValue={job.company} maxLength={160} className={input} /></label><label>Title<input name="title" defaultValue={job.title} maxLength={200} className={input} /></label></div>
    <label>Reviewed summary / description<textarea name="description" defaultValue={job.description} maxLength={job.source_kind === "external" ? 1000 : 12000} rows={3} className={input} /></label>
    <div className="grid sm:grid-cols-2 gap-4"><label>Pay type<select name="compensationType" defaultValue={job.compensation_type} className={input}>{PAY_TYPES.map(type => <option key={type} value={type}>{PAY_LABELS[type]}</option>)}</select></label><label>Guaranteed cash amount<input name="cashAmount" type="number" min="0.01" step="0.01" defaultValue={job.cash_amount || ""} className={input} /></label></div>
    <label>Compensation details<textarea name="compensationText" defaultValue={job.compensation_text} maxLength={2000} rows={2} className={input} /></label>
    {[["deliverables", "Deliverables", job.deliverables], ["eligibility", "Eligibility", job.eligibility], ["usageRights", "Usage rights", job.usage_rights]].map(([name, label, value]) => <label key={name}>{label}<textarea name={name} defaultValue={value} maxLength={3000} rows={2} className={input} /></label>)}
    <label>Application email (only when email applications are explicitly accepted)<input name="applicationEmail" type="email" defaultValue={job.application_email || ""} maxLength={254} className={input} /><span className="text-xs text-warm-gray-600">Leave blank for Reddit DMs or external forms. For external jobs this address must appear in the source brief.</span></label>
    <label>Original application destination<input name="applicationUrl" defaultValue={job.application_url} maxLength={2000} className={input} /></label>
    <div className="grid sm:grid-cols-2 gap-4"><label>Closing date (UTC, if stated)<input name="closingDate" type="date" defaultValue={job.closing_at?.slice(0, 10) || ""} className={input} /></label><label>Unique campaign identifier<input name="campaignKey" defaultValue={job.campaign_key || ""} maxLength={200} placeholder="brand-role-brief-2026-10" className={input} /></label></div>
    <label>Private review notes<textarea name="notes" defaultValue={job.review_notes} maxLength={3000} className={input} /></label>
    <label className="flex items-start gap-2"><input type="checkbox" name="verified" className="mt-1 accent-rose" /><span>I checked the employer, current application availability, pay terms, and destination. I reviewed duplicate campaigns. A source capture alone does not establish availability.</span></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={pending} name="action" value="publish" className="bg-gradient-to-r from-coral to-rose text-white rounded-full px-5 py-3 disabled:opacity-50">Approve / renew review</button><button disabled={pending} name="action" value="reject" className="border border-warm-gray-200 rounded-full px-5 py-3">Reject / duplicate</button><button disabled={pending} name="action" value="close" className="border border-warm-gray-200 rounded-full px-5 py-3">Close listing</button></div>
  </form>;
}
