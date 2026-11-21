/**
 * DATOS DE EJEMPLO TEMPORALES.
 * Se usan mientras no hay base de datos conectada. Al conectar Supabase,
 * este archivo deja de usarse (los servicios leerán de las tablas reales).
 */
import type { Customer, InventoryMovement, PaymentMethod, Product, Sale } from "@/lib/types";
import { computeSaleTotal } from "@/lib/business-rules";

export interface MockDb {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  movements: InventoryMovement[];
  saleCounter: number;
}

/** Generador pseudoaleatorio determinista para que los datos de ejemplo sean estables. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

type SeedProduct = [
  codigo: string,
  nombre: string,
  categoria: string,
  laboratorio: string,
  presentacion: string,
  compra: number,
  venta: number,
  stock: number,
  minimo: number,
  venceEnDias: number,
  receta: boolean,
];

const PRODUCTS: SeedProduct[] = [
  ["MED-001", "Acetaminofén 500 mg", "Analgésicos", "Ramos", "Caja 100 tabletas", 85, 140, 120, 30, 420, false],
  ["MED-002", "Ibuprofeno 400 mg", "Analgésicos", "Genfar", "Caja 50 tabletas", 70, 115, 18, 25, 300, false],
  ["MED-003", "Amoxicilina 500 mg", "Antibióticos", "MK", "Caja 21 cápsulas", 95, 165, 42, 20, 380, true],
  ["MED-004", "Azitromicina 500 mg", "Antibióticos", "Pfizer", "Caja 3 tabletas", 180, 290, 6, 10, 250, true],
  ["MED-005", "Loratadina 10 mg", "Antialérgicos", "Bayer", "Caja 10 tabletas", 45, 85, 75, 20, 510, false],
  ["MED-006", "Cetirizina 10 mg", "Antialérgicos", "Genfar", "Caja 10 tabletas", 40, 78, 0, 15, 460, false],
  ["MED-007", "Omeprazol 20 mg", "Gastrointestinal", "Ramos", "Caja 14 cápsulas", 60, 110, 64, 20, 600, false],
  ["MED-008", "Suero oral sabor coco", "Gastrointestinal", "Abbott", "Botella 500 ml", 35, 62, 9, 24, 70, false],
  ["MED-009", "Losartán 50 mg", "Cardiovascular", "MK", "Caja 30 tabletas", 110, 190, 38, 15, 540, true],
  ["MED-010", "Enalapril 10 mg", "Cardiovascular", "Sanofi", "Caja 30 tabletas", 75, 135, 12, 15, 45, true],
  ["MED-011", "Metformina 850 mg", "Diabetes", "Merck", "Caja 30 tabletas", 90, 155, 55, 20, 480, true],
  ["MED-012", "Glibenclamida 5 mg", "Diabetes", "Ramos", "Caja 30 tabletas", 50, 92, 22, 10, 365, true],
  ["MED-013", "Salbutamol inhalador", "Respiratorio", "GSK", "Inhalador 200 dosis", 210, 340, 4, 8, 330, true],
  ["MED-014", "Jarabe para la tos", "Respiratorio", "Bayer", "Frasco 120 ml", 95, 160, 30, 12, 80, false],
  ["MED-015", "Vitamina C 1 g", "Vitaminas", "Bayer", "Tubo 10 efervescentes", 70, 125, 88, 20, 700, false],
  ["MED-016", "Complejo B", "Vitaminas", "Abbott", "Frasco 30 tabletas", 120, 205, 26, 10, 560, false],
  ["MED-017", "Alcohol 70%", "Cuidado personal", "Laboratorios Solka", "Botella 500 ml", 45, 80, 140, 30, 900, false],
  ["MED-018", "Protector solar FPS 50", "Cuidado personal", "Eucerin", "Tubo 50 ml", 380, 590, 11, 6, 400, false],
  ["MED-019", "Gasas estériles", "Material de curación", "Johnson & Johnson", "Paquete 10 unidades", 25, 48, 200, 40, 1000, false],
  ["MED-020", "Vendas elásticas 4\"", "Material de curación", "3M", "Unidad", 30, 58, 14, 15, 1000, false],
  ["MED-021", "Diclofenaco gel 1%", "Analgésicos", "Novartis", "Tubo 60 g", 110, 185, 33, 10, 280, false],
  ["MED-022", "Ranitidina 150 mg", "Gastrointestinal", "Genfar", "Caja 20 tabletas", 48, 88, 47, 15, 25, false],
  ["MED-023", "Ciprofloxacino 500 mg", "Antibióticos", "Ramos", "Caja 10 tabletas", 85, 150, 27, 12, 390, true],
  ["MED-024", "Termómetro digital", "Cuidado personal", "Omron", "Unidad", 140, 240, 19, 5, 1500, false],
];

const CUSTOMERS: Omit<Customer, "id" | "creadoEn">[] = [
  { nombre: "María José Hernández", cedula: "001-150390-0012A", telefono: "+505 8845-2210", email: "mariajose.h@gmail.com", direccion: "Bello Horizonte, Managua" },
  { nombre: "Carlos Alberto Ruiz", cedula: "281-220785-0003K", telefono: "+505 8712-3345", email: "carlos.ruiz@yahoo.com", direccion: "Barrio Sutiava, León" },
  { nombre: "Ana Lucía Gutiérrez", cedula: "401-030292-0021B", telefono: "+505 8650-7781", email: "ana.gutierrez@outlook.com", direccion: "Centro, Masaya" },
  { nombre: "José Ramón Castillo", cedula: "001-111178-0045M", telefono: "+505 8923-1102", email: "jr.castillo@gmail.com", direccion: "Villa Fontana, Managua" },
  { nombre: "Fátima del Carmen López", cedula: "201-250699-0008C", telefono: "+505 8567-4490", email: "fatima.lopez@gmail.com", direccion: "Barrio La Merced, Granada" },
  { nombre: "Luis Enrique Martínez", cedula: "161-070588-0017D", telefono: "+505 8398-6623", email: "luis.martinez@hotmail.com", direccion: "Centro, Estelí" },
  { nombre: "Rosa Amelia Sánchez", cedula: "001-301065-0031F", telefono: "+505 8234-9087", email: "rosa.sanchez@gmail.com", direccion: "Altamira, Managua" },
  { nombre: "Kevin Antonio Pérez", cedula: "441-180901-0002G", telefono: "+505 8476-5512", email: "kevin.perez@gmail.com", direccion: "Barrio San Juan, Jinotepe" },
  { nombre: "Gloria Isabel Mendoza", cedula: "241-091273-0014H", telefono: "+505 8811-0034", email: "gloria.mendoza@yahoo.com", direccion: "Centro, Matagalpa" },
  { nombre: "Francisco Javier Obando", cedula: "001-210894-0056J", telefono: "+505 8689-2247", email: "fj.obando@gmail.com", direccion: "Las Colinas, Managua" },
  { nombre: "Yahoska Valeria Torres", cedula: "281-121297-0009L", telefono: "+505 8547-1186", email: "yahoska.torres@gmail.com", direccion: "Reparto Fátima, León" },
  { nombre: "Clínica Médica El Carmen", cedula: "J0310000123456", telefono: "+505 2250-4411", email: "compras@clinicaelcarmen.com.ni", direccion: "Km 5 Carretera a Masaya, Managua" },
];

const SELLERS = ["Carmen Reyes", "Jorge Aráuz", "Mayling Chávez"];
const PAYMENTS: PaymentMethod[] = ["efectivo", "efectivo", "tarjeta", "transferencia"];

export function createSeed(now: Date = new Date()): MockDb {
  const rand = seededRandom(20261121);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T;

  const products: Product[] = PRODUCTS.map((p, i) => ({
    id: `prd_${String(i + 1).padStart(3, "0")}`,
    codigo: p[0],
    nombre: p[1],
    categoria: p[2],
    laboratorio: p[3],
    presentacion: p[4],
    precioCompra: p[5],
    precioVenta: p[6],
    stock: p[7],
    stockMinimo: p[8],
    fechaVencimiento: isoDate(addDays(now, p[9])),
    requiereReceta: p[10],
    creadoEn: addDays(now, -120 + i).toISOString(),
  }));

  const customers: Customer[] = CUSTOMERS.map((c, i) => ({
    ...c,
    id: `cli_${String(i + 1).padStart(3, "0")}`,
    creadoEn: addDays(now, -200 + i * 9).toISOString(),
  }));

  // Ventas de los últimos 30 días (más algunas de hoy)
  const offsetsMinutes: number[] = [];
  for (let i = 0; i < 6; i++) offsetsMinutes.push(15 + i * 42);
  for (let i = 0; i < 70; i++) offsetsMinutes.push(Math.floor(rand() * 30 * 24 * 60) + 300);
  offsetsMinutes.sort((a, b) => b - a);

  const sales: Sale[] = offsetsMinutes.map((offset, idx) => {
    const numItems = 1 + Math.floor(rand() * 3);
    const chosen = new Set<Product>();
    while (chosen.size < numItems) chosen.add(pick(products));
    const items = [...chosen].map((p) => {
      const cantidad = 1 + Math.floor(rand() * 3);
      return {
        productoId: p.id,
        nombreProducto: p.nombre,
        cantidad,
        precioUnitario: p.precioVenta,
        subtotal: cantidad * p.precioVenta,
      };
    });
    const customer = rand() < 0.3 ? null : pick(customers);
    return {
      id: `vta_${String(idx + 1).padStart(4, "0")}`,
      numero: `V-${1001 + idx}`,
      fecha: new Date(now.getTime() - offset * 60_000).toISOString(),
      clienteId: customer?.id ?? null,
      nombreCliente: customer?.nombre ?? "Consumidor final",
      metodoPago: pick(PAYMENTS),
      items,
      total: computeSaleTotal(items),
      estado: rand() < 0.04 ? "anulada" : "completada",
      vendedor: pick(SELLERS),
    };
  });

  const movements: InventoryMovement[] = products
    .filter((_, i) => i % 3 === 0)
    .map((p, i) => ({
      id: `mov_${String(i + 1).padStart(4, "0")}`,
      productoId: p.id,
      nombreProducto: p.nombre,
      tipo: "entrada" as const,
      cantidad: 24 + i * 6,
      stockResultante: p.stock,
      motivo: "Compra a proveedor",
      fecha: addDays(now, -(2 + i * 2)).toISOString(),
      usuario: "Jorge Aráuz",
    }));

  return { products, customers, sales, movements, saleCounter: 1001 + sales.length };
}
