import "./portfolio.css";

export const dynamic = "force-dynamic";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
