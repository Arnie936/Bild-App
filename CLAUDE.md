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

## Architecture

**Entry Flow:** `index.html` → `src/main.tsx` → `src/App.tsx`

**App.tsx** - Main component containing:
- State management via React hooks (useState, useCallback)
- Dual image upload handling with previews
- API integration with n8n webhook (POST multipart/form-data, blob response)
- Loading/error/success UI states

**src/components/UploadZone.tsx** - Reusable drag-and-drop file upload component with preview support

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

## Deployment

Hosted on **Vercel** with automatic deployments from GitHub.

- `vercel.json` - Configures URL rewrites to proxy API requests to n8n
- Push to `main` branch triggers automatic redeploy

## Code Conventions

- Functional components with hooks (no class components)
- TypeScript interfaces for component props
- Event handlers wrapped in useCallback
- UI text is in German
