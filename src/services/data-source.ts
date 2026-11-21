/**
 * Fuente de datos TEMPORAL en memoria.
 *
 * Todos los servicios (products, customers, sales, inventory, dashboard) leen y
 * escriben aquí. Para conectar Supabase, reemplaza el cuerpo de cada función de
 * servicio por consultas a `supabase.from("tabla")` — las páginas no cambian,
 * porque solo usan los servicios a través de src/services/queries.ts.
 *
 * Nota: los cambios se pierden al recargar la página hasta conectar la base de datos.
 */
import { createSeed, type MockDb } from "@/data/mock-data";

export const db: MockDb = createSeed();

/** Restaura los datos de ejemplo (útil en pruebas). */
export function resetDb(now?: Date) {
  Object.assign(db, createSeed(now));
}

/** Simula la latencia de red de una base de datos real. */
export const simulateLatency = (ms = 120) =>
  new Promise<void>((resolve) => setTimeout(resolve, import.meta.env.MODE === "test" ? 0 : ms));

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Copia profunda para que la interfaz nunca modifique los datos por referencia. */
export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
