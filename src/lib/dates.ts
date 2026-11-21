import { format } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (iso: string) => format(new Date(iso), "dd MMM yyyy", { locale: es });
export const formatDateTime = (iso: string) =>
  format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: es });
export const formatShortDay = (d: Date) => format(d, "EEE d", { locale: es });
export const formatLongToday = (d: Date) => {
  const text = format(d, "EEEE d 'de' MMMM, yyyy", { locale: es });
  return text.charAt(0).toUpperCase() + text.slice(1);
};
/** Para fechas sin hora (yyyy-mm-dd), evita el desfase por zona horaria. */
export const formatDateOnly = (isoDate: string) =>
  format(new Date(`${isoDate}T00:00:00`), "dd MMM yyyy", { locale: es });
