import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyRow({ colSpan, message = "No se encontraron resultados." }: { colSpan: number; message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}
