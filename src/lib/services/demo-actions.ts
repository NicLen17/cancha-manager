"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./auth";
import { runAction, type ActionResult } from "./action-result";
import { buildDemoSeed } from "@/lib/data/mock/seed";
import { resetMockDemo } from "@/lib/data/mock/store";
import { getDataAccess } from "@/lib/data";
import { rpc } from "@/lib/data/supabase/http";
import { removeReceipts } from "./receipts";

export async function resetDemoAction(
  confirmation: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    if (confirmation !== "REINICIAR DEMO")
      throw new Error("Escribí REINICIAR DEMO para confirmar");
    if (process.env.DATA_ADAPTER === "supabase") {
      const db = getDataAccess();
      const venue = await db.venues.getDefaultVenue();
      const reservations = await db.reservations.listByVenue(venue.id);
      await rpc("cm_reset_demo", { seed: buildDemoSeed() });
      await removeReceipts(
        reservations.flatMap((r) => (r.receiptPath ? [r.receiptPath] : [])),
      );
    } else resetMockDemo();
    revalidatePath("/", "layout");
    return undefined;
  });
}
