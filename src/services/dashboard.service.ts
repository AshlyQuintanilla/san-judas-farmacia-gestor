// Indicadores del dashboard. TODO Supabase: puede reemplazarse por una vista o función SQL.
import { isLowStock, roundMoney } from "@/lib/business-rules";
import type { Product, Sale } from "@/lib/types";
import { clone, db, simulateLatency } from "./data-source";

export interface DashboardStats {
  ventasHoy: number;
  transaccionesHoy: number;
  ventasMes: number;
  ticketPromedio: number;
  productosRegistrados: number;
  productosBajoStock: number;
  totalClientes: number;
  ventasUltimos7Dias: { fecha: string; total: number }[];
  ventasRecientes: Sale[];
  bajoStock: Product[];
  topProductos: { nombre: string; unidades: number; total: number }[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export async function getDashboardStats(now: Date = new Date()): Promise<DashboardStats> {
  await simulateLatency();
  const completed = db.sales.filter((s) => s.estado === "completada");
  const today = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const hoy = completed.filter((s) => new Date(s.fecha) >= today);
  const mes = completed.filter((s) => new Date(s.fecha) >= monthStart);

  const ventasUltimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(today.getTime() - (6 - i) * 86_400_000);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const total = completed
      .filter((s) => {
        const f = new Date(s.fecha);
        return f >= dayStart && f < dayEnd;
      })
      .reduce((sum, s) => sum + s.total, 0);
    return { fecha: dayStart.toISOString(), total: roundMoney(total) };
  });

  const top = new Map<string, { nombre: string; unidades: number; total: number }>();
  for (const sale of mes) {
    for (const item of sale.items) {
      const entry = top.get(item.productoId) ?? { nombre: item.nombreProducto, unidades: 0, total: 0 };
      entry.unidades += item.cantidad;
      entry.total += item.subtotal;
      top.set(item.productoId, entry);
    }
  }

  const bajoStock = db.products
    .filter(isLowStock)
    .sort((a, b) => a.stock / Math.max(a.stockMinimo, 1) - b.stock / Math.max(b.stockMinimo, 1));

  const ventasMes = roundMoney(mes.reduce((sum, s) => sum + s.total, 0));

  return clone({
    ventasHoy: roundMoney(hoy.reduce((sum, s) => sum + s.total, 0)),
    transaccionesHoy: hoy.length,
    ventasMes,
    ticketPromedio: mes.length ? roundMoney(ventasMes / mes.length) : 0,
    productosRegistrados: db.products.length,
    productosBajoStock: bajoStock.length,
    totalClientes: db.customers.length,
    ventasUltimos7Dias,
    ventasRecientes: [...db.sales].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6),
    bajoStock: bajoStock.slice(0, 6),
    topProductos: [...top.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5),
  });
}
