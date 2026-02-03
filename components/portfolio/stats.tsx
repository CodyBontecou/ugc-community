import { getSocialUrl, type CreatorData } from "@/lib/portfolio/creator-data";

export function Stats({ creator }: { creator: CreatorData }) {
  const { socialHandles } = creator;

  const totalFollowers = socialHandles.reduce((sum, h) => sum + (h.followerCount || 0), 0);
  const hasStats = totalFollowers > 0;

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!hasStats) {
    return (
      <section id="stats" className="border-t border-border px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Audience
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
            Where to Find Me
          </h2>

          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {socialHandles.map((handle) => (
              <a
                key={`${handle.platform}-${handle.handle}`}
                href={getSocialUrl(handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-medium text-foreground capitalize">
                  {handle.platform}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">{handle.handle}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const stats = [
    {
      value: `${formatCount(totalFollowers)}+`,
      label: "Total Followers",
      detail: "Combined reach",
    },
    ...socialHandles
      .filter((h) => h.followerCount)
      .map((h) => ({
        value: formatCount(h.followerCount!),
        label: h.platform.charAt(0).toUpperCase() + h.platform.slice(1),
        detail: h.handle,
      })),
  ];

  return (
    <section id="stats" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Audience
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
          By the Numbers
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-3xl font-semibold text-foreground md:text-4xl">
                {stat.value}
              </span>
              <span className="mt-2 text-sm font-medium text-foreground">
                {stat.label}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{stat.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
