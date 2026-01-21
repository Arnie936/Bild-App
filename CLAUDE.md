# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KI-Bild-Generator is a German-language AI image generator web application that allows users to virtually try on clothing. Users can upload a person image and either upload a clothing item or select from a pre-made clothing gallery. The images are sent to an n8n webhook API that generates a composite image.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Tech Stack

- React 18 with TypeScript (strict mode)
- Vite 5 for bundling and dev server
- Tailwind CSS for styling (custom colors: primary, accent, background)
- Axios for HTTP requests
- Lucide React for icons
- Supabase for authentication and database
- React Router DOM v7 for routing
- Stripe for payments (via Payment Links + server-side SDK for webhooks)

## Architecture

**Entry Flow:** `index.html` → `src/main.tsx` (BrowserRouter + AuthProvider) → `src/App.tsx` (Routes)

**Routing (App.tsx):**
- `/login` - Login page (public)
- `/signup` - Registration page (public)
- `/pricing` - Subscription page (ProtectedRoute - requires auth)
- `/success` - Payment success page (ProtectedRoute - requires auth)
- `/` - Generator page (ProtectedRoute - requires auth, subscription check done inside page)

**Note:** `SubscribedRoute` component exists but is not used in routing. Subscription validation happens inside GeneratorPage with conditional UI (shows error alert if not subscribed).

**Authentication & Subscriptions:**
- `src/lib/supabase.ts` - Supabase client initialization
- `src/contexts/AuthContext.tsx` - Auth + subscription state management with timeout handling
- `src/components/ProtectedRoute.tsx` - Route guard, redirects to /login if not authenticated
- `src/components/SubscribedRoute.tsx` - Route guard component (defined but unused in current routing)
- `src/types/auth.ts` - TypeScript interfaces for auth and subscriptions

**Pages:**
- `src/pages/LoginPage.tsx` - Email/password login form
- `src/pages/SignupPage.tsx` - Registration with name, email, password (validation: name ≥2 chars, password ≥6 chars)
- `src/pages/PricingPage.tsx` - Subscription pricing (19,99 EUR/month), polls for subscription status
- `src/pages/SuccessPage.tsx` - Post-payment confirmation with polling
- `src/pages/GeneratorPage.tsx` - Main image generator with clothing gallery, user greeting in footer

**Components:**
- `src/components/UploadZone.tsx` - Drag-and-drop file upload with preview
- `src/components/AuthLayout.tsx` - Layout wrapper for auth pages

## Generator Page Features

**Image Upload:**
- Two upload zones: Person image + Clothing item
- Max file size: 8MB per image
- Drag-and-drop or click to select

**Clothing Gallery:**
- 5 pre-made clothing items in `/public/kleidung/`
- Users can select from gallery instead of uploading
- Hardcoded in GeneratorPage as CLOTHING_ITEMS array

**UI Elements:**
- Centered header with app title
- Generate button with loading state
- Result image display with download button
- Footer: User greeting (email) + Logout button

## AuthContext Details

**State Management:**
- `user`, `session`, `profile`, `subscription`
- `loading` (auth initialization), `subscriptionLoading`
- `isSubscribed` computed from `subscription?.status === 'active'`

**Timeout & Error Handling:**
- 8-second timeout on subscription fetch (prevents hanging)
- 5-second fallback timeout for auth initialization
- 10-second fallback timeout for subscription loading
- Token refresh handling: keeps existing subscription data on TOKEN_REFRESHED event
- Error recovery: maintains existing subscription on failed refetch

**Methods:** `signUp`, `signIn`, `signOut`, `refreshSubscription`

## API Integration

The app calls `/api/webhook` (relative URL) which is handled by a Vercel serverless function:
- **Method:** POST with multipart/form-data (image1, image2 fields)
- **Authentication:** Bearer token (Supabase session) + server-side validation
- **Response:** Blob (generated image)
- **Max payload:** 8MB

