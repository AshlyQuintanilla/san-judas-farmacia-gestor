# Cómo conectar la base de datos

La app funciona hoy con datos de ejemplo en memoria (`src/data/mock-data.ts`).
Toda lectura/escritura pasa por `src/services/*.service.ts`, y las páginas solo usan
las consultas de `src/services/queries.ts`.

Pasos al conectar la base de datos:

1. Crear las tablas de `esquema-propuesto.sql` (con permisos y políticas de seguridad).
2. Reemplazar el cuerpo de cada función en `src/services/*.service.ts` por consultas a la base de datos,
   manteniendo las mismas firmas y tipos de `src/lib/types.ts`.
3. Reemplazar `src/services/auth.service.ts` por el inicio de sesión real (correo y contraseña).
4. Eliminar `src/services/data-source.ts` y `src/data/mock-data.ts`.

Las páginas y componentes no necesitan cambios.
