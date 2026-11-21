// Servicio de productos. TODO Supabase: supabase.from("productos")
import type { Product, ProductInput } from "@/lib/types";
import { clone, db, newId, simulateLatency } from "./data-source";

export async function listProducts(): Promise<Product[]> {
  await simulateLatency();
  return clone([...db.products].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await simulateLatency();
  if (db.products.some((p) => p.codigo.toLowerCase() === input.codigo.toLowerCase())) {
    throw new Error(`Ya existe un producto con el código ${input.codigo}.`);
  }
  const product: Product = { ...input, id: newId("prd"), creadoEn: new Date().toISOString() };
  db.products.push(product);
  return clone(product);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  await simulateLatency();
  const index = db.products.findIndex((p) => p.id === id);
  const current = db.products[index];
  if (!current) throw new Error("El producto no existe.");
  if (
    db.products.some((p) => p.id !== id && p.codigo.toLowerCase() === input.codigo.toLowerCase())
  ) {
    throw new Error(`Ya existe un producto con el código ${input.codigo}.`);
  }
  const updated: Product = { ...current, ...input };
  db.products[index] = updated;
  return clone(updated);
}
