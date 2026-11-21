/**
 * Autenticación TEMPORAL (sin base de datos).
 * TODO Supabase: reemplazar por supabase.auth.signInWithPassword / signOut / getUser.
 */
import type { AppUser } from "@/lib/types";
import { simulateLatency } from "./data-source";

const STORAGE_KEY = "sanjudas-sig-session";

export const DEMO_CREDENTIALS = { email: "gerente@sanjudas.com", password: "admin123" } as const;

const DEMO_USER: AppUser = {
  id: "usr_gerente",
  nombre: "Carmen Reyes",
  email: DEMO_CREDENTIALS.email,
  rol: "Gerente",
};

export async function signIn(email: string, password: string): Promise<AppUser> {
  await simulateLatency(500);
  if (
    email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
  return DEMO_USER;
}

export async function signOut(): Promise<void> {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUser(): AppUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}
