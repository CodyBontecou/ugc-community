import { CheckCircle2 } from "lucide-react";

export function ProfileAccountHeader({ email, name, hasProfile }: { email: string; name?: string; hasProfile: boolean }) {
  return <header className="space-y-6">
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950">
      <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0"><p className="font-medium">{name?.trim() ? `Signed in as ${name}` : "You’re signed in"}</p><p className="mt-1 break-all text-sm">{email}</p></div>
    </div>
    <div>
      <p className="mb-3 text-sm font-medium text-rose">{hasProfile ? "Your quick-apply profile" : "First-time profile setup"}</p>
      <h1 className="mb-4 text-3xl sm:text-4xl">{hasProfile ? "Your creator profile" : "Let’s set up your creator profile"}</h1>
      <p className="max-w-2xl text-warm-gray-600">{hasProfile ? "Your saved profile is ready for quick apply. Update your details here for future applications." : "Your account is ready. Complete this one-time setup so you can reuse your details when applying to jobs."}</p>
    </div>
    {!hasProfile && <ol aria-label="Profile setup steps" className="grid gap-3 text-sm text-warm-gray-700 sm:grid-cols-3">{["Add your details and work links", "Generate and review your profile", "Save it for quick apply"].map((step, index) => <li key={step} className="flex items-center gap-3"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-peach-100 font-medium">{index + 1}</span>{step}</li>)}</ol>}
  </header>;
}
