import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/lib/auth";
import { fieldErrors, movementSchema } from "@/lib/schemas";
import { productsQuery } from "@/services/queries";
import { registerMovement } from "@/services/inventory.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export function MovementDialog({ open, onOpenChange, productId }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: products } = useSuspenseQuery(productsQuery);
  const [values, setValues] = useState({ productoId: "", tipo: "entrada" as "entrada" | "salida", cantidad: "", motivo: "Compra a proveedor" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues({ productoId: productId ?? "", tipo: "entrada", cantidad: "", motivo: "Compra a proveedor" });
      setErrors({});
    }
  }, [open, productId]);

  const current = products.find((p) => p.id === values.productoId);

  const mutation = useMutation({
    mutationFn: registerMovement,
    onSuccess: async (m) => {
      await qc.invalidateQueries();
      toast.success("Movimiento registrado", { description: `${m.nombreProducto}: stock ${m.stockResultante}` });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = movementSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    mutation.mutate({ ...parsed.data, usuario: user?.nombre ?? "Usuario" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar movimiento de inventario</DialogTitle>
          <DialogDescription>Entradas por compras o salidas por ajustes, vencimientos o mermas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Producto" htmlFor="m-producto" error={errors["productoId"]}>
            <Select value={values.productoId} onValueChange={(v) => setValues((s) => ({ ...s, productoId: v }))}>
              <SelectTrigger id="m-producto">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} (stock {p.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Tipo de movimiento" htmlFor="m-tipo">
            <ToggleGroup
              id="m-tipo"
              type="single"
              variant="outline"
              value={values.tipo}
              onValueChange={(v) => {
                if (v === "entrada" || v === "salida")
                  setValues((s) => ({ ...s, tipo: v, motivo: v === "entrada" ? "Compra a proveedor" : "Ajuste de inventario" }));
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="entrada" className="px-5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
                Entrada
              </ToggleGroupItem>
              <ToggleGroupItem value="salida" className="px-5 data-[state=on]:bg-destructive-soft data-[state=on]:text-destructive">
                Salida
              </ToggleGroupItem>
            </ToggleGroup>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <FormField label="Cantidad" htmlFor="m-cantidad" error={errors["cantidad"]}>
              <Input id="m-cantidad" type="number" min="1" step="1" value={values.cantidad} onChange={(e) => setValues((s) => ({ ...s, cantidad: e.target.value }))} />
            </FormField>
            <FormField label="Motivo" htmlFor="m-motivo" error={errors["motivo"]}>
              <Input id="m-motivo" value={values.motivo} onChange={(e) => setValues((s) => ({ ...s, motivo: e.target.value }))} />
            </FormField>
          </div>
          {current && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Stock actual de <span className="font-medium text-foreground">{current.nombre}</span>: {current.stock} (mínimo {current.stockMinimo})
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
