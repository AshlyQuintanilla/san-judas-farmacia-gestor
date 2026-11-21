import { APP_CONFIG } from "@/lib/config";
import type { Product } from "@/lib/types";

export type StockStatus = "agotado" | "bajo" | "normal";

/** Un producto tiene bajo stock cuando su existencia es igual o menor al stock mínimo. */
export function isLowStock(p: Pick<Product, "stock" | "stockMinimo">): boolean {
  return p.stock <= p.stockMinimo;
}

export function stockStatus(p: Pick<Product, "stock" | "stockMinimo">): StockStatus {
  if (p.stock <= 0) return "agotado";
  if (isLowStock(p)) return "bajo";
  return "normal";
}

export function daysUntil(dateIso: string, now: Date = new Date()): number {
  const target = new Date(`${dateIso}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function isExpiringSoon(
  p: Pick<Product, "fechaVencimiento">,
  now: Date = new Date(),
  days: number = APP_CONFIG.expiryWarningDays,
): boolean {
  return daysUntil(p.fechaVencimiento, now) <= days;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Total de una venta = suma de cantidad × precio unitario. */
export function computeSaleTotal(items: { cantidad: number; precioUnitario: number }[]): number {
  return roundMoney(items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0));
}

/** Devuelve un mensaje de error si la venta no es válida, o null si se puede registrar. */
export function validateSaleItems(
  items: { productoId: string; cantidad: number }[],
  products: Pick<Product, "id" | "nombre" | "stock">[],
): string | null {
  if (items.length === 0) return "Agrega al menos un producto a la venta.";
  for (const item of items) {
    const product = products.find((p) => p.id === item.productoId);
    if (!product) return "Uno de los productos ya no existe.";
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0)
      return `La cantidad de ${product.nombre} debe ser mayor a cero.`;
    if (item.cantidad > product.stock)
      return `Stock insuficiente de ${product.nombre} (disponible: ${product.stock}).`;
  }
  return null;
}

export function inventoryValue(products: Pick<Product, "stock" | "precioCompra">[]): number {
  return roundMoney(products.reduce((sum, p) => sum + p.stock * p.precioCompra, 0));
}
