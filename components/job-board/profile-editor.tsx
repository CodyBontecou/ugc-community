"use client";
import { useState, type FormEvent } from "react";
import { creatorProfileSchema, generateProfile, type CreatorProfile } from "@/lib/job-board/profiles";
import { CreatorProfileView } from "./creator-profile-view";
import { ProfileAccountHeader } from "./profile-account-header";
export function ProfileEditor({ initial, initialShareId, accountEmail, accountName }: { initial: CreatorProfile; initialShareId?: string; accountEmail: string; accountName?: string }) {
  const [profile, setProfile] = useState(initial);
  const [brief, setBrief] = useState(initial.bio);
  const [shareId, setShareId] = useState(initialShareId);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  const [generated, setGenerated] = useState(Boolean(initialShareId));
  const input = "block min-w-0 w-full text-base mt-2 border border-warm-gray-200 rounded-xl px-4 py-3 bg-white font-normal";
  function update(key: keyof CreatorProfile, value: string) { setProfile(current => ({ ...current, [key]: value })); setSaved(false); }
  function generate() {
    if (brief.trim().length < 20) { setError("Add a short brief about the content you make (at least 20 characters)."); return; }
    setProfile(current => ({ ...current, ...generateProfile({ ...current, brief }) }));
    setGenerated(true); setSaved(false); setError("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    const parsed = creatorProfileSchema.safeParse(profile);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Complete your profile"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/job-board/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save profile");
      setShareId(result.shareId); setSaved(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save profile"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-8"><ProfileAccountHeader email={accountEmail} name={accountName} hasProfile={Boolean(shareId)} /><div className="grid lg:grid-cols-2 gap-8 items-start"><form onSubmit={save} className="min-w-0 bg-white border border-warm-gray-200 rounded-[28px] p-5 sm:p-8 space-y-5">
    <h2 className="text-2xl">{shareId ? "Edit your creator details" : "Your creator details"}</h2>
    <p className="text-sm text-warm-gray-600">Add your details, generate a draft, and edit it before saving. We only use the facts you provide.</p>
    {([["name", "Name", 100], ["location", "Location (optional)", 160], ["niches", "Content niches (optional)", 300]] as const).map(([key, label, max]) => <label key={key} className="block text-sm font-medium">{label}<input value={profile[key]} onChange={e => update(key, e.target.value)} required={key === "name"} maxLength={max} className={input} /></label>)}
    <label className="block text-sm font-medium">Tell us about your work<textarea value={brief} onChange={e => setBrief(e.target.value)} maxLength={1600} rows={4} placeholder="What do you create? Which products or styles do you work with? Add relevant experience in your own words." className={input} /></label>
    <button type="button" onClick={generate} className="w-full sm:w-auto border border-rose text-rose rounded-full px-5 py-3">{generated ? "Regenerate profile draft" : "Generate my profile"}</button>
    <label className="block text-sm font-medium">Headline<input value={profile.headline} onChange={e => update("headline", e.target.value)} required maxLength={160} className={input} /></label>
    <label className="block text-sm font-medium">About you<textarea value={profile.bio} onChange={e => update("bio", e.target.value)} required minLength={20} maxLength={2000} rows={5} className={input} /></label>
    {([["instagram", "Instagram URL"], ["tiktok", "TikTok URL"], ["youtube", "YouTube URL"], ["portfolio", "Portfolio or work samples URL"]] as const).map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<input type="url" value={profile[key]} onChange={e => update(key, e.target.value)} maxLength={2000} placeholder="https://" className={input} /></label>)}
    <p className="text-sm text-warm-gray-600">Add at least one social or portfolio link.</p>
    <label className="block text-sm font-medium">Availability (optional)<input value={profile.availability} onChange={e => update("availability", e.target.value)} maxLength={300} placeholder="For example: available for two projects in November" className={input} /></label>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1 size-5 shrink-0 accent-rose" />I agree to create a profile accessible to anyone with its link and share it with employers when I apply. My email stays off the profile page.</label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {saved && <p role="status">Profile saved. You can now quick apply to email-enabled jobs.</p>}
    <button disabled={busy} className="w-full sm:w-auto primary-action text-white rounded-full px-6 py-3 disabled:opacity-50">{busy ? "Saving…" : shareId ? "Save profile changes" : "Create my quick-apply profile"}</button>
  </form><div className="min-w-0 space-y-4"><p className="text-sm text-warm-gray-600">Profile preview</p><CreatorProfileView profile={profile} />{shareId && <a href={`/creator-profile/${shareId}`} className="inline-block underline text-rose">View saved profile</a>}<p className="text-sm text-warm-gray-600">Future applications use your latest saved profile. Applications already submitted keep their original details.</p><a href="/jobs" className="inline-block underline">Browse jobs</a></div></div></div>;
}
