import { ZodError } from "zod";

/**
 * Resultado tipado de una server action.
 *
 * En producción Next reemplaza el `message` de cualquier error lanzado por una
 * server function por un texto genérico (para no filtrar detalles). Por eso los
 * errores esperables (validación, turno ocupado, sesión vencida) se devuelven
 * como valor y el cliente decide el toast y el rollback.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const GENERIC_ERROR = "No se pudo completar la acción. Volvé a intentarlo.";

/**
 * Mensaje apto para mostrar al usuario. Solo se exponen los `Error` "planos"
 * (los que lanza nuestro código con texto en español) y los errores de zod;
 * cualquier otro (TypeError, RangeError, errores de red) se registra en el
 * servidor y se devuelve un texto genérico.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof ZodError)
    return error.issues[0]?.message ?? "Revisá los datos ingresados";
  if (error instanceof Error && error.constructor === Error && error.message)
    return error.message;
  console.error("[action] error inesperado", error);
  return GENERIC_ERROR;
}

/** Ejecuta la lógica de una action y convierte cualquier excepción en `{ ok: false }`. */
export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
