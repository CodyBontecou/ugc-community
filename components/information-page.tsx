import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/landing";
import { informationPages } from "@/lib/agent-content/pages";

export function InformationPage({ name, children }: { name: keyof typeof informationPages; children?: ReactNode }) {
  const page = informationPages[name];
  return <><main className="min-h-screen bg-[#fff5f3] px-6 py-20"><article className="mx-auto max-w-3xl rounded-3xl border border-warm-gray-100 bg-white p-8 md:p-12">
    <Link href="/" className="text-rose hover:underline">← ugc.community</Link>
    <h1 className="mt-8 text-5xl text-warm-gray-900">{page.title}</h1>
    <div className="mt-10 space-y-8 leading-7 text-warm-gray-600">{page.sections.map(section => <section key={section.heading}><h2 className="text-2xl text-warm-gray-900">{section.heading}</h2><p className="mt-3">{section.text}</p></section>)}</div>
    <nav aria-label="Related resources" className="mt-10 flex flex-wrap gap-5 text-rose"><Link href="/jobs">Browse jobs</Link><Link href="/post-job">Post a job</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:cody@isolated.tech">Email support</a></nav>
    {children}
  </article></main><Footer /></>;
}
