import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StockBadge } from "@/components/shared/stock-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_CONFIG, formatMoney, formatNumber } from "@/lib/config";
import { formatDateTime, formatShortDay } from "@/lib/dates";
import { PAYMENT_LABELS } from "@/lib/types";
import { dashboardQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard gerencial — Farmacia San Judas SIG" },
      { name: "description", content: "Indicadores de ventas, productos, bajo stock y ventas recientes." },
      { property: "og:title", content: "Dashboard gerencial — Farmacia San Judas SIG" },
      { property: "og:description", content: "Indicadores clave de la farmacia en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const chartData = data.ventasUltimos7Dias.map((d) => ({
    dia: formatShortDay(new Date(d.fecha)),
    total: d.total,
  }));
  const semana = data.ventasUltimos7Dias.reduce((s, d) => s + d.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard gerencial"
        description="Resumen de la operación de la farmacia."
        icon={LayoutDashboard}
        actions={
          <Button asChild>
            <Link to="/ventas">
              <Receipt /> Ir a ventas
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={formatMoney(data.ventasHoy)}
          hint={`${data.transaccionesHoy} transacciones`}
          icon={Wallet}
        />
        <StatCard
          label="Ventas del mes"
          value={formatMoney(data.ventasMes)}
          hint={`Ticket promedio ${formatMoney(data.ticketPromedio)}`}
          icon={CalendarRange}
          tone="info"
        />
        <StatCard
          label="Productos registrados"
          value={formatNumber(data.productosRegistrados)}
          hint={`${data.totalClientes} clientes registrados`}
          icon={Package}
        />
        <StatCard
          label="Productos con bajo stock"
          value={formatNumber(data.productosBajoStock)}
          hint="Requieren reabastecimiento"
          icon={AlertTriangle}
          tone={data.productosBajoStock > 0 ? "warning" : "primary"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Ventas de los últimos 7 días</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Total de la semana: <span className="font-semibold text-foreground">{formatMoney(semana)}</span>
              </p>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={70}
                  stroke="var(--color-muted-foreground)"
                  tickFormatter={(v: number) => `${APP_CONFIG.currencySymbol} ${formatNumber(v)}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatMoney(v), "Ventas"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#ventasFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Productos con bajo stock</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventario">
                Ver todo <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.bajoStock.length === 0 && (
              <p className="text-sm text-muted-foreground">Todo el inventario está en niveles normales.</p>
            )}
            {data.bajoStock.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{p.nombre}</p>
                  <StockBadge product={p} />
                </div>
                <Progress value={Math.min(100, (p.stock / Math.max(p.stockMinimo, 1)) * 100)} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {p.stock} en existencia · mínimo {p.stockMinimo}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Ventas recientes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ventas">
                Ver ventas <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">N.º</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ventasRecientes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 font-medium">{s.numero}</TableCell>
                    <TableCell>{s.nombreCliente}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(s.fecha)}</TableCell>
                    <TableCell>
                      {s.estado === "anulada" ? (
                        <Badge variant="danger">Anulada</Badge>
                      ) : (
                        <Badge variant="soft">{PAYMENT_LABELS[s.metodoPago]}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-semibold tabular">{formatMoney(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Más vendidos del mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProductos.map((p, i) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.unidades} unidades</p>
                </div>
                <p className="text-sm font-semibold tabular">{formatMoney(p.total)}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
              <Users className="size-3.5" /> {data.totalClientes} clientes registrados
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
