import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Pencil, Phone, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { EmptyRow } from "@/components/shared/empty-row";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import type { Customer } from "@/lib/types";
import { customersQuery, salesQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Farmacia San Judas SIG" },
      { name: "description", content: "Registro y consulta de clientes de la farmacia." },
      { property: "og:title", content: "Clientes — Farmacia San Judas SIG" },
      { property: "og:description", content: "Agrega, busca y edita los clientes de la farmacia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(customersQuery),
      context.queryClient.ensureQueryData(salesQuery),
    ]),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: customers } = useSuspenseQuery(customersQuery);
  const { data: sales } = useSuspenseQuery(salesQuery);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const statsByCustomer = useMemo(() => {
    const map = new Map<string, { compras: number; total: number; ultima: string | null }>();
    for (const s of sales) {
      if (!s.clienteId || s.estado !== "completada") continue;
      const entry = map.get(s.clienteId) ?? { compras: 0, total: 0, ultima: null };
      entry.compras += 1;
      entry.total += s.total;
      if (!entry.ultima || s.fecha > entry.ultima) entry.ultima = s.fecha;
      map.set(s.clienteId, entry);
    }
    return map;
  }, [sales]);

  const filtered = customers.filter((c) =>
    matchesSearch(search, [c.nombre, c.cedula, c.telefono, c.email, c.direccion]),
  );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes registrados.`}
        icon={Users}
        actions={
          <Button onClick={openNew}>
            <Plus /> Agregar cliente
          </Button>
        }
      />

      <Card className="shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, cédula o teléfono" />
          <p className="text-sm text-muted-foreground md:ml-auto">{filtered.length} resultados</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Cliente</TableHead>
              <TableHead>Cédula / RUC</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Compras</TableHead>
              <TableHead className="text-right">Total comprado</TableHead>
              <TableHead className="pr-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <EmptyRow colSpan={7} />}
            {filtered.map((c) => {
              const st = statsByCustomer.get(c.id);
              const initials = c.nombre
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("");
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {st?.ultima ? `Última compra: ${formatDate(st.ultima)}` : "Sin compras"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.cedula}</TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Phone className="size-3.5 text-muted-foreground" /> {c.telefono}
                    </p>
                    {c.email && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3.5" /> {c.email}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{c.direccion}</TableCell>
                  <TableCell className="text-right tabular">{st?.compras ?? 0}</TableCell>
                  <TableCell className="text-right font-medium tabular">{formatMoney(st?.total ?? 0)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editing} />
    </div>
  );
}
