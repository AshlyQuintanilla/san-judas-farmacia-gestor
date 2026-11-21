import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { computeSaleTotal, validateSaleItems } from "@/lib/business-rules";
import { formatMoney } from "@/lib/config";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/types";
import { customersQuery, productsQuery } from "@/services/queries";
import { createSale } from "@/services/sales.service";

const FINAL_CONSUMER = "consumidor-final";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSaleDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: customers } = useSuspenseQuery(customersQuery);

  const [clienteId, setClienteId] = useState(FINAL_CONSUMER);
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>("efectivo");
  const [lines, setLines] = useState<{ productoId: string; cantidad: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setClienteId(FINAL_CONSUMER);
      setMetodoPago("efectivo");
      setLines([]);
      setSelectedProduct("");
      setQty("1");
      setError(null);
    }
  }, [open]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const detailed = lines.flatMap((l) => {
    const p = productMap.get(l.productoId);
    return p ? [{ ...l, producto: p, precioUnitario: p.precioVenta }] : [];
  });
  const total = computeSaleTotal(detailed);

  const addLine = () => {
    const cantidad = Number(qty);
    if (!selectedProduct) return setError("Selecciona un producto.");
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setError("La cantidad debe ser mayor a cero.");
    const existing = lines.find((l) => l.productoId === selectedProduct);
    const next = existing
      ? lines.map((l) => (l.productoId === selectedProduct ? { ...l, cantidad: l.cantidad + cantidad } : l))
      : [...lines, { productoId: selectedProduct, cantidad }];
    const err = validateSaleItems(next, products);
    if (err) return setError(err);
    setLines(next);
    setSelectedProduct("");
    setQty("1");
    setError(null);
  };

  const changeQty = (productoId: string, delta: number) => {
    const next = lines
      .map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + delta } : l))
      .filter((l) => l.cantidad > 0);
    const err = next.length ? validateSaleItems(next, products) : null;
    if (err) return setError(err);
    setLines(next);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: async (sale) => {
      await qc.invalidateQueries();
      toast.success(`Venta ${sale.numero} registrada`, { description: formatMoney(sale.total) });
      onOpenChange(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const save = () => {
    const err = validateSaleItems(lines, products);
    if (err) return setError(err);
    mutation.mutate({
      clienteId: clienteId === FINAL_CONSUMER ? null : clienteId,
      metodoPago,
      items: lines,
      vendedor: user?.nombre ?? "Usuario",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva venta</DialogTitle>
          <DialogDescription>Selecciona el cliente, agrega productos y guarda la venta.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cliente" htmlFor="v-cliente">
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger id="v-cliente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FINAL_CONSUMER}>Consumidor final</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Método de pago" htmlFor="v-pago">
            <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as PaymentMethod)}>
              <SelectTrigger id="v-pago">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-3 sm:flex-row sm:items-end">
          <FormField label="Producto" htmlFor="v-producto" className="flex-1">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="v-producto" className="bg-card">
                <SelectValue placeholder="Buscar producto" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.stock > 0)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} — {formatMoney(p.precioVenta)} (stock {p.stock})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Cantidad" htmlFor="v-cantidad" className="sm:w-28">
            <Input id="v-cantidad" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} className="bg-card" />
          </FormField>
          <Button type="button" variant="soft" onClick={addLine}>
            <Plus /> Agregar
          </Button>
        </div>

        <div className="max-h-64 overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailed.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Aún no hay productos en esta venta.
                  </TableCell>
                </TableRow>
              )}
              {detailed.map((l) => (
                <TableRow key={l.productoId}>
                  <TableCell className="font-medium">{l.producto.nombre}</TableCell>
                  <TableCell className="text-right tabular">{formatMoney(l.precioUnitario)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => changeQty(l.productoId, -1)} aria-label="Restar">
                        <Minus />
                      </Button>
                      <span className="w-8 text-center tabular">{l.cantidad}</span>
                      <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => changeQty(l.productoId, 1)} aria-label="Sumar">
                        <Plus />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular">
                    {formatMoney(l.cantidad * l.precioUnitario)}
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => changeQty(l.productoId, -l.cantidad)} aria-label="Quitar">
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Total a pagar: <span className="font-display text-2xl font-semibold text-foreground tabular">{formatMoney(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={mutation.isPending || lines.length === 0}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar venta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
