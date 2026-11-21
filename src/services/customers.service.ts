// Servicio de clientes. TODO Supabase: supabase.from("clientes")
import type { Customer, CustomerInput } from "@/lib/types";
import { clone, db, newId, simulateLatency } from "./data-source";

export async function listCustomers(): Promise<Customer[]> {
  await simulateLatency();
  return clone([...db.customers].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  await simulateLatency();
  const customer: Customer = { ...input, id: newId("cli"), creadoEn: new Date().toISOString() };
  db.customers.push(customer);
  return clone(customer);
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  await simulateLatency();
  const index = db.customers.findIndex((c) => c.id === id);
  const current = db.customers[index];
  if (!current) throw new Error("El cliente no existe.");
  const updated: Customer = { ...current, ...input };
  db.customers[index] = updated;
  // Mantiene el nombre actualizado en las ventas existentes
  db.sales.forEach((s) => {
    if (s.clienteId === id) s.nombreCliente = updated.nombre;
  });
  return clone(updated);
}
