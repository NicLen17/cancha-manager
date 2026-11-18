import { getDefaultVenue } from "@/lib/data/queries";
import { VenueConfigForm } from "@/components/admin/venue-config-form";
import { DemoControls } from "@/components/admin/demo-controls";

export default async function AdminConfiguracionPage() {
  const venue = await getDefaultVenue();
  // Remonta el formulario si la config cambió por otra vía (mapa, reinicio).
  const configKey = [
    venue.depositPercent,
    venue.bankAlias,
    venue.bankCbu,
    venue.bankHolder,
    venue.whatsappE164,
    venue.planWidthM,
    venue.planLengthM,
  ].join("|");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Datos bancarios, contacto y parámetros del complejo
        </p>
      </div>
      <VenueConfigForm key={configKey} venue={venue} />
      <DemoControls />
    </div>
  );
}
