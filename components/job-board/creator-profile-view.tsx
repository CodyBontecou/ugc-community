import type { CreatorProfile } from "@/lib/job-board/profiles";
export function CreatorProfileView({ profile }: { profile: CreatorProfile }) {
  return <article className="min-w-0 rounded-[28px] border border-warm-gray-200 bg-white p-5 sm:p-10 space-y-5 [overflow-wrap:anywhere]">
    <div><p className="text-sm text-rose mb-2">Creator profile</p><h2 className="text-3xl mb-3">{profile.name}</h2><p className="text-xl text-warm-gray-700">{profile.headline}</p></div>
    <p className="whitespace-pre-line text-warm-gray-600">{profile.bio}</p>
    <dl className="space-y-3 text-sm">{[["Based in", profile.location], ["Niches", profile.niches], ["Availability", profile.availability]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="flex flex-wrap gap-4">{[["Instagram", profile.instagram], ["TikTok", profile.tiktok], ["YouTube", profile.youtube], ["Portfolio", profile.portfolio]].filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center text-rose underline underline-offset-4">{label}</a>)}</div>
  </article>;
}
