"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

// Illustrations only. Never mix these rows with imported creator records.
const samples = [
  { name: "sample_creator_01", platforms: ["Instagram", "TikTok"], portfolio: true, email: true },
  { name: "sample_creator_02", platforms: ["YouTube"], portfolio: true, email: false },
  { name: "sample_creator_03", platforms: ["TikTok"], portfolio: false, email: true },
  { name: "sample_creator_04", platforms: ["Instagram", "YouTube"], portfolio: true, email: true },
];

export function DatabasePreview() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [emailOnly, setEmailOnly] = useState(false);
  const rows = samples.filter(row =>
    `${row.name} ${row.platforms.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!platform || row.platforms.includes(platform)) && (!emailOnly || row.email)
  );
  return (
    <div id="database-preview" className="scroll-mt-28 max-w-5xl mx-auto text-left bg-white rounded-[28px] shadow-xl border border-warm-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 bg-warm-gray-50 border-b border-warm-gray-100">
        <span className="font-medium text-warm-gray-900">Your creator search starts here</span>
        <span className="rounded-full bg-peach-200 text-warm-gray-700 px-3 py-1 text-xs font-medium">Interactive preview · Sample data</span>
      </div>
      <div className="p-5 sm:p-8">
        <p className="text-sm text-warm-gray-600 mb-6">Try searching and filtering below. These fictional records demonstrate the experience; live creator data and paid access are coming soon.</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <label className="flex flex-1 items-center gap-2 border border-warm-gray-200 rounded-xl px-4 bg-warm-gray-50">
            <Search size={18} className="shrink-0 text-warm-gray-500" />
            <span className="sr-only">Search sample creators</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search username or platform…" className="w-full min-w-0 py-3 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-rose rounded" />
          </label>
          <label className="flex items-center gap-2 border border-warm-gray-200 rounded-xl px-3">
            <SlidersHorizontal size={16} className="text-rose" /><span className="sr-only">Filter by platform</span>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="py-3 bg-transparent w-full"><option value="">All platforms</option>{["Instagram", "TikTok", "YouTube"].map(p => <option key={p}>{p}</option>)}</select>
          </label>
        </div>
        <div className="flex flex-wrap justify-between gap-3 mb-5 text-sm text-warm-gray-600">
          <span role="status" aria-live="polite">{rows.length} sample {rows.length === 1 ? "record" : "records"}</span>
          <label className="flex items-center gap-2"><input type="checkbox" checked={emailOnly} onChange={e => setEmailOnly(e.target.checked)} className="accent-rose" /> Has an email</label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead><tr className="text-left text-warm-gray-500 border-b border-warm-gray-100">{["Creator", "Social platforms", "Portfolio", "Contact"].map(h => <th key={h} scope="col" className="py-3 pr-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map(row => <tr key={row.name} className="border-b border-warm-gray-100 last:border-0">
              <td className="py-5 pr-4"><span className="block font-medium text-warm-gray-900">{row.name}</span><span className="text-xs text-warm-gray-500">Illustrative creator</span></td>
              <td className="py-5 pr-4"><div className="flex flex-wrap gap-1">{row.platforms.map(p => <span key={p} className="px-2 py-1 rounded-full bg-peach-100 text-warm-gray-700 text-xs">{p}</span>)}</div></td>
              <td className="py-5 pr-4 text-warm-gray-600">{row.portfolio ? "Link shared" : "Not shared"}</td>
              <td className="py-5 text-warm-gray-600">{row.email ? "Email shared" : "Not shared"}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="py-10 text-center"><p className="text-warm-gray-600 mb-3">No sample records match those filters.</p><button type="button" onClick={() => { setQuery(""); setPlatform(""); setEmailOnly(false); }} className="text-warm-gray-900 underline underline-offset-4">Clear filters</button></div>}
        <p className="mt-5 text-xs text-warm-gray-600">Source context and capture dates are planned for live records. Contact details are not verified, and a record does not imply availability or endorsement.</p>
      </div>
    </div>
  );
}
