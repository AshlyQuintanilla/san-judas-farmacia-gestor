// Servicio de inventario. TODO Supabase: supabase.from("movimientos_inventario")
import type { InventoryMovement, MovementInput } from "@/lib/types";
import { clone, db, newId, simulateLatency } from "./data-source";

export async function listMovements(): Promise<InventoryMovement[]> {
  await simulateLatency();
  return clone([...db.movements].sort((a, b) => b.fecha.localeCompare(a.fecha)));
}

/** Registra una entrada (suma) o salida (resta) manual de inventario. */
export async function registerMovement(input: MovementInput): Promise<InventoryMovement> {
  await simulateLatency();
  const product = db.products.find((p) => p.id === input.productoId);
  if (!product) throw new Error("El producto no existe.");
  if (!Number.isInteger(input.cantidad) || input.cantidad <= 0) {
    throw new Error("La cantidad debe ser un número entero mayor a cero.");
  }
  if (input.tipo === "salida" && input.cantidad > product.stock) {
    throw new Error(`No hay suficiente stock de ${product.nombre} (disponible: ${product.stock}).`);
  }

  const delta = input.tipo === "entrada" ? input.cantidad : -input.cantidad;
  product.stock += delta;

  const movement: InventoryMovement = {
    id: newId("mov"),
    productoId: product.id,
    nombreProducto: product.nombre,
    tipo: input.tipo,
    cantidad: delta,
    stockResultante: product.stock,
    motivo: input.motivo,
    fecha: new Date().toISOString(),
    usuario: input.usuario,
  };
  db.movements.push(movement);
  return clone(movement);
}
