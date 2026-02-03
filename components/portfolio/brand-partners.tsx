import { PARTNERSHIP_TYPES, type CreatorData } from "@/lib/portfolio/creator-data";

function getPartnershipLabel(type: string): string {
  const found = PARTNERSHIP_TYPES.find((p) => p.id === type);
  return found?.label || type;
}

export function BrandPartners({ creator }: { creator: CreatorData }) {
  const { brandPartnerships } = creator;

  if (brandPartnerships.length === 0) {
    return null;
  }

  return (
    <section id="brands" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Experience
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
          Brand Partnerships
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Trusted by leading brands to create authentic content that drives engagement and
          conversions.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-px bg-border md:grid-cols-3">
          {brandPartnerships.map((brand) => (
            <div
              key={brand.name}
              className="bg-background p-6 flex flex-col justify-between min-h-[120px]"
            >
              <span className="text-lg font-medium text-foreground">{brand.name}</span>
              <span className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {getPartnershipLabel(brand.type)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
