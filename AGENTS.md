# AGENTS.md

Este documento es el contexto operativo para cualquier agente de codificación que trabaje sobre este repositorio. Léelo entero antes de tocar código.

## El proyecto en una frase

**Calendario colaborativo de conciertos**: una aplicación web progresiva (PWA) donde artistas, salas y colaboradores publican conciertos en vivo y los aficionados los consultan, valoran y exportan a sus calendarios personales. Es el Trabajo de Fin de Grado de Alberto Fernández Azcoaga en la Escuela de Ingeniería Informática de la Universidad de Oviedo.

## Stack tecnológico

- **Lenguaje**: TypeScript en modo estricto (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`).
- **Framework web**: Next.js 14 con App Router y React Server Components.
- **Backend y base de datos**: Supabase (PostgreSQL + GoTrue + PostgREST + Realtime + Storage). La autorización se delega íntegramente a Row Level Security (RLS) en PostgreSQL.
- **Interfaz de usuario**: Tailwind CSS + shadcn/ui sobre Radix UI.
- **Formularios y validación**: react-hook-form + Zod, ambos en cliente y servidor.
- **Pruebas**: Vitest (unitarias e integración) + Playwright (extremo a extremo) + axe-core (accesibilidad).
- **CI/CD**: GitHub Actions. Despliegue a Vercel; migraciones a Supabase Cloud.
- **Seguridad en producción**: Cloudflare como WAF delante del despliegue.
- **Desarrollo local**: Docker (la CLI de Supabase levanta toda la pila localmente).

## Estructura del repositorio

```
.
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── (public)/                 # Rutas públicas
│   │   │   ├── concerts/
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── profile/
│   │   │   │   └── [username]/page.tsx
│   │   │   └── page.tsx              # Home con calendario público
│   │   ├── (authenticated)/          # Rutas protegidas
│   │   │   ├── concerts/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── me/
│   │   │   │   ├── calendar/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                      # Rutas API (serverless)
│   │   │   ├── concerts/[id]/export.ics/route.ts
│   │   │   └── me/calendar/export.ics/route.ts
│   │   ├── auth/callback/route.ts    # Callback OAuth
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── ui/                       # Componentes shadcn/ui (no editar)
│   │   ├── calendar/                 # PublicCalendar, PrivateCalendar
│   │   ├── concert/                  # ConcertForm, ConcertCard, LikeButton
│   │   ├── auth/                     # Forms de auth
│   │   └── layout/                   # Header, Footer, UserMenu, NotificationBell
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Cliente browser
│   │   │   ├── server.ts             # Cliente con cookies SSR
│   │   │   └── middleware.ts         # Refresco de sesión
│   │   ├── schemas/                  # Zod schemas
│   │   ├── icalendar.ts              # Generación de .ics
│   │   ├── ranking.ts                # Algoritmo de ordenación (Strategy)
│   │   └── utils.ts                  # Helpers genéricos
│   ├── types/
│   │   └── database.types.ts         # Tipos generados desde el esquema
│   └── middleware.ts                 # Middleware global Next.js
├── supabase/
│   ├── config.toml
│   ├── migrations/                   # SQL versionado (0001_..., 0002_..., ...)
│   ├── seed.sql                      # Datos de prueba opcionales
│   └── functions/                    # Edge Functions
├── tests/
│   ├── unit/                         # Vitest (lib/, schemas/)
│   ├── integration/                  # Vitest con Supabase local
│   │   └── rls/                      # Tests específicos de políticas RLS
│   └── e2e/                          # Playwright
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── icons/                        # Iconos PWA
├── docs/
│   ├── MANUAL_TECNICO.md
│   ├── MANUAL_USUARIO.md
│   └── ARCHITECTURE.md
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, tests
│       └── deploy.yml                # Despliegue a producción
├── README.md
└── AGENTS.md                         # Este fichero
```

## Comandos comunes

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Next.js en http://localhost:3000 |
| `supabase start` | Levanta Supabase local (Docker) |
| `supabase stop` | Detiene Supabase local |
| `supabase db reset` | Resetea la BD local aplicando todas las migraciones |
| `supabase migration new <nombre>` | Crea un nuevo fichero de migración |
| `supabase gen types typescript --local > src/types/database.types.ts` | Regenera los tipos TypeScript |
| `npm run lint` | ESLint sobre el código |
| `npm run typecheck` | TypeScript en modo verificación |
| `npm test` | Ejecuta tests unitarios e integración (Vitest) |
| `npm run test:unit` | Solo unitarios |
| `npm run test:integration` | Solo integración (requiere Supabase local arriba) |
| `npm run test:e2e` | Playwright (requiere dev server arriba) |
| `npm run build` | Build de producción |

## Convenciones que TIENES que seguir

### Estilo de código

1. **TypeScript estricto siempre**. Nada de `any`. Si necesitas escapar del sistema de tipos, usa `unknown` y narrow explícitamente.
2. **Imports absolutos** con el alias `@/` (configurado en `tsconfig.json`).
3. **Nombres**:
   - Componentes en PascalCase (`ConcertCard.tsx`).
   - Hooks empiezan por `use` (`useCurrentUser.ts`).
   - Constantes en SCREAMING_SNAKE_CASE.
   - Variables en camelCase.
   - Tablas SQL en snake_case singular o plural según convención existente (`concerts`, `calendar_entries`).
4. **Prefiere Server Components** sobre Client Components. Marca `'use client'` solo cuando sea estrictamente necesario (interacción, hooks).
5. **No uses `useEffect` para data fetching**. Usa Server Components o, en cliente, `useSWR`/`tanstack-query` solo cuando haga falta refetch.

### Patrones obligatorios

1. **Repository sobre Supabase**: encapsula las operaciones a la base de datos en funciones tipadas en `src/lib/repositories/`. Las páginas no llaman directamente al cliente Supabase, llaman al repositorio.
2. **Validación con Zod en cliente Y en servidor**. Nunca confíes solo en la validación de cliente.
3. **Errores con `Result<T, E>` en lugar de excepciones** para operaciones esperadas que pueden fallar (login con credenciales incorrectas, intento de modificar un concierto ajeno). Reserva las excepciones para errores realmente excepcionales.
4. **Internacionalización**: aunque la aplicación inicialmente está solo en castellano, mantén los textos en un único módulo (`src/i18n/es.ts`) para facilitar futuras traducciones.

### Reglas de seguridad

1. **Nunca pongas secretos en el código fuente**. Usa variables de entorno y `.env.local` (que está en `.gitignore`).
2. **Nunca uses la `service_role` de Supabase desde el cliente** ni la incluyas en el bundle. Solo es válida en Server Components, Route Handlers y Edge Functions.
3. **Nunca uses `dangerouslySetInnerHTML`** salvo que sea estrictamente necesario y la entrada esté sanitizada con DOMPurify.
4. **Nunca desactives copiar y pegar** en campos de contraseña (para no romper los gestores de contraseñas).
5. **No implementes tu propio sistema de autenticación**. Usa Supabase Auth.
6. **Todas las consultas a la base de datos deben ir parametrizadas** (el cliente Supabase ya lo hace por defecto; no construyas SQL manualmente con concatenación de strings).
7. **Toda nueva tabla debe tener RLS habilitado y políticas escritas** antes de hacer commit. Una tabla sin RLS en producción es una vulnerabilidad.

### Convenciones de commit

Usa **Conventional Commits** con scope de fase cuando aplique:

- `feat(phase-2): añadir CRUD de conciertos`
- `fix(phase-3): corregir cardinalidad en calendar_entries`
- `test(phase-5): añadir tests RLS para likes`
- `docs: actualizar AGENTS.md`
- `chore: actualizar dependencias`
- `refactor(phase-4): extraer lógica de perfil a hook`

### Convenciones de migraciones SQL

1. Cada migración tiene un número de 4 cifras y un nombre descriptivo: `0003_calendar_entries.sql`.
2. Cada migración debe ser **idempotente** cuando sea posible (uso de `CREATE TABLE IF NOT EXISTS`, `DROP TRIGGER IF EXISTS`).
3. **Habilita RLS en cada tabla nueva** en la misma migración que la crea: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
4. **Las políticas RLS van en la misma migración que la tabla**, no en una separada.
5. **Documenta cada política** con un comentario SQL explicando qué garantiza.
6. **No edites una migración después de hacerla commit**. Crea una nueva que corrija si hace falta.

### Convenciones de pruebas

1. **Una tabla con RLS sin tests de RLS no entra en `main`**. Para cada tabla, escribir tests que prueban como mínimo:
   - Lectura permitida según la política.
   - Lectura denegada según la política.
   - Modificación permitida según la política.
   - Modificación denegada según la política.
2. **Los tests E2E cubren los flujos críticos**: registro, login, crear concierto, dar like, exportar a iCal.
3. **No mockees Supabase en tests de integración**. Usa la instancia local.

## Cómo abordas una tarea

1. **Lee la planificación** (`Planificacion_fases_agente.md`) y localiza en qué fase estás.
2. **Verifica que las fases anteriores están completas** antes de empezar. Si detectas que algo crítico de una fase anterior está sin terminar, comunícalo y termina eso primero.
3. **Identifica los entregables esperados** de la fase y los criterios de aceptación.
4. **Crea una rama** `feat/phase-X-<descripción>` desde `main`.
5. **Implementa de forma incremental**, haciendo commits pequeños y coherentes.
6. **Antes de cada commit**, ejecuta `npm run lint && npm run typecheck && npm test`. Si falla, no hagas commit.
7. **Antes de abrir PR**, ejecuta también `npm run test:e2e` para no romper flujos críticos.
8. **Abre PR** describiendo qué se implementa, qué tests se han añadido y qué criterios de aceptación se cumplen.

## Cosas que NO debes hacer

- No introduzcas dependencias nuevas sin justificarlo explícitamente y sin verificar su tamaño, licencia y mantenimiento (último release < 12 meses, > 100 descargas semanales).
- No introduzcas bibliotecas de UI alternativas a shadcn/ui (no Material UI, no Chakra, no Ant Design).
- No introduzcas ORMs adicionales (no Prisma, no Drizzle): el cliente Supabase tipado es suficiente.
- No introduzcas estado global complejo (no Redux, no Zustand) hasta que se demuestre que hace falta. El estado del servidor (RSC + Supabase) cubre el 90% de los casos.
- No introduzcas tests "para subir cobertura" sin valor real. Prefiere tests que cubren reglas de negocio, validación y autorización.
- No empieces una fase nueva si la anterior tiene tests rojos.
- No publiques nada a producción saltándote el pipeline.

## Cuándo preguntar al humano

Pregunta (en un comentario del PR o en el chat) cuando:

- Detectes una contradicción entre la planificación y la documentación del proyecto.
- Una funcionalidad pueda implementarse de dos formas razonables y la planificación no especifica cuál.
- Encuentres una limitación técnica que requiera cambiar el alcance de la fase.
- Necesites credenciales o configuración externa que no esté ya en `.env.local.example`.
- Vayas a introducir una dependencia nueva que no sea trivial (más de 50 KB de bundle).

## Referencias

- Documentación oficial del proyecto: `Memoria_TFG_ensamblada.docx` en la raíz de la carpeta de trabajo.
- Planificación de fases: `Planificacion_fases_agente.md`.
- Plantilla y guía de estilos de TFG: `PlantillaTFGEII.DesarrolloV2ESP.docx`.
- Stack: https://nextjs.org/docs, https://supabase.com/docs, https://ui.shadcn.com.
- OWASP ASVS L1: https://owasp.org/www-project-application-security-verification-standard/.
