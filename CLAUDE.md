# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KI-Bild-Generator is a German-language AI image generator web application that allows users to virtually try on clothing. Users upload two images (a person and a clothing item), which are sent to an n8n webhook API that generates a composite image.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Tech Stack

- React 18 with TypeScript (strict mode)
- Vite for bundling and dev server
- Tailwind CSS for styling
- Axios for HTTP requests
- Lucide React for icons
- Supabase for authentication and database
- React Router DOM for routing

## Architecture

**Entry Flow:** `index.html` → `src/main.tsx` (BrowserRouter + AuthProvider) → `src/App.tsx` (Routes)

**Routing (App.tsx):**
- `/login` - Login page
- `/signup` - Registration page
- `/` - Generator page (protected, requires authentication)

**Authentication:**
- `src/lib/supabase.ts` - Supabase client initialization
- `src/contexts/AuthContext.tsx` - Auth state management (user, session, profile)
- `src/components/ProtectedRoute.tsx` - Route guard, redirects to /login if not authenticated
- `src/types/auth.ts` - TypeScript interfaces for auth

**Pages:**
- `src/pages/LoginPage.tsx` - Email/password login form
- `src/pages/SignupPage.tsx` - Registration with name, email, password
- `src/pages/GeneratorPage.tsx` - Main image generator with logout button

**Components:**
- `src/components/UploadZone.tsx` - Drag-and-drop file upload with preview
- `src/components/AuthLayout.tsx` - Layout wrapper for auth pages

## API Integration

The app calls `/api/webhook` (relative URL) which gets proxied to an n8n webhook:
- **Method:** POST with multipart/form-data (image1, image2 fields)
- **Response:** Blob (generated image)

### Development (localhost)
- Vite proxy handles requests (configured in `vite.config.ts`)
- Update `N8N_BASE_URL` and `WEBHOOK_PATH` constants for your n8n instance

### Production (Vercel)
- Vercel rewrites handle requests (configured in `vercel.json`)
- Update the `destination` URL to point to your n8n webhook

## Supabase Database

**Tables:**
- `profiles` - User profiles (id, created_at, email, full_name)
  - RLS enabled with policies for own profile access
  - Auto-created via trigger on auth.users insert

**Environment Variables (`.env.local` for dev, Vercel for prod):**
```
VITE_SUPABASE_URL=https://vrantxrshlibvndrywoc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deployment

Hosted on **Vercel** with automatic deployments from GitHub.

- `vercel.json` - Configures URL rewrites to proxy API requests to n8n
- Push to `main` branch triggers automatic redeploy
- Environment variables must be set in Vercel dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Code Conventions

- Functional components with hooks (no class components)
- TypeScript interfaces for component props
- Event handlers wrapped in useCallback
- UI text is in German
