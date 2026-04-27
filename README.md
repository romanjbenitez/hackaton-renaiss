# PropTech

## Demo

- Video demo: https://drive.google.com/file/d/1byoyVz0IQufkQLI7OusEBKEMOoxVbrxT/view?usp=sharing

Plataforma full-stack para gestión inmobiliaria con tres actores:

- `tenant`: onboarding, documentos, trust score, catálogo de propiedades y postulaciones
- `agency`: publicación de propiedades, gestión de candidatos y seguimiento de transacciones
- `admin`: aprobación de agencias y revisión de documentación sospechosa

La app combina `Next.js App Router`, `Prisma`, `PostgreSQL`, `Supabase` para auth/storage y análisis asistidos por IA con fallback local cuando el proveedor no está configurado.

## Stack actual

| Capa | Tecnología |
| --- | --- |
| App full-stack | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 + componentes UI propios |
| ORM / DB | Prisma + PostgreSQL |
| Auth / Storage | Supabase SSR + Supabase Storage |
| IA | `@ai-sdk/groq` + fallbacks locales |
| Charts | Recharts |
| CI | GitHub Actions |

## Qué resuelve el proyecto

- onboarding del inquilino con perfil y documentación
- scoring de confianza con explicación y sugerencias
- matching entre perfil y propiedad
- carga manual o desde plataforma de candidatos
- seguimiento de una transacción inmobiliaria por etapas
- portal público por token para compartir estado sin login

## Comportamiento por configuración

La app usa una sola base de código. No hay dos productos distintos ni dos builds separados.

Según las variables de entorno disponibles, algunas capacidades cambian de comportamiento:

- si `Supabase` no está configurado, la autenticación usa credenciales demo y cookies locales
- si `GROQ_API_KEY` no está configurada, los flujos de IA responden con fallback local
- si `Resend` no está configurado, las notificaciones por email no se ejecutan de punta a punta

## Setup local

### Prerequisitos

- Node.js 20+
- npm
- Docker + Docker Compose para el flujo local con Postgres

### Opción A: Docker Compose

La forma más simple para levantar la app con base de datos local.

```bash
cp .env.example .env
docker compose up --build
```

Esto levanta:

- `db`: PostgreSQL local
- `migrate`: `prisma migrate deploy` + `prisma db seed`
- `app`: Next.js en `http://localhost:3000`

### Opción B: desarrollo con Node.js

```bash
npm ci
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Si además querés usar Supabase Auth/Storage en local:

```bash
npm run supabase:sync-demo-users
```

## Variables de entorno

La referencia viva está en [.env.example](/home/unix/hackaton/proptech/.env.example:1). Las principales son:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="tenant-documents"

GROQ_API_KEY="your-groq-api-key"
# GROQ_MODEL="llama-3.3-70b-versatile"

RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

### Notas importantes

- Si `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están configuradas, la app usa autenticación demo local.
- Si `GROQ_API_KEY` no está configurada, los endpoints de IA responden con fallback local.
- `SUPABASE_SERVICE_ROLE_KEY` solo es necesaria para capacidades server-side como Storage y sincronización administrativa.

## Scripts útiles

```bash
npm run dev
npm run build
npm run start

npm run lint
npm run type-check
npm test

npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio

npm run supabase:sync-demo-users
npm run supabase:import-reference-agencies
```

## Calidad de código

El repo tiene una base explícita de calidad:

- `ESLint` para reglas estáticas
- `TypeScript strict`
- tests con `node:test`
- `Prisma` con schema y migraciones versionadas
- CI en GitHub Actions con `lint`, `type-check`, `test` y `build`

### Ejecutar chequeos locales

```bash
npm run lint
npm run type-check
npm test
```

## CI

El workflow principal está en [.github/workflows/ci.yml](/home/unix/hackaton/proptech/.github/workflows/ci.yml:1).

Se ejecuta en:

- `pull_request` a `main`
- `push` a `main`
- ejecución manual con `workflow_dispatch`

Checks actuales:

1. `npm ci`
2. `prisma generate`
3. `npm run lint`
4. `npm run type-check`
5. `npm test`
6. `npm run build`

