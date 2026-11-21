import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { fieldErrors, productSchema } from "@/lib/schemas";
import { PRODUCT_CATEGORIES, type Product, type ProductInput } from "@/lib/types";
import { createProduct, updateProduct } from "@/services/products.service";

type FormValues = {
  codigo: string;
  nombre: string;
  categoria: string;
  laboratorio: string;
  presentacion: string;
  precioCompra: string;
  precioVenta: string;
  stock: string;
  stockMinimo: string;
  fechaVencimiento: string;
  requiereReceta: boolean;
};

const empty: FormValues = {
  codigo: "",
  nombre: "",
  categoria: "",
  laboratorio: "",
  presentacion: "",
  precioCompra: "",
  precioVenta: "",
  stock: "",
  stockMinimo: "",
  fechaVencimiento: "",
  requiereReceta: false,
};

const toForm = (p: Product): FormValues => ({
  codigo: p.codigo,
  nombre: p.nombre,
  categoria: p.categoria,
  laboratorio: p.laboratorio,
  presentacion: p.presentacion,
  precioCompra: String(p.precioCompra),
  precioVenta: String(p.precioVenta),
  stock: String(p.stock),
  stockMinimo: String(p.stockMinimo),
  fechaVencimiento: p.fechaVencimiento,
  requiereReceta: p.requiereReceta,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const qc = useQueryClient();
  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(product ? toForm(product) : empty);
      setErrors({});
    }
  }, [open, product]);

  const mutation = useMutation({
    mutationFn: (input: ProductInput) => (product ? updateProduct(product.id, input) : createProduct(input)),
    onSuccess: async (saved) => {
      await qc.invalidateQueries();
      toast.success(product ? "Producto actualizado" : "Producto agregado", { description: saved.nombre });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Agregar producto"}</DialogTitle>
          <DialogDescription>Completa la información del medicamento o artículo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Código" htmlFor="codigo" error={errors["codigo"]}>
              <Input id="codigo" value={values.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="MED-025" />
            </FormField>
            <FormField label="Nombre" htmlFor="nombre" error={errors["nombre"]} className="sm:col-span-2">
              <Input id="nombre" value={values.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Acetaminofén 500 mg" />
            </FormField>
            <FormField label="Categoría" htmlFor="categoria" error={errors["categoria"]}>
              <Select value={values.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Laboratorio" htmlFor="laboratorio" error={errors["laboratorio"]}>
              <Input id="laboratorio" value={values.laboratorio} onChange={(e) => set("laboratorio", e.target.value)} />
            </FormField>
            <FormField label="Presentación" htmlFor="presentacion" error={errors["presentacion"]}>
              <Input id="presentacion" value={values.presentacion} onChange={(e) => set("presentacion", e.target.value)} placeholder="Caja 10 tabletas" />
            </FormField>
            <FormField label="Precio de compra (C$)" htmlFor="precioCompra" error={errors["precioCompra"]}>
              <Input id="precioCompra" type="number" min="0" step="0.01" value={values.precioCompra} onChange={(e) => set("precioCompra", e.target.value)} />
            </FormField>
            <FormField label="Precio de venta (C$)" htmlFor="precioVenta" error={errors["precioVenta"]}>
              <Input id="precioVenta" type="number" min="0" step="0.01" value={values.precioVenta} onChange={(e) => set("precioVenta", e.target.value)} />
            </FormField>
            <FormField label="Fecha de vencimiento" htmlFor="fechaVencimiento" error={errors["fechaVencimiento"]}>
              <Input id="fechaVencimiento" type="date" value={values.fechaVencimiento} onChange={(e) => set("fechaVencimiento", e.target.value)} />
            </FormField>
            <FormField label="Stock actual" htmlFor="stock" error={errors["stock"]}>
              <Input id="stock" type="number" min="0" step="1" value={values.stock} onChange={(e) => set("stock", e.target.value)} />
            </FormField>
            <FormField label="Stock mínimo" htmlFor="stockMinimo" error={errors["stockMinimo"]}>
              <Input id="stockMinimo" type="number" min="0" step="1" value={values.stockMinimo} onChange={(e) => set("stockMinimo", e.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
              <Checkbox checked={values.requiereReceta} onCheckedChange={(c) => set("requiereReceta", c === true)} />
              Requiere receta médica
            </label>
          </div>
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
