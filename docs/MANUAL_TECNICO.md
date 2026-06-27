# Manual Técnico — OpenGig

## Índice

1. [Requisitos del sistema](#1-requisitos-del-sistema)
2. [Configuración del entorno local](#2-configuración-del-entorno-local)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Base de datos y migraciones](#4-base-de-datos-y-migraciones)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Ejecución de pruebas](#6-ejecución-de-pruebas)
7. [Despliegue](#7-despliegue)
8. [Seguridad](#8-seguridad)

---

## 1. Requisitos del sistema

| Herramienta    | Versión mínima |
| -------------- | -------------- |
| Node.js        | 20 LTS         |
| npm            | 10             |
| Docker Desktop | 4.x            |
| Supabase CLI   | 2.x            |
| Git            | 2.x            |

---

## 2. Configuración del entorno local

### Instalación

```bash
git clone https://github.com/AlbertoFAz/opengig.git
cd opengig
npm install
cp .env.local.example .env.local
```

Editar `.env.local` con las credenciales de Supabase local (se obtienen tras `supabase start`).

### Supabase local

```bash
supabase start          # Levanta PostgreSQL, Auth, Storage en Docker
supabase db reset       # Aplica todas las migraciones + seed.sql
supabase stop           # Detiene los contenedores
```

Tras `supabase start`, la CLI imprime las URLs y claves necesarias para `.env.local`.

### Servidor de desarrollo

```bash
npm run dev             # http://localhost:3000
```

---

## 3. Variables de entorno

### Públicas (incluidas en el bundle del cliente)

| Variable                        | Descripción                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL base del proyecto Supabase (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon — autorización RLS desde el cliente              |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | Clave pública VAPID para suscripciones push                 |

### Privadas (solo servidor — nunca en el bundle)

| Variable                    | Descripción                                              |
| --------------------------- | -------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role — omite RLS, solo en Route Handlers   |
| `VAPID_PRIVATE_KEY`         | Clave privada VAPID para firmar notificaciones push      |
| `VAPID_EMAIL`               | Email de contacto para los servicios push (`mailto:...`) |

---

## 4. Base de datos y migraciones

Las migraciones están en `supabase/migrations/` con numeración de 4 cifras:

| Migración                     | Contenido                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| `0001_profiles.sql`           | Tabla `profiles`, trigger desde `auth.users`, RLS          |
| `0002_concerts.sql`           | Tabla `concerts`, RLS por rol y visibilidad                |
| `0003_calendar_entries.sql`   | Tabla `calendar_entries`, RLS por propietario              |
| `0004_likes.sql`              | Tabla `likes`, RLS por propietario                         |
| `0005_notifications.sql`      | Tabla `notifications`, RLS por propietario                 |
| `0006_concert_artists.sql`    | Tabla `concert_artists`, RLS por propietario del concierto |
| `0007_prestige.sql`           | Columna `prestige` en `profiles`, función de recálculo     |
| `0013_push_subscriptions.sql` | Tabla `push_subscriptions`, RLS por propietario            |

### Añadir una migración nueva

```bash
supabase migration new nombre_descriptivo
# Editar el fichero generado en supabase/migrations/
supabase db reset   # Aplicar localmente
```

**Nunca editar una migración ya commiteada.** Crear una nueva que corrija.

### Regenerar tipos TypeScript

```bash
supabase gen types typescript --local > src/types/database.types.ts
npm run typecheck   # Verificar que no hay errores
```

---

## 5. Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (public)/           # Rutas accesibles sin autenticación
│   ├── (authenticated)/    # Rutas protegidas (layout con guard)
│   ├── api/                # Route Handlers (iCal export, push)
│   └── auth/callback/      # Callback OAuth de Supabase
├── components/
│   ├── ui/                 # shadcn/ui — no modificar directamente
│   ├── concert/            # ConcertCard, ConcertForm, LikeButton
│   ├── calendar/           # PublicCalendar, PrivateCalendar
│   ├── auth/               # LoginForm, RegisterForm, ForgotPasswordForm
│   ├── layout/             # Header, Footer, UserMenu, NotificationBell
│   └── notifications/      # PushSubscriptionButton
├── lib/
│   ├── supabase/           # Clientes (browser, server, middleware)
│   ├── repositories/       # Acceso a BD tipado
│   ├── schemas/            # Esquemas Zod compartidos cliente/servidor
│   ├── icalendar.ts        # Generación de ficheros .ics
│   ├── ranking.ts          # Algoritmo de ordenación (Strategy)
│   └── utils.ts            # Helpers
├── i18n/
│   └── es.ts               # Todos los textos de la UI
└── types/
    └── database.types.ts   # Tipos generados desde Supabase
```

### Patrones de diseño aplicados

- **Repository** — `src/lib/repositories/` encapsula todas las operaciones a BD
- **Strategy** — `src/lib/ranking.ts` define `RankingStrategy` intercambiable
- **Factory Method** — `createClient()` con distintas implementaciones según contexto (browser/server)
- **Result Object** — `type Result<T, E>` en lugar de excepciones para errores esperados

---

## 6. Ejecución de pruebas

### Tests unitarios

```bash
npm run test:unit           # src/lib/, src/schemas/
```

### Tests de integración (RLS)

Requieren Supabase local en marcha:

```bash
supabase start
npm run test:integration    # tests/integration/rls/
```

Cubren todas las políticas RLS: lectura/escritura permitida y denegada por rol.

### Tests E2E (Playwright)

```bash
npm run dev &               # O usar PLAYWRIGHT_BASE_URL para apuntar a staging
npm run test:e2e
```

Cubren: carga de páginas públicas, redirección de rutas protegidas, formularios de auth, endpoints de export, accesibilidad WCAG 2.1 AA.

### Tests de accesibilidad

Incluidos en los tests E2E (`tests/e2e/accessibility.spec.ts`). Usan axe-core sobre las páginas públicas y reportan violaciones críticas y serias.

---

## 7. Despliegue

### Supabase Cloud

```bash
supabase login
supabase link --project-ref <ref>
supabase db push            # Aplica migraciones pendientes
supabase functions deploy send-push
```

Configurar en Supabase Cloud → Edge Functions → Secrets:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`

Configurar en Supabase Cloud → Database → Webhooks:

- Tabla: `notifications`, evento: `INSERT`
- URL: `https://<ref>.supabase.co/functions/v1/send-push`

### Vercel

Variables de entorno a configurar en Vercel → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`

El deploy se lanza automáticamente al hacer push a `main` mediante la integración GitHub de Vercel, reforzada por el workflow `.github/workflows/deploy.yml` (requiere secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` en el repositorio).

### Cloudflare

Cloudflare actúa como WAF delante de Vercel. Configuración necesaria:

- CNAME del dominio apuntando a `cname.vercel-dns.com` con proxy naranja activo
- SSL/TLS en modo **Full (strict)**
- Nameservers del dominio apuntando a los de Cloudflare

---

## 8. Seguridad

### Row Level Security

Toda tabla tiene RLS habilitado. Las políticas siguen el principio de mínimo privilegio:

- Los usuarios solo leen y modifican sus propios datos
- Los conciertos públicos son legibles por cualquiera (incluso anónimos)
- La `service_role` solo se usa en Route Handlers del servidor, nunca en el cliente

### Cabeceras de seguridad HTTP

Configuradas en `next.config.ts`:

- `Content-Security-Policy` — política estricta con `default-src 'self'`
- `Strict-Transport-Security` — HSTS con preload, 2 años
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — cámara, micrófono y geolocalización restringidos

### Autenticación

Delegada íntegramente a Supabase Auth (GoTrue). La sesión se gestiona mediante cookies HttpOnly (SSR) usando `@supabase/ssr`.