Recomendación operativa:

- marcar `CI / Quality Checks` como required check en branch protection de `main`

## IA y fallbacks

La carpeta [src/lib/ai](/home/unix/hackaton/proptech/src/lib/ai) concentra prompts, schemas y parsing.

Casos de uso principales:

- `trust-score`
- `compatibility`
- `candidates-summary`
- `check-document`

Principio de diseño:

- la IA mejora la experiencia
- la IA no debe bloquear el flujo principal
- toda salida se valida y, si falla, se usa fallback local

## Seguridad y autorización

Se endurecieron especialmente las rutas de IA y sesión:

- la sesión server-side usa usuario verificado
- las rutas de IA validan rol y ownership antes de leer o persistir datos
- `tenant` y `agency` no pueden operar sobre recursos ajenos solo pasando IDs

Esto es especialmente importante en:

- [src/app/api/ai/trust-score/route.ts](/home/unix/hackaton/proptech/src/app/api/ai/trust-score/route.ts:1)
- [src/app/api/ai/check-document/route.ts](/home/unix/hackaton/proptech/src/app/api/ai/check-document/route.ts:1)
- [src/app/api/ai/compatibility/route.ts](/home/unix/hackaton/proptech/src/app/api/ai/compatibility/route.ts:1)
- [src/app/api/ai/candidates-summary/route.ts](/home/unix/hackaton/proptech/src/app/api/ai/candidates-summary/route.ts:1)

## Estructura

```text
src/
  app/
    (tenant)/
    (agency)/
    (admin)/
    api/
    auth/
    portal/[token]/
  components/
    tenant/
    agency/
    auth/
    ui/
  lib/
    ai/
    agency/
    auth/
    candidacies/
    catalogs/
    db/
    tenant/
    validations/
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  *.test.ts
```

## Datos de ejemplo

El seed crea datos suficientes para mostrar la app sin carga manual inicial:

- usuario admin
- agencias con distintos estados
- múltiples inquilinos con perfiles variados
- propiedades publicadas
- candidaturas y transacciones de ejemplo

## Estado actual de mantenibilidad

En esta iteración se mejoró:

- extracción de catálogos compartidos para propiedad/documentos
- componentes UI reutilizables para alerts, pills y stat cards
- reducción de componentes con demasiadas responsabilidades
- mejor coherencia entre lógica de negocio, tests y CI

Todavía queda espacio para crecer con:

- tests de autorización más profundos sobre rutas
- tests de componentes/UI
- tests end-to-end de flujos completos

## Credenciales demo

Cuando Supabase no está configurado, la pantalla `/login` muestra los accesos disponibles. Además el seed crea usuarios representativos como:

- `admin@proptech.ar`
- `contacto@remax-palermo.ar`

Las credenciales efectivas del modo demo están gestionadas por [src/lib/auth/demo-users.json](/home/unix/hackaton/proptech/src/lib/auth/demo-users.json:1).

## ¿Qué haríamos con un día más?

1. **Endurecer notificaciones reales con Resend**  
   El flujo base ya existe, pero falta cerrar la integración productiva completa: credenciales reales, manejo de errores, reintentos y validación del envío en escenarios clave.

2. **Calcular compatibilidad IA en background al crear una candidatura**  
   Hoy parte del análisis se resuelve on-demand. Con un job asincrónico o una cola simple, los badges y resúmenes quedarían listos sin depender de interacción posterior.

3. **Persistir histórico de evaluaciones IA**  
   Hoy el sistema prioriza el estado operativo actual. Falta guardar versiones históricas de score, compatibilidad y decisiones para auditoría, trazabilidad y análisis comparativo.

4. **Profundizar el catálogo de propiedades**  
   La base de búsqueda y filtros ya existe, pero se puede extender con criterios adicionales como superficie, expensas, ordenamientos más ricos y combinaciones de filtros más robustas.

5. **Agregar tests de integración del flujo de transacción**  
   El circuito de estados, notas, documentos y portal compartido es el núcleo operativo del producto y merece cobertura de integración o end-to-end para reducir regresiones.
