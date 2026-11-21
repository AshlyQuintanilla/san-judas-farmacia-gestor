-- Esquema propuesto para conectar Farmacia San Judas SIG a la base de datos.
-- Referencia: se aplicará como migración al activar la base de datos (no ejecutar a mano).
-- Cada tabla corresponde a un tipo de src/lib/types.ts.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  categoria text not null,
  laboratorio text not null,
  presentacion text not null,
  precio_compra numeric(12,2) not null check (precio_compra >= 0),
  precio_venta numeric(12,2) not null check (precio_venta > 0),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  fecha_vencimiento date not null,
  requiere_receta boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cedula text not null,
  telefono text not null,
  email text,
  direccion text,
  creado_en timestamptz not null default now()
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  fecha timestamptz not null default now(),
  cliente_id uuid references public.clientes(id) on delete set null,
  metodo_pago text not null check (metodo_pago in ('efectivo','tarjeta','transferencia')),
  total numeric(12,2) not null,
  estado text not null default 'completada' check (estado in ('completada','anulada')),
  vendedor_id uuid references auth.users(id)
);

create table public.detalle_venta (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id),
  tipo text not null check (tipo in ('entrada','salida','venta','anulacion')),
  cantidad integer not null,
  stock_resultante integer not null,
  motivo text not null,
  fecha timestamptz not null default now(),
  usuario_id uuid references auth.users(id)
);

-- Roles (gerente, cajero, bodega) en una tabla separada user_roles, con RLS en todas las tablas.
-- Registrar venta / anular venta: función SQL (RPC) que actualiza stock y movimientos en una transacción.
