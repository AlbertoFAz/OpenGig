# Arquitectura del sistema — OpenGig

## Visión general

OpenGig es una aplicación web progresiva (PWA) construida sobre Next.js 16 con App Router y Supabase como backend. La arquitectura sigue un modelo de cliente-servidor donde:

- El servidor (Next.js RSC + Route Handlers) gestiona el rendering inicial, la autenticación SSR y las operaciones sensibles
- El cliente (React) gestiona la interactividad
- Supabase actúa como backend completo: base de datos PostgreSQL, autenticación, almacenamiento y Edge Functions
- Cloudflare actúa como WAF delante del despliegue en Vercel

```
┌─────────────┐     HTTPS      ┌─────────────┐     ┌──────────────────┐
│   Navegador │ ─────────────► │  Cloudflare │────►│  Vercel (Next.js)│
│   / PWA     │                │     WAF     │     │  App Router      │
└─────────────┘                └─────────────┘     └────────┬─────────┘
                                                            │
                                                    ┌───────▼──────────┐
                                                    │  Supabase Cloud  │
                                                    │  PostgreSQL+RLS  │
                                                    │  Auth (GoTrue)   │
                                                    │  Storage         │
                                                    │  Edge Functions  │
                                                    └──────────────────┘
```

---

## Estructura de capas

### Capa de presentación

- **React Server Components (RSC)** — rendering en servidor, acceso directo a BD sin exponer claves
- **Client Components** — interactividad, formularios, estado local (`'use client'`)
- **shadcn/ui + Tailwind CSS** — sistema de diseño consistente

### Capa de aplicación

- **Route Handlers** (`src/app/api/`) — endpoints REST para exportación iCal y suscripciones push
- **Server Actions** — mutaciones desde formularios (donde aplica)
- **Repositories** (`src/lib/repositories/`) — acceso a datos tipado, desacopla páginas de Supabase

### Capa de datos

- **Supabase Client** — dos instancias: browser (`createBrowserClient`) y server (`createServerClient`)
- **Row Level Security** — toda la autorización se resuelve en la base de datos
- **Zod schemas** (`src/lib/schemas/`) — validación en cliente y servidor

---

## Patrones de diseño

### Repository

Todas las operaciones a base de datos se encapsulan en funciones tipadas en `src/lib/repositories/`. Las páginas y componentes nunca llaman directamente al cliente Supabase.

```
Page/Component → Repository → Supabase Client → PostgreSQL (con RLS)
```

Ventaja: el acceso a datos es testable, reutilizable y el tipado de retorno es explícito.

### Strategy (Algoritmo de ordenación)

`src/lib/ranking.ts` define la interfaz `RankingStrategy` y la implementación `WeightedLikesAndPrestige`. El algoritmo de ordenación del calendario es intercambiable sin modificar el código cliente.

```typescript
interface RankingStrategy {
  score(concert: ConcertWithLikes): number;
}

class WeightedLikesAndPrestige implements RankingStrategy {
  score(concert): number {
    /* likes * peso + prestigio_autor */
  }
}
```

### Factory Method

`src/lib/supabase/client.ts` y `src/lib/supabase/server.ts` exponen el mismo contrato (`SupabaseClient`) pero con implementaciones distintas según el contexto de ejecución (browser vs. servidor con cookies SSR).

### Result Object

Para errores esperados (credenciales incorrectas, acceso denegado) se usa un tipo Result en lugar de excepciones:

```typescript
type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };
```

Esto evita `try/catch` en el código de UI y hace explícito el flujo de error.

---

## Modelo de datos

```
profiles          concerts             calendar_entries
─────────         ────────             ────────────────
id (FK auth)      id                   id
username          name?                user_id → profiles
display_name      artist_name          concert_id → concerts
role              venue_name           added_at
prestige          date_time
avatar_url        description
                  visibility
                  created_by → profiles

likes             notifications        push_subscriptions
─────             ─────────────        ──────────────────
id                id                   id
user_id           user_id → profiles   user_id → profiles
concert_id        type                 endpoint
created_at        payload              p256dh
                  read                 auth
                  created_at           created_at

concert_artists
───────────────
concert_id → concerts
artist_id → profiles
```

### Row Level Security — resumen de políticas

| Tabla                | SELECT                                   | INSERT                         | UPDATE      | DELETE                    |
| -------------------- | ---------------------------------------- | ------------------------------ | ----------- | ------------------------- |
| `profiles`           | cualquiera                               | solo trigger interno           | propio      | —                         |
| `concerts`           | PUBLIC: cualquiera; PRIVATE: propietario | roles artista/sala/colaborador | propietario | propietario               |
| `calendar_entries`   | propio                                   | propio                         | —           | propio                    |
| `likes`              | cualquiera                               | propio (1 por concierto)       | —           | propio                    |
| `notifications`      | propio                                   | solo trigger interno           | propio      | propio                    |
| `push_subscriptions` | propio                                   | propio                         | —           | propio                    |
| `concert_artists`    | cualquiera                               | propietario del concierto      | —           | propietario del concierto |

---

## Flujos principales

### Autenticación

```
1. Usuario envía email + contraseña
2. Supabase Auth (GoTrue) valida y emite JWT
3. @supabase/ssr escribe las cookies de sesión (HttpOnly)
4. El middleware de Next.js refresca el token en cada request
5. Server Components leen la sesión desde las cookies
```

### Creación de concierto

```
1. ConcertForm (cliente) valida con Zod
2. Server Action / Route Handler valida de nuevo con Zod en servidor
3. Repository llama a supabase.from('concerts').insert(...)
4. RLS verifica que el usuario tiene rol artista/sala/colaborador
5. Trigger de BD inserta notificaciones para seguidores
6. Edge Function send-push recibe el webhook y envía notificaciones push
```

### Exportación iCal

```
1. Usuario pulsa "Exportar"
2. Route Handler GET /api/concerts/[id]/export.ics
3. Repository busca el concierto (RLS verifica visibilidad)
4. icalendar.ts genera el fichero .ics con la librería `ics`
5. Response con Content-Type: text/calendar
```

---

## Seguridad

### Cabeceras HTTP

Configuradas en `next.config.ts` para todas las rutas:

- **CSP**: `default-src 'self'` con excepciones explícitas para Supabase y assets inline
- **HSTS**: 2 años con `includeSubDomains` y `preload`
- **X-Frame-Options**: `DENY` — previene clickjacking
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: cámara, micrófono y pagos desactivados

### Principio de mínimo privilegio

- La `anon key` de Supabase solo tiene los permisos que RLS permite
- La `service_role key` únicamente se usa en Route Handlers del servidor, nunca llega al bundle del cliente
- Las claves VAPID privadas solo están disponibles en el servidor y en Edge Functions

### PWA y Service Worker

El service worker (gestionado por Serwist) opera en scope `/` y se limita a precaching de assets y estrategias de cache de red. No intercepta requests a Supabase ni a rutas API.

---

## CI/CD

```
Push a cualquier rama
        │
        ▼
  GitHub Actions CI
  ├── Lint (ESLint)
  ├── Typecheck (tsc)
  ├── Tests unitarios (Vitest)
  └── Build de producción
        │
        ▼ (solo main)
  GitHub Actions Deploy
  └── Vercel CLI → producción
        │
        ▼
  Vercel Edge Network
  └── Cloudflare WAF → usuario final
```
