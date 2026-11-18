import { mockDataAccess } from "./mock/store";
import type { DataAccess } from "./ports";
import { supabaseDataAccess } from "./supabase/adapter";

/**
 * Latencia artificial para el adaptador mock (solo desarrollo). Sirve para ver
 * skeletons, estados pendientes y optimistic updates como con una base remota:
 * `MOCK_LATENCY_MS=800 npm run dev`. Sin la variable no agrega nada.
 */
function withLatency(access: DataAccess, ms: number): DataAccess {
  const sleep = () => new Promise((resolve) => setTimeout(resolve, ms));
  return Object.fromEntries(
    Object.entries(access).map(([repoName, repo]) => [
      repoName,
      Object.fromEntries(
        Object.entries(repo as Record<string, (...args: unknown[]) => unknown>).map(
          ([method, fn]) => [
            method,
            async (...args: unknown[]) => {
              await sleep();
              return fn(...args);
            },
          ],
        ),
      ),
    ]),
  ) as DataAccess;
}

const mockLatencyMs = Number(process.env.MOCK_LATENCY_MS ?? 0);
const mockAccess =
  mockLatencyMs > 0 && process.env.NODE_ENV !== "production"
    ? withLatency(mockDataAccess, mockLatencyMs)
    : mockDataAccess;

export function getDataAccess(): DataAccess {
  if (process.env.DATA_ADAPTER === "supabase") return supabaseDataAccess;
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Configurá DATA_ADAPTER=supabase para conservar las reservas",
    );
  return mockAccess;
}

export * from "./types";
export * from "./schemas";
