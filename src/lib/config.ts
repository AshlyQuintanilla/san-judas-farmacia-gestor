/** Configuración general de la aplicación. Cambia aquí la moneda o el país. */
export const APP_CONFIG = {
  name: "Farmacia San Judas",
  shortName: "SIG",
  fullName: "Farmacia San Judas SIG",
  locale: "es-NI",
  currency: "NIO",
  currencySymbol: "C$",
  /** Días antes del vencimiento para marcar un producto como "por vencer". */
  expiryWarningDays: 90,
} as const;

const moneyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(APP_CONFIG.locale);

export function formatMoney(value: number): string {
  return `${APP_CONFIG.currencySymbol} ${moneyFormatter.format(value)}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
