/**
 * Consultas compartidas (TanStack Query). Las páginas solo usan estas consultas,
 * así que al conectar Supabase basta con cambiar los servicios.
 */
import { queryOptions } from "@tanstack/react-query";
import { listCustomers } from "./customers.service";
import { getDashboardStats } from "./dashboard.service";
import { listMovements } from "./inventory.service";
import { listProducts } from "./products.service";
import { listSales } from "./sales.service";

export const queryKeys = {
  products: ["products"] as const,
  customers: ["customers"] as const,
  sales: ["sales"] as const,
  movements: ["movements"] as const,
  dashboard: ["dashboard"] as const,
};

export const productsQuery = queryOptions({ queryKey: queryKeys.products, queryFn: listProducts });
export const customersQuery = queryOptions({ queryKey: queryKeys.customers, queryFn: listCustomers });
export const salesQuery = queryOptions({ queryKey: queryKeys.sales, queryFn: listSales });
export const movementsQuery = queryOptions({ queryKey: queryKeys.movements, queryFn: listMovements });
export const dashboardQuery = queryOptions({
  queryKey: queryKeys.dashboard,
  queryFn: () => getDashboardStats(),
});
