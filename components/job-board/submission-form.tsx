"use client";
import { useState, type FormEvent } from "react";
import { PAY_LABELS, PAY_TYPES } from "@/lib/job-board/model";

export function SubmissionForm() {
  const [state, setState] = useState("idle"), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "").trim();
    setState("saving"); setError("");
    try {
      const body = Object.fromEntries(["contactEmail", "company", "title", "description", "compensationType", "compensationText", "deliverables", "eligibility", "usageRights", "applicationUrl"].map(key => [key, value(key)]));
      const response = await fetch("/api/job-board/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, cashAmount: value("cashAmount") ? Number(value("cashAmount")) : null, closingAt: `${value("closingDate")}T23:59:59.000Z` }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");
      setState("success");
    } catch (error) { setState("idle"); setError(error instanceof Error ? error.message : "Please try again"); }
  }
  const input = "block w-full border border-warm-gray-200 rounded-xl px-4 py-3 mt-2 bg-white font-normal";
  if (state === "success") return <div role="status" className="bg-white rounded-[28px] border border-warm-gray-200 p-10"><h2 className="text-3xl mb-4">Your job is in the review queue.</h2><p className="text-warm-gray-600 mb-5">It will appear in the feed after it passes our daily agent review. There’s no posting fee.</p><a href="/jobs" className="underline underline-offset-4">Back to opportunities</a></div>;
  return <form onSubmit={submit} className="bg-white rounded-[28px] border border-warm-gray-200 p-6 sm:p-10 space-y-6">
    <label className="block text-sm font-medium">Work email (private)<input name="contactEmail" type="email" autoComplete="email" required maxLength={254} className={input} /></label>
    <div className="grid sm:grid-cols-2 gap-5">{[["company", "Brand / company", 160], ["title", "Job title", 200]].map(([key, label, max]) => <label key={key} className="text-sm font-medium">{label}<input name={String(key)} required maxLength={Number(max)} className={input} /></label>)}</div>
    <label className="block text-sm font-medium">Job description<textarea name="description" required maxLength={12000} rows={5} className={input} /></label>
    <div className="grid sm:grid-cols-2 gap-5"><label className="text-sm font-medium">Compensation type<select name="compensationType" className={input}>{PAY_TYPES.filter(type => type !== "unspecified").map(type => <option key={type} value={type}>{PAY_LABELS[type]}</option>)}</select></label><label className="text-sm font-medium">Guaranteed cash amount (if applicable)<input name="cashAmount" type="number" min="0.01" max="10000000" step="0.01" className={input} /><span className="block text-xs font-normal text-warm-gray-600 mt-2">Required for guaranteed cash or base + variable pay. State the currency and payment unit below.</span></label></div>
    <label className="block text-sm font-medium">Compensation details<textarea name="compensationText" required maxLength={2000} rows={3} placeholder="For example: USD $250 per approved video, paid within 14 days. Include any variable pay or gifted product terms." className={input} /></label>
    {[["deliverables", "Deliverables", "Number of videos, length, formats, deadlines, and revisions."], ["eligibility", "Eligibility", "Countries, languages, experience, or other job-related requirements."], ["usageRights", "Usage rights", "Organic or paid usage, duration, channels, whitelisting, exclusivity, and raw footage."]].map(([key, label, placeholder]) => <label key={key} className="block text-sm font-medium">{label}<textarea name={key} required maxLength={3000} rows={3} placeholder={placeholder} className={input} /></label>)}
    <div className="grid sm:grid-cols-2 gap-5"><label className="text-sm font-medium">Application destination<input name="applicationUrl" type="url" required maxLength={2000} placeholder="https://yourbrand.com/apply" className={input} /></label><label className="text-sm font-medium">Closing date (end of day, UTC)<input name="closingDate" type="date" required className={input} /></label></div>
    <p className="text-sm text-warm-gray-600">We’ll review the listing before publication. Your contact email stays private. Applications go to the destination you provide.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={state === "saving"} className="bg-gradient-to-r from-coral to-rose text-white rounded-full px-7 py-4 font-medium disabled:opacity-50">{state === "saving" ? "Submitting…" : "Submit job for free"}</button>
  </form>;
}
