import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDefaultVenue } from "@/lib/data/queries";
export const dynamic = "force-dynamic";

export default async function ReservarLayout({
  children,
}: LayoutProps<"/reservar">) {
  // Deduplicado con React cache: la page pide el mismo complejo.
  const venue = await getDefaultVenue();

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <div className="cm-demo-banner">
          DEMO · No realices pagos reales · Paso 1: elegí turno · Paso 2:
          completá tus datos
        </div>
        {children}
      </main>
      <SiteFooter
        instagramUrl={venue.instagramUrl}
        facebookUrl={venue.facebookUrl}
        whatsappUrl={venue.whatsappContactUrl}
      />
    </>
  );
}
