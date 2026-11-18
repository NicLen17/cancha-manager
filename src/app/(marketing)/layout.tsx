import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lp">
      <MarketingHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
