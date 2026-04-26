# PropTech — Plataforma Inmobiliaria Inteligente

Plataforma full-stack que conecta inquilinos, inmobiliarias y administradores en un flujo operativo completo: pasaporte digital del inquilino, gestión de propiedades y candidaturas, tablero de transacción con historial de estados, portal compartido sin login y análisis con IA en cada etapa crítica del proceso.

---

## Setup local (desde cero)

### Prerequisitos

- Node.js 20+
- Docker + Docker Compose
- Una clave de API de GROK (gratuita en [x.ai](https://x.ai))

### Opción A — Docker Compose (recomendado)

```bash
git clone <repo-url>
cd proptech

# Crear .env para Docker Compose (ver sección Variables de entorno)
cp .env.example .env

# Levanta PostgreSQL, corre migraciones, seed y la app
docker compose up --build
```

La app queda en `http://localhost:3000`.
Las migraciones y el seed corren automáticamente en el servicio `migrate` antes de que la app arranque.

### Opción B — Desarrollo local con Supabase

```bash
npm install

# Configurar .env.local con DATABASE_URL y DIRECT_URL de Supabase
cp .env.example .env.local

# Aplicar migraciones
npx prisma migrate dev

# Cargar seed de demo
npx prisma db seed

# Iniciar dev server
npm run dev
```

### Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Inquilino | `monica.rosa.alustiza+13452513@demo.proptech.ar` | `demo-13452513` |
| Inmobiliaria | `contacto@remax-palermo.ar` | `demo-agency` |
| Admin | `admin@proptech.ar` | `demo-admin` |

> En modo demo (sin Supabase configurado), usá las credenciales listadas en `/login` para cada rol.

---

## Variables de entorno

```env
# PostgreSQL (Supabase — usar pgbouncer para runtime, conexión directa para migraciones)
DATABASE_URL="postgres://USER.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://USER.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# GROK AI (obligatorio para features de IA)
GROK_API_KEY="your-grok-api-key"
GROK_BASE_URL="https://api.x.ai/v1"

# Email — Resend (opcional; sin esto los emails se simulan en consola)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Stack y decisiones de arquitectura

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend + Backend | Next.js 14 App Router (full-stack) | RSC para cero JS donde no hace falta, Server Actions para mutaciones, un solo deploy |
| Estilos | Tailwind CSS + shadcn/ui | Velocidad de desarrollo, accesibilidad incluida |
| Base de datos | PostgreSQL + Prisma ORM | Tipado end-to-end desde schema hasta queries, migraciones versionadas |
| Auth + Storage | Supabase Auth | OAuth + email/password sin levantar servicio propio; storage mockeado como base64 para no perder tiempo en el hackathon |
| IA | GROK (xAI) vía Vercel AI SDK | Modelo gratuito con buen razonamiento; API compatible con OpenAI para migrar fácil |
| Deploy | Vercel | Zero-config para Next.js, preview deploys automáticos |
| CI/CD | GitHub Actions | Lint + build en PRs, deploy a Vercel en push a `main` |

### Decisiones clave

**Server Components por defecto:** Solo usamos `"use client"` donde hay estado o interacción (filtros, formularios reactivos). Esto reduce el JS enviado al browser y mejora el TTFB.

**Seed realista como inversión:** 20 inquilinos, 10 propiedades, 15 candidaturas y transacciones en distintas etapas permiten mostrar el producto en el video sin configuración manual.

**Mocking estratégico:** Storage de documentos usa base64 en DB en lugar de Supabase Storage. Ahorra integración compleja sin impactar la UX del demo.

**Zod en IA obligatorio:** Todos los responses de GROK pasan por schemas Zod con fallback. La IA nunca bloquea el flujo — si falla, hay un valor sensible por defecto.

---

## Features de IA

### 1. Score de confianza (`POST /api/ai/trust-score`)

Analiza la documentación cargada por el inquilino y devuelve un score estructurado:

```json
{
  "score": 0-100,
  "dimensions": {
    "docCompleteness": 0-100,
    "incomeConsistency": 0-100,
    "guaranteeType": 0-100,
    "platformHistory": 0-100
  },
  "improvementSuggestion": "Cargá tus últimos 3 recibos para subir de 54 a 78",
  "flags": ["Ingresos no verificables"]
}
```

El score se calcula al terminar el onboarding y se muestra desglosado por dimensión en el perfil. Si GROK no responde, `deriveTrustScoreFallback` calcula un score heurístico basado en completitud documental.

### 2. Compatibilidad perfil–propiedad (`POST /api/ai/compatibility`)

Cruza el perfil del inquilino con la ficha de compatibilidad de la propiedad:

```json
{
  "compatibilityScore": 0-100,
  "explanation": "El perfil tiene ingresos adecuados y garantía hipotecaria aceptada",
  "matchPoints": ["Garantía hipotecaria aceptada", "Score supera el mínimo"],
  "conflicts": ["Tiene mascotas — la propiedad no las acepta"]
}
```

Los resultados se cachean en el campo `aiCompatibilityScore` de la candidatura para evitar recalcular en cada render. El badge con tooltip aparece en la lista de candidatos de la inmobiliaria y en las tarjetas de propiedades del inquilino.

### 3. Resumen comparativo de candidatos (`POST /api/ai/candidates-summary`)

Compara los mejores candidatos de una propiedad y destaca al más fuerte:

```json
{
  "summary": "Martínez lidera con score 87 y garantía hipotecaria. González y Rodríguez son opciones sólidas.",
  "topCandidateId": "clx...",
  "highlights": [
    { "candidateId": "clx...", "strength": "Mayor score + mejor ratio ingreso/alquiler" }
  ]
}
```

Se genera on-demand desde el panel de candidatos para no consumir tokens innecesariamente. Incluye skeleton de loading mientras GROK procesa.

### 4. Detección de documentación sospechosa (`POST /api/ai/check-document`)

Evalúa si un comprobante de ingresos tiene señales de manipulación:

```json
{
  "suspicious": true,
  "confidence": 0.82,
  "reason": "El formato del recibo no coincide con el emisor declarado"
}
```

Si `suspicious: true` y `confidence > 0.7`, el documento se marca como `FLAGGED` y aparece en la cola de revisión del admin (`/admin/documents-queue`). El administrador puede aprobar o rechazar con una nota. El inquilino ve el badge "Revisión pendiente" en su listado de documentos.

---

## CI/CD

```
push a feature branch
  └─ GitHub Actions: lint (eslint) + build (next build) + type check (tsc --noEmit)

merge a main
  └─ Vercel: deploy automático a producción
  └─ Preview URL disponible en cada PR
```

Las migraciones de producción se aplican manualmente con `npx prisma migrate deploy` contra la DB de producción antes de cada deploy que cambia el schema.

---

## Estructura del proyecto

```
src/
  app/
    (tenant)/          → rutas del inquilino
    (agency)/          → rutas de la inmobiliaria
    (admin)/           → panel de administración
    api/ai/            → endpoints de IA (trust-score, compatibility, candidates-summary, check-document)
    portal/[token]/    → vista pública sin login para el seguimiento de transacciones
  components/
    tenant/            → componentes específicos del inquilino
    agency/            → componentes específicos de la inmobiliaria
    ui/                → componentes base (shadcn + propios)
  lib/
    ai/                → prompts, schemas Zod, cliente GROK
    agency/            → queries de propiedades y transacciones
    auth/              → helpers de Supabase Auth y sesión
    candidacies/       → service layer para candidaturas
    tenant/            → lógica de documentos, onboarding y scoring
prisma/
  schema.prisma        → modelo completo
  seed.ts              → 20 inquilinos + 10 propiedades + 15 candidaturas + transacciones
  migrations/          → historial de migraciones
```

---

## ¿Qué haríamos con un día más?

1. **Integración real de email con Resend** — el trigger ya existe y el template está definido; solo falta configurar la API key y testar el flujo completo de notificaciones.

2. **Compatibilidad IA calculada en background al crear candidatura** — hoy se calcula on-demand; con un job asincrónico (Vercel Cron o un queue simple), todos los candidatos tendrían el badge inmediatamente sin esperar interacción del usuario.

3. **Persistir resultados IA históricos por propiedad y candidatura** — hoy se muestran bien en la operación activa, pero falta una vista histórica para comparar evolución de scores y decisiones.

4. **Búsqueda y filtros avanzados en propiedades** — filtro por rango de precio, superficie y tipo de propiedad en la vista del inquilino para grandes catálogos.

5. **Tests de integración para el flujo de transacción** — el flujo de 5 etapas es el corazón del producto y merece un test end-to-end que cubra avance de estado + notificación + portal compartido.
