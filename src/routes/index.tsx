import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Boxes, Eye, EyeOff, Loader2, ShieldCheck, ShoppingCart } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BrandMark } from "@/components/shared/brand-logo";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { DEMO_CREDENTIALS } from "@/services/auth.service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Farmacia San Judas SIG" },
      {
        name: "description",
        content: "Accede al sistema de información gerencial de Farmacia San Judas.",
      },
      { property: "og:title", content: "Iniciar sesión — Farmacia San Judas SIG" },
      {
        property: "og:description",
        content: "Accede al sistema de información gerencial de Farmacia San Judas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  { icon: BarChart3, text: "Indicadores de ventas en tiempo real" },
  { icon: Boxes, text: "Control de inventario y alertas de bajo stock" },
  { icon: ShoppingCart, text: "Registro ágil de ventas y clientes" },
];

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-brand text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 pattern-cross" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <BrandMark className="bg-primary-foreground text-primary-deep" />
          <div>
            <p className="font-display text-lg font-semibold">Farmacia San Judas</p>
            <p className="text-sm opacity-75">Sistema de Información Gerencial</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Gestiona tu farmacia con información clara y al día.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-60">© {new Date().getFullYear()} Farmacia San Judas</p>
      </aside>

      <main className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <p className="font-display text-lg font-semibold">Farmacia San Judas SIG</p>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu cuenta de gerente.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <FormField label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@sanjudas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-card"
              />
            </FormField>
            <FormField label="Contraseña" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-card pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Ingresar
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed bg-card p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" /> Acceso de demostración
            </p>
            <p className="mt-2">
              Correo: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.email}</span>
            </p>
            <p>
              Contraseña: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.password}</span>
            </p>
            <Button
              type="button"
              variant="soft"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setEmail(DEMO_CREDENTIALS.email);
                setPassword(DEMO_CREDENTIALS.password);
              }}
            >
              Usar acceso de demostración
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
