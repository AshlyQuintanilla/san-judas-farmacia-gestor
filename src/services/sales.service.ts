// Servicio de ventas. TODO Supabase: tablas "ventas" + "detalle_venta" (idealmente una función RPC
// en la base de datos que registre la venta y descuente el stock en una sola transacción).
import { computeSaleTotal, validateSaleItems } from "@/lib/business-rules";
import type { NewSaleInput, Sale } from "@/lib/types";
import { clone, db, newId, simulateLatency } from "./data-source";

export async function listSales(): Promise<Sale[]> {
  await simulateLatency();
  return clone([...db.sales].sort((a, b) => b.fecha.localeCompare(a.fecha)));
}

export async function createSale(input: NewSaleInput): Promise<Sale> {
  await simulateLatency();
  const error = validateSaleItems(input.items, db.products);
  if (error) throw new Error(error);

  const customer = input.clienteId ? db.customers.find((c) => c.id === input.clienteId) : null;
  const fecha = new Date().toISOString();

  const items = input.items.map((item) => {
    const product = db.products.find((p) => p.id === item.productoId)!;
    return {
      productoId: product.id,
      nombreProducto: product.nombre,
      cantidad: item.cantidad,
      precioUnitario: product.precioVenta,
      subtotal: item.cantidad * product.precioVenta,
    };
  });

  const sale: Sale = {
    id: newId("vta"),
    numero: `V-${db.saleCounter++}`,
    fecha,
    clienteId: customer?.id ?? null,
    nombreCliente: customer?.nombre ?? "Consumidor final",
    metodoPago: input.metodoPago,
    items,
    total: computeSaleTotal(items),
    estado: "completada",
    vendedor: input.vendedor,
  };

  // Descontar inventario y registrar movimientos
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productoId)!;
    product.stock -= item.cantidad;
    db.movements.push({
      id: newId("mov"),
      productoId: product.id,
      nombreProducto: product.nombre,
      tipo: "venta",
      cantidad: -item.cantidad,
      stockResultante: product.stock,
      motivo: `Venta ${sale.numero}`,
      fecha,
      usuario: input.vendedor,
    });
  }

  db.sales.push(sale);
  return clone(sale);
}

/** Anula una venta completada y devuelve los productos al inventario. */
export async function cancelSale(id: string, usuario: string): Promise<Sale> {
  await simulateLatency();
  const sale = db.sales.find((s) => s.id === id);
  if (!sale) throw new Error("La venta no existe.");
  if (sale.estado === "anulada") throw new Error("La venta ya está anulada.");

  sale.estado = "anulada";
  const fecha = new Date().toISOString();
  for (const item of sale.items) {
    const product = db.products.find((p) => p.id === item.productoId);
    if (!product) continue;
    product.stock += item.cantidad;
    db.movements.push({
      id: newId("mov"),
      productoId: product.id,
      nombreProducto: product.nombre,
      tipo: "anulacion",
      cantidad: item.cantidad,
      stockResultante: product.stock,
      motivo: `Anulación de ${sale.numero}`,
      fecha,
      usuario,
    });
  }
  return clone(sale);
}
