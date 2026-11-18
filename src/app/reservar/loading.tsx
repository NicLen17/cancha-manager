import { DiagonalSection } from "@/components/layout/diagonal-section";
import { BookingBoardSkeleton } from "@/components/booking/booking-skeletons";

// Mismo contenedor y paddings que reservar/page.tsx.
export default function ReservarLoading() {
  return (
    <DiagonalSection tone="muted" className="py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BookingBoardSkeleton />
      </div>
    </DiagonalSection>
  );
}
