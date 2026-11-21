/**
 * Tipos del dominio. Cada interfaz corresponde a una tabla del esquema propuesto
 * en docs/supabase/esquema-propuesto.sql.
 */

export interface AppUser {
  id: string;
  nombre: string;
  email: string;
  rol: "Gerente" | "Cajero" | "Bodega";
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  laboratorio: string;
  presentacion: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  /** Fecha ISO (yyyy-mm-dd) */
  fechaVencimiento: string;
  requiereReceta: boolean;
  creadoEn: string;
}

export type ProductInput = Omit<Product, "id" | "creadoEn">;

export interface Customer {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  creadoEn: string;
}

export type CustomerInput = Omit<Customer, "id" | "creadoEn">;

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";
export type SaleStatus = "completada" | "anulada";

export interface SaleItem {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  numero: string;
  fecha: string;
  clienteId: string | null;
  nombreCliente: string;
  metodoPago: PaymentMethod;
  items: SaleItem[];
  total: number;
  estado: SaleStatus;
  vendedor: string;
}

export interface NewSaleInput {
  clienteId: string | null;
  metodoPago: PaymentMethod;
  items: { productoId: string; cantidad: number }[];
  vendedor: string;
}

export type MovementType = "entrada" | "salida" | "venta" | "anulacion";

export interface InventoryMovement {
  id: string;
  productoId: string;
  nombreProducto: string;
  tipo: MovementType;
  /** Positivo = entra al inventario, negativo = sale */
  cantidad: number;
  stockResultante: number;
  motivo: string;
  fecha: string;
  usuario: string;
}

export interface MovementInput {
  productoId: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  motivo: string;
  usuario: string;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: "Entrada",
  salida: "Salida",
  venta: "Venta",
  anulacion: "Anulación",
};

export const PRODUCT_CATEGORIES = [
  "Analgésicos",
  "Antibióticos",
  "Antialérgicos",
  "Gastrointestinal",
  "Cardiovascular",
  "Diabetes",
  "Respiratorio",
  "Vitaminas",
  "Cuidado personal",
  "Material de curación",
] as const;
