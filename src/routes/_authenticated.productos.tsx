import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Pencil, Pill, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StockBadge } from "@/components/shared/stock-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isExpiringSoon } from "@/lib/business-rules";
import { formatMoney } from "@/lib/config";
import { formatDateOnly } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { productsQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/productos")({
  head: () => ({
    meta: [
      { title: "Productos — Farmacia San Judas SIG" },
      { name: "description", content: "Catálogo de medicamentos y artículos de la farmacia." },
      { property: "og:title", content: "Productos — Farmacia San Judas SIG" },
      { property: "og:description", content: "Registra, busca y edita los productos de la farmacia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "todas" || p.categoria === category) &&
          matchesSearch(search, [p.nombre, p.codigo, p.laboratorio, p.presentacion]),
      ),
    [products, search, category],
  );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description={`${products.length} productos registrados en el catálogo.`}
        icon={Pill}
        actions={
          <Button onClick={openNew}>
            <Plus /> Agregar producto
          </Button>
        }
      />

      <Card className="shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, código o laboratorio" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 bg-card md:w-56" aria-label="Filtrar por categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground md:ml-auto">{filtered.length} resultados</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Código</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="pr-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <EmptyRow colSpan={8} />}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{p.codigo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.presentacion} · {p.laboratorio}
                      </p>
                    </div>
                    {p.requiereReceta && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <FileText className="size-4 text-info" aria-label="Requiere receta" />
                        </TooltipTrigger>
                        <TooltipContent>Requiere receta médica</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.categoria}</TableCell>
                <TableCell className="text-right font-medium tabular">{formatMoney(p.precioVenta)}</TableCell>
                <TableCell className="text-right tabular">{p.stock}</TableCell>
                <TableCell className={cn("text-sm", isExpiringSoon(p) ? "font-medium text-warning-foreground" : "text-muted-foreground")}>
                  {formatDateOnly(p.fechaVencimiento)}
                </TableCell>
                <TableCell>
                  <StockBadge product={p} />
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Pencil /> Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} />
    </div>
  );
}
