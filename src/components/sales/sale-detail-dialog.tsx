import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { PAYMENT_LABELS, type Sale } from "@/lib/types";
import { cancelSale } from "@/services/sales.service";

interface Props {
  sale: Sale | null;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailDialog({ sale, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setConfirming(false), [sale]);

  const mutation = useMutation({
    mutationFn: (id: string) => cancelSale(id, user?.nombre ?? "Usuario"),
    onSuccess: async (s) => {
      await qc.invalidateQueries();
      toast.success(`Venta ${s.numero} anulada`, { description: "Los productos regresaron al inventario." });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={sale !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {sale && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                Venta {sale.numero}
                {sale.estado === "anulada" ? <Badge variant="danger">Anulada</Badge> : <Badge variant="success">Completada</Badge>}
              </DialogTitle>
              <DialogDescription>{formatDateTime(sale.fecha)}</DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-3 gap-4 rounded-xl bg-muted/60 p-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Cliente</dt>
                <dd className="font-medium">{sale.nombreCliente}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Método de pago</dt>
                <dd className="font-medium">{PAYMENT_LABELS[sale.metodoPago]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Atendió</dt>
                <dd className="font-medium">{sale.vendedor}</dd>
              </div>
            </dl>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((i) => (
                  <TableRow key={i.productoId}>
                    <TableCell className="font-medium">{i.nombreProducto}</TableCell>
                    <TableCell className="text-right tabular">{i.cantidad}</TableCell>
                    <TableCell className="text-right tabular">{formatMoney(i.precioUnitario)}</TableCell>
                    <TableCell className="text-right tabular">{formatMoney(i.subtotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-display text-lg font-semibold tabular">
                    {formatMoney(sale.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <DialogFooter className="gap-2">
              {sale.estado === "completada" &&
                (confirming ? (
                  <>
                    <p className="mr-auto self-center text-sm text-muted-foreground">¿Confirmas anular esta venta?</p>
                    <Button variant="outline" onClick={() => setConfirming(false)}>
                      No
                    </Button>
                    <Button variant="destructive" onClick={() => mutation.mutate(sale.id)} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="animate-spin" /> : <Ban />}
                      Sí, anular
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="text-destructive" onClick={() => setConfirming(true)}>
                    <Ban /> Anular venta
                  </Button>
                ))}
              {!confirming && <Button onClick={() => onOpenChange(false)}>Cerrar</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
