import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, CalendarClock, Coins, PackagePlus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { MovementDialog } from "@/components/inventory/movement-dialog";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { StockBadge } from "@/components/shared/stock-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysUntil, inventoryValue, isExpiringSoon, isLowStock, stockStatus } from "@/lib/business-rules";
import { APP_CONFIG, formatMoney, formatNumber } from "@/lib/config";
import { formatDateOnly, formatDateTime } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import { MOVEMENT_LABELS, type MovementType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { movementsQuery, productsQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — Farmacia San Judas SIG" },
      { name: "description", content: "Existencias, alertas de bajo stock y movimientos de inventario." },
      { property: "og:title", content: "Inventario — Farmacia San Judas SIG" },
      { property: "og:description", content: "Controla existencias, vencimientos y movimientos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(movementsQuery),
    ]),
  component: InventoryPage,
});

const movementVariant: Record<MovementType, "success" | "danger" | "info" | "warning"> = {
  entrada: "success",
  salida: "danger",
  venta: "info",
  anulacion: "warning",
};

function InventoryPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: movements } = useSuspenseQuery(movementsQuery);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "bajo" | "vencer">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      valor: inventoryValue(products),
      unidades: products.reduce((s, p) => s + p.stock, 0),
      bajo: products.filter(isLowStock).length,
      vencer: products.filter((p) => isExpiringSoon(p)).length,
    }),
    [products],
  );

  const filteredProducts = products.filter(
    (p) =>
      (filter === "todos" || (filter === "bajo" ? isLowStock(p) : isExpiringSoon(p))) &&
      matchesSearch(search, [p.nombre, p.codigo, p.categoria]),
  );
  const filteredMovements = movements.filter((m) => matchesSearch(search, [m.nombreProducto, m.motivo, m.usuario]));

  const openMovement = (id: string | null) => {
    setProductId(id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Existencias, alertas y movimientos de productos."
        icon={Boxes}
        actions={
          <Button onClick={() => openMovement(null)}>
            <PackagePlus /> Registrar movimiento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Valor del inventario (costo)" value={formatMoney(stats.valor)} icon={Coins} />
        <StatCard label="Unidades en existencia" value={formatNumber(stats.unidades)} icon={Boxes} tone="info" />
        <StatCard label="Productos con bajo stock" value={String(stats.bajo)} icon={AlertTriangle} tone="warning" />
        <StatCard
          label="Por vencer"
          value={String(stats.vencer)}
          hint={`En los próximos ${APP_CONFIG.expiryWarningDays} días`}
          icon={CalendarClock}
          tone="danger"
        />
      </div>

      <Tabs defaultValue="existencias" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="existencias">Existencias</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto o movimiento" />
        </div>

        <TabsContent value="existencias">
          <Card className="shadow-card">
            <div className="flex flex-wrap gap-2 border-b p-4">
              {(
                [
                  ["todos", "Todos"],
                  ["bajo", "Bajo stock"],
                  ["vencer", "Por vencer"],
                ] as const
              ).map(([key, label]) => (
                <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>
                  {label}
                </Button>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Producto</TableHead>
                  <TableHead className="w-56">Nivel de stock</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 && <EmptyRow colSpan={7} />}
                {filteredProducts.map((p) => {
                  const status = stockStatus(p);
                  const days = daysUntil(p.fechaVencimiento);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.codigo} · {p.categoria}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={Math.min(100, (p.stock / Math.max(p.stockMinimo * 3, 1)) * 100)}
                          className={cn("h-2", status !== "normal" && "[&>div]:bg-warning", status === "agotado" && "[&>div]:bg-destructive")}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular">{p.stock}</TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">{p.stockMinimo}</TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDateOnly(p.fechaVencimiento)}</p>
                        {isExpiringSoon(p) && (
                          <p className="text-xs font-medium text-warning-foreground">
                            {days < 0 ? "Vencido" : `Vence en ${days} días`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StockBadge product={p} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openMovement(p.id)}>
                          <SlidersHorizontal /> Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="movimientos">
          <Card className="shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Stock resultante</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="pr-6">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 && <EmptyRow colSpan={7} message="No hay movimientos registrados." />}
                {filteredMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-6 text-sm text-muted-foreground">{formatDateTime(m.fecha)}</TableCell>
                    <TableCell className="font-medium">{m.nombreProducto}</TableCell>
                    <TableCell>
                      <Badge variant={movementVariant[m.tipo]}>{MOVEMENT_LABELS[m.tipo]}</Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular", m.cantidad < 0 ? "text-destructive" : "text-success")}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </TableCell>
                    <TableCell className="text-right tabular">{m.stockResultante}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.motivo}</TableCell>
                    <TableCell className="pr-6 text-sm">{m.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <MovementDialog open={dialogOpen} onOpenChange={setDialogOpen} productId={productId} />
    </div>
  );
}
