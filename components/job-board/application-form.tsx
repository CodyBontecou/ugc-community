"use client";
import { useState, type FormEvent } from "react";
import { CreatorProfileView } from "./creator-profile-view";
import type { CreatorProfile } from "@/lib/job-board/profiles";
export function ApplicationForm({ jobId, company, recipient, email, profile, existing }: { jobId: string; company: string; recipient: string; email: string; profile: CreatorProfile; existing: { status: string; message: string } | null }) {
  const [message, setMessage] = useState(existing?.message || ""), [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState(false), [busy, setBusy] = useState(false), [sent, setSent] = useState(existing?.status === "sent"), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) { setPreview(true); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/job-board/applications/${jobId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, consent }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send application");
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not send application"); }
    finally { setBusy(false); }
  }
  if (sent) return <div role="status" className="bg-white rounded-[28px] border border-warm-gray-200 p-8 space-y-4"><h2 className="text-3xl">Your application was sent</h2><p>The email provider accepted your application for {company}. This does not confirm inbox delivery or an employer response. Replies go to {email}.</p><a href="/apply-profile" className="underline">View application history</a></div>;
  return <form onSubmit={submit} className="space-y-6">
    <div className="bg-white rounded-[28px] border border-warm-gray-200 p-6 space-y-4"><h2 className="text-2xl">{preview ? "Review your application" : "A short note to the employer"}</h2><p className="text-sm text-warm-gray-600 break-words">To: {company} · {recipient}<br />Replies to: {email}</p>
      {existing && <p className="text-sm">A saved application is awaiting send confirmation. Retrying uses the original profile and message shown below.</p>}
      {preview ? <p className="whitespace-pre-wrap break-words">{message}</p> : <label className="block text-sm font-medium">Why are you a good fit? Include anything the brief asks for.<textarea required minLength={20} maxLength={3000} rows={5} value={message} readOnly={Boolean(existing)} onChange={e => setMessage(e.target.value)} className="block w-full mt-2 border border-warm-gray-200 rounded-xl px-4 py-3" /></label>}
      {!existing && <a href={`/apply-profile?job=${jobId}`} className="inline-block text-sm underline">Edit your saved profile</a>}
    </div>
    <CreatorProfileView profile={profile} />
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 accent-rose" />I want ugc.community to email my profile, message, and email address to this employer for this job.</label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-4"><button disabled={busy} className="bg-gradient-to-r from-coral to-rose text-white rounded-full px-6 py-3 disabled:opacity-50">{busy ? "Sending…" : preview ? "Send application" : "Preview application"}</button>{preview && <button type="button" disabled={busy} onClick={() => setPreview(false)} className="underline">Back</button>}</div>
  </form>;
}
