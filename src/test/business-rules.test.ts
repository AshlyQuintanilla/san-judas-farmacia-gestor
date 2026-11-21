import { beforeEach, describe, expect, it } from "vitest";
import { computeSaleTotal, isLowStock, validateSaleItems } from "@/lib/business-rules";
import { formatMoney } from "@/lib/config";
import { db, resetDb } from "@/services/data-source";
import { registerMovement } from "@/services/inventory.service";
import { cancelSale, createSale } from "@/services/sales.service";

describe("reglas de negocio", () => {
  beforeEach(() => resetDb());

  it("marca bajo stock cuando la existencia es igual o menor al mínimo", () => {
    expect(isLowStock({ stock: 5, stockMinimo: 5 })).toBe(true);
    expect(isLowStock({ stock: 6, stockMinimo: 5 })).toBe(false);
  });

  it("muestra los montos en córdobas", () => {
    expect(formatMoney(1250.5)).toBe("C$ 1,250.50");
  });

  it("calcula el total de la venta como cantidad × precio", () => {
    expect(computeSaleTotal([{ cantidad: 2, precioUnitario: 140 }, { cantidad: 1, precioUnitario: 85 }])).toBe(365);
  });

  it("no permite vender más de lo que hay en stock", () => {
    expect(validateSaleItems([{ productoId: "p1", cantidad: 4 }], [{ id: "p1", nombre: "X", stock: 3 }])).toMatch(
      /Stock insuficiente/,
    );
  });

  it("al registrar una venta descuenta el stock", async () => {
    const product = db.products[0]!;
    const before = product.stock;
    await createSale({ clienteId: null, metodoPago: "efectivo", items: [{ productoId: product.id, cantidad: 3 }], vendedor: "Test" });
    expect(db.products[0]!.stock).toBe(before - 3);
  });

  it("al anular una venta devuelve el stock", async () => {
    const product = db.products[0]!;
    const before = product.stock;
    const sale = await createSale({ clienteId: null, metodoPago: "tarjeta", items: [{ productoId: product.id, cantidad: 2 }], vendedor: "Test" });
    await cancelSale(sale.id, "Test");
    expect(db.products[0]!.stock).toBe(before);
  });

  it("rechaza una salida de inventario mayor al stock", async () => {
    const product = db.products[0]!;
    await expect(
      registerMovement({ productoId: product.id, tipo: "salida", cantidad: product.stock + 1, motivo: "x", usuario: "Test" }),
    ).rejects.toThrow(/No hay suficiente stock/);
  });
});
