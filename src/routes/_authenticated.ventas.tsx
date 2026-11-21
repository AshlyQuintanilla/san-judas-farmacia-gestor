import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Plus, Receipt, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { NewSaleDialog } from "@/components/sales/new-sale-dialog";
import { SaleDetailDialog } from "@/components/sales/sale-detail-dialog";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roundMoney } from "@/lib/business-rules";
import { formatMoney } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import { PAYMENT_LABELS, type PaymentMethod, type Sale } from "@/lib/types";
import { customersQuery, productsQuery, salesQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/ventas")({
  head: () => ({
    meta: [
      { title: "Ventas — Farmacia San Judas SIG" },
      { name: "description", content: "Registro y consulta de ventas de la farmacia." },
      { property: "og:title", content: "Ventas — Farmacia San Judas SIG" },
      { property: "og:description", content: "Registra nuevas ventas y consulta el historial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(salesQuery),
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(customersQuery),
    ]),
  component: SalesPage,
});

function SalesPage() {
  const { data: sales } = useSuspenseQuery(salesQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todas");
  const [payment, setPayment] = useState("todos");
  const [newOpen, setNewOpen] = useState(false);
  const [detail, setDetail] = useState<Sale | null>(null);

  const filtered = useMemo(
    () =>
      sales.filter(
        (s) =>
          (status === "todas" || s.estado === status) &&
          (payment === "todos" || s.metodoPago === payment) &&
          matchesSearch(search, [s.numero, s.nombreCliente, s.vendedor, ...s.items.map((i) => i.nombreProducto)]),
      ),
    [sales, search, status, payment],
  );

  const summary = useMemo(() => {
    const done = filtered.filter((s) => s.estado === "completada");
    const total = roundMoney(done.reduce((sum, s) => sum + s.total, 0));
    return { total, count: done.length, avg: done.length ? roundMoney(total / done.length) : 0 };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Historial de ventas y registro de nuevas transacciones."
        icon={ShoppingCart}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus /> Nueva venta
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total vendido (filtro actual)" value={formatMoney(summary.total)} icon={Wallet} />
        <StatCard label="Ventas completadas" value={String(summary.count)} icon={Receipt} tone="info" />
        <StatCard label="Ticket promedio" value={formatMoney(summary.avg)} icon={TrendingUp} />
      </div>

      <Card className="shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por número, cliente o producto" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 bg-card md:w-44" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los estados</SelectItem>
              <SelectItem value="completada">Completadas</SelectItem>
              <SelectItem value="anulada">Anuladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="h-10 bg-card md:w-44" aria-label="Filtrar por método de pago">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los pagos</SelectItem>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground md:ml-auto">{filtered.length} resultados</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">N.º</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <EmptyRow colSpan={8} />}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="pl-6 font-medium">{s.numero}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(s.fecha)}</TableCell>
                <TableCell>{s.nombreCliente}</TableCell>
                <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                  {s.items.map((i) => `${i.cantidad}× ${i.nombreProducto}`).join(", ")}
                </TableCell>
                <TableCell>
                  <Badge variant="soft">{PAYMENT_LABELS[s.metodoPago]}</Badge>
                </TableCell>
                <TableCell>
                  {s.estado === "anulada" ? <Badge variant="danger">Anulada</Badge> : <Badge variant="success">Completada</Badge>}
                </TableCell>
                <TableCell className="text-right font-semibold tabular">{formatMoney(s.total)}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(s)}>
                    <Eye /> Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <NewSaleDialog open={newOpen} onOpenChange={setNewOpen} />
      <SaleDetailDialog sale={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}
