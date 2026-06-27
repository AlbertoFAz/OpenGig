# OpenGig

Calendario colaborativo de conciertos en vivo. Artistas, salas y colaboradores publican eventos; los aficionados los consultan, valoran y exportan a sus calendarios personales.

Trabajo de Fin de Grado — Alberto Fernández Azcoaga  
Escuela de Ingeniería Informática, Universidad de Oviedo

---

## Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Validación**: Zod + react-hook-form
- **Tests**: Vitest (unit + integración) + Playwright (E2E) + axe-core (accesibilidad)
- **Despliegue**: Vercel + Cloudflare WAF

## Puesta en marcha local

### Requisitos previos

- Node.js 20+
- Docker Desktop (para Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/AlbertoFAz/opengig.git
cd opengig

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con los valores locales

# 4. Levantar Supabase local
supabase start

# 5. Aplicar migraciones y seed
supabase db reset

# 6. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable                        | Descripción                         |
| ------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon de Supabase      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clave service role (solo servidor)  |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | Clave pública VAPID para push       |
| `VAPID_PRIVATE_KEY`             | Clave privada VAPID (solo servidor) |
| `VAPID_EMAIL`                   | Email de contacto para push         |

Ver `.env.local.example` para los valores de desarrollo local.

## Scripts

| Comando             | Descripción                                 |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                      |
| `npm run build`     | Build de producción                         |
| `npm run lint`      | ESLint                                      |
| `npm run typecheck` | Verificación TypeScript                     |
| `npm test`          | Tests unitarios e integración               |
| `npm run test:e2e`  | Tests Playwright (requiere servidor arriba) |

## Documentación

- [Manual técnico](docs/MANUAL_TECNICO.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Arquitectura](docs/ARCHITECTURE.md)

## Licencia

Proyecto académico. Todos los derechos reservados.
