import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { customerSchema, fieldErrors } from "@/lib/schemas";
import type { Customer, CustomerInput } from "@/lib/types";
import { createCustomer, updateCustomer } from "@/services/customers.service";

const empty: CustomerInput = { nombre: "", cedula: "", telefono: "", email: "", direccion: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: Props) {
  const qc = useQueryClient();
  const [values, setValues] = useState<CustomerInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(
        customer
          ? {
              nombre: customer.nombre,
              cedula: customer.cedula,
              telefono: customer.telefono,
              email: customer.email,
              direccion: customer.direccion,
            }
          : empty,
      );
      setErrors({});
    }
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: (input: CustomerInput) =>
      customer ? updateCustomer(customer.id, input) : createCustomer(input),
    onSuccess: async (saved) => {
      await qc.invalidateQueries();
      toast.success(customer ? "Cliente actualizado" : "Cliente agregado", { description: saved.nombre });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof CustomerInput, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Agregar cliente"}</DialogTitle>
          <DialogDescription>Datos de contacto del cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Nombre completo" htmlFor="c-nombre" error={errors["nombre"]}>
            <Input id="c-nombre" value={values.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cédula o RUC" htmlFor="c-cedula" error={errors["cedula"]}>
              <Input id="c-cedula" value={values.cedula} onChange={(e) => set("cedula", e.target.value)} placeholder="001-010190-0001A" />
            </FormField>
            <FormField label="Teléfono" htmlFor="c-telefono" error={errors["telefono"]}>
              <Input id="c-telefono" value={values.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+505 8888-0000" />
            </FormField>
          </div>
          <FormField label="Correo electrónico (opcional)" htmlFor="c-email" error={errors["email"]}>
            <Input id="c-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </FormField>
          <FormField label="Dirección" htmlFor="c-direccion" error={errors["direccion"]}>
            <Textarea id="c-direccion" rows={2} value={values.direccion} onChange={(e) => set("direccion", e.target.value)} />
          </FormField>
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