**Serverless Function:** `api/webhook.ts`
- Validates user via Supabase auth
- Rate limiting (30 requests/minute per IP)
- Proxies request to n8n webhook
- All sensitive URLs/tokens loaded from environment variables

### Development (localhost)
- Vite proxy handles requests (configured in `vite.config.ts`)
- Set `N8N_BASE_URL` and `N8N_WEBHOOK_PATH` in `.env.local`

### Production (Vercel)
- Serverless function at `api/webhook.ts` handles requests
- Security headers configured in `vercel.json`

## Environment Variables

See `.env.example` for full template. Copy to `.env.local` for development.

**Client-side (VITE_ prefix, embedded at build time):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-payment-link-id
```

**Server-side (Vercel only, no VITE_ prefix):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
WEBHOOK_AUTH=your-secure-webhook-token
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-signing-secret
```

**Local development proxy:**
```
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_PATH=/webhook/your-webhook-id
```

## Supabase Database

**Tables:**
- `profiles` - User profiles (id, created_at, email, full_name)
  - RLS enabled with policies for own profile access
  - Auto-created via trigger on auth.users insert
- `subscriptions` - Stripe subscription status (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
  - RLS: Users can read own subscription, service role can manage all
  - Status: 'active', 'inactive', 'cancelled', 'past_due'

## Stripe Integration

**Pricing Model:** 19,99 EUR/month flat fee, unlimited image generation

**Flow:**
1. User signs up → redirected to `/pricing`
2. User clicks "Jetzt abonnieren" → redirected to Stripe Payment Link (new tab)
3. After payment → Stripe webhook updates `subscriptions` table
4. User redirected to `/success` → polls for subscription status (2s intervals, max 10 attempts)
5. Active subscription → access to Generator page

**Serverless Function:** `api/stripe-webhook.ts`
- Validates Stripe signature using `stripe` package
- Handles: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed
- Updates subscription status in Supabase using service role key

**Stripe Dashboard Setup:**
1. Create product "KI-Bild-Generator Abo" with monthly price 19,99 EUR
2. Create Payment Link for the product
3. Set success URL: `https://bild-app.vercel.app/success`
4. Add webhook endpoint: `https://bild-app.vercel.app/api/stripe-webhook`
5. Enable events: checkout.session.completed, customer.subscription.*, invoice.payment_failed

## Deployment

Hosted on **Vercel** with automatic deployments from GitHub.

- `vercel.json` - Configures:
  - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
  - SPA fallback (all routes → `/index.html` for React Router)
- `api/webhook.ts` - Serverless function for n8n proxy
- `api/stripe-webhook.ts` - Serverless function for Stripe webhooks
- Push to `main` branch triggers automatic redeploy
- All environment variables must be set in Vercel dashboard

**Supabase URL Configuration:**
- Site URL: `https://bild-app.vercel.app`
- Redirect URLs: `https://bild-app.vercel.app/**`, `http://localhost:5173/**`

## Project Structure

```
bild app/
├── api/
│   ├── webhook.ts            # n8n webhook proxy
│   └── stripe-webhook.ts     # Stripe webhook handler
├── public/
│   └── kleidung/             # Pre-made clothing images (5 items)
├── src/
│   ├── components/
│   │   ├── AuthLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SubscribedRoute.tsx (unused)
│   │   └── UploadZone.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── GeneratorPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── SuccessPage.tsx
│   ├── types/
│   │   └── auth.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

## Security

- No hardcoded secrets in source code (all via environment variables)
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- Server-side user validation via Supabase auth
- Rate limiting on webhook endpoint (30 req/min per IP)
- Stripe webhook signature validation
- Error messages sanitized (no stack traces in logs)
- Max upload size: 8MB

## Code Conventions

- Functional components with hooks (no class components)
- TypeScript interfaces for component props
- Event handlers wrapped in useCallback
- UI text is in German
- Promise.race pattern for timeout handling
