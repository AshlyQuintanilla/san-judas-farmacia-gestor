import { Badge } from "@/components/ui/badge";
import { stockStatus } from "@/lib/business-rules";
import type { Product } from "@/lib/types";

export function StockBadge({ product }: { product: Pick<Product, "stock" | "stockMinimo"> }) {
  const status = stockStatus(product);
  if (status === "agotado") return <Badge variant="danger">Agotado</Badge>;
  if (status === "bajo") return <Badge variant="warning">Bajo stock</Badge>;
  return <Badge variant="success">Disponible</Badge>;
}
