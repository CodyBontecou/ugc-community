"use client";

import { useState, type FormEvent } from "react";
import { Check, ArrowRight } from "lucide-react";

export function Pricing() {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setStatus("pending");
    try {
      const response = await fetch("/api/database/early-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error("Signup failed");
      setStatus("success");
    } catch { setStatus("error"); }
  }
  return (
    <section id="pricing" className="relative z-[1] py-24 scroll-mt-20">
      <div className="container">
        <div className="text-center mb-14">
          <span className="inline-block py-1.5 px-4 bg-peach-100 text-rose rounded-full text-xs font-semibold uppercase tracking-wider mb-6">Subscription access</span>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] mb-6">One place to search.<br /><span className="gradient-text">More creators to discover.</span></h2>
          <p className="text-lg text-warm-gray-600 max-w-xl mx-auto">An ongoing subscription to a database that grows as new creator details are collected. Join the list for launch details and pricing.</p>
        </div>
        <div className="max-w-lg mx-auto bg-white rounded-[28px] p-6 sm:p-10 border-2 border-rose shadow-lg shadow-peach-100">
          <span className="text-sm font-medium text-rose">Coming soon</span>
          <h3 className="text-3xl mt-2 mb-3">Creator Database</h3>
          <p className="text-warm-gray-600 mb-6">For brands, agencies, and teams sourcing UGC creators. Subscription pricing will be announced before launch.</p>
          <ul className="space-y-4 mb-8">{["Search and filter creator records", "Shared social profiles, portfolios, and emails", "Original Reddit source context", "New records as uploads are processed"].map(item => <li key={item} className="flex gap-3 items-start text-warm-gray-700"><Check size={18} className="text-rose shrink-0 mt-1" />{item}</li>)}</ul>
          {status === "success" ? <p role="status" className="p-4 bg-peach-100 rounded-xl text-warm-gray-900">You’re on the list. We’ll email you when subscription access is ready.</p> : <form onSubmit={join}>
            <label htmlFor="database-email" className="block text-sm font-medium mb-2">Work email</label>
            <input id="database-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@yourbrand.com" className="w-full border border-warm-gray-200 rounded-xl p-3 mb-3 focus-visible:outline-rose" />
            <button disabled={status === "pending"} className="w-full inline-flex justify-center items-center gap-2 rounded-full py-4 px-5 bg-gradient-to-r from-coral to-rose text-white font-medium disabled:opacity-60">{status === "pending" ? "Joining…" : "Get early access"}<ArrowRight size={18} /></button>
            {status === "error" && <p role="alert" className="text-sm text-warm-gray-700 mt-3">We couldn’t save your email. Please try again or <a href="mailto:cody@isolated.tech" className="underline">contact us</a>.</p>}
          </form>}
          <p className="text-xs text-warm-gray-600 mt-4">No payment required to join. We’ll use your email for database launch updates. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
        </div>
      </div>
    </section>
  );
}
