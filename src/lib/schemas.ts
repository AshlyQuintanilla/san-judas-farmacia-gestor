import { z } from "zod";

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(max, `Máximo ${max} caracteres`);

export const productSchema = z
  .object({
    codigo: requiredText("El código", 20),
    nombre: requiredText("El nombre"),
    categoria: requiredText("La categoría"),
    laboratorio: requiredText("El laboratorio", 80),
    presentacion: requiredText("La presentación", 80),
    precioCompra: z.coerce.number({ invalid_type_error: "Ingresa un número" }).min(0, "No puede ser negativo"),
    precioVenta: z.coerce.number({ invalid_type_error: "Ingresa un número" }).positive("Debe ser mayor a cero"),
    stock: z.coerce.number({ invalid_type_error: "Ingresa un número" }).int("Debe ser entero").min(0, "No puede ser negativo"),
    stockMinimo: z.coerce.number({ invalid_type_error: "Ingresa un número" }).int("Debe ser entero").min(0, "No puede ser negativo"),
    fechaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha"),
    requiereReceta: z.boolean(),
  })
  .refine((v) => v.precioVenta >= v.precioCompra, {
    message: "El precio de venta no puede ser menor al de compra",
    path: ["precioVenta"],
  });

export const customerSchema = z.object({
  nombre: requiredText("El nombre"),
  cedula: requiredText("La cédula o RUC", 20),
  telefono: requiredText("El teléfono", 25),
  email: z.union([z.literal(""), z.string().trim().email("Correo no válido")]),
  direccion: z.string().trim().max(200, "Máximo 200 caracteres"),
});

export const movementSchema = z.object({
  productoId: z.string().min(1, "Selecciona un producto"),
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z.coerce.number({ invalid_type_error: "Ingresa un número" }).int("Debe ser entero").positive("Debe ser mayor a cero"),
  motivo: requiredText("El motivo", 150),
});

/** Convierte los errores de zod en un mapa campo → mensaje. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
