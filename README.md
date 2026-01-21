# KI-Bild-Generator

Eine Web-App zum virtuellen Anprobieren von Kleidung. Lade ein Foto von dir hoch, wähle ein Kleidungsstück, und die KI generiert ein Bild mit der Kleidung an dir.

## Features

- Virtuelles Anprobieren von Kleidung per KI
- Eigene Kleidungsbilder hochladen oder aus Galerie wählen
- Benutzerkonten mit E-Mail-Authentifizierung
- Monatliches Abo-Modell (19,99 EUR/Monat)

## Voraussetzungen

- Node.js 18+
- npm
- Supabase-Projekt (für Auth & Datenbank)
- Stripe-Konto (für Zahlungen)
- n8n-Instanz (für KI-Bildgenerierung)

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd bild-app

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
```

## Umgebungsvariablen

Bearbeite `.env.local` mit deinen Werten:

```env
# Supabase (aus Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Stripe Payment Link (aus Stripe Dashboard)
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/dein-link

# n8n Webhook (für lokale Entwicklung)
N8N_BASE_URL=https://deine-n8n-instanz.com
N8N_WEBHOOK_PATH=/webhook/deine-webhook-id
```

## Entwicklung

```bash
# Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter `http://localhost:5173`

## Produktions-Build

```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## Deployment (Vercel)

1. Repository mit Vercel verbinden
2. Umgebungsvariablen in Vercel setzen:

   | Variable | Beschreibung |
   |----------|--------------|
   | `VITE_SUPABASE_URL` | Supabase Projekt-URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Key |
   | `VITE_STRIPE_PAYMENT_LINK` | Stripe Payment Link URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
   | `N8N_WEBHOOK_URL` | Vollständige n8n Webhook URL |
   | `WEBHOOK_AUTH` | Auth-Token für n8n |
   | `STRIPE_SECRET_KEY` | Stripe Secret Key |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret |

3. Deployen - fertig!

## Supabase einrichten

### Tabellen erstellen

**profiles:**
```sql
create table profiles (
  id uuid references auth.users primary key,
  created_at timestamptz default now(),
  email text,
  full_name text
);

-- Trigger für automatische Profilerstellung
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**subscriptions:**
```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### URL-Konfiguration

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://deine-domain.vercel.app`
- Redirect URLs: `https://deine-domain.vercel.app/**`

## Stripe einrichten

1. Produkt erstellen: "KI-Bild-Generator Abo" - 19,99 EUR/Monat
2. Payment Link für das Produkt erstellen
3. Success URL setzen: `https://deine-domain.vercel.app/success`
4. Webhook hinzufügen: `https://deine-domain.vercel.app/api/stripe-webhook`
5. Webhook-Events aktivieren:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Projektstruktur

```
├── api/                    # Vercel Serverless Functions
│   ├── webhook.ts          # n8n Proxy
│   └── stripe-webhook.ts   # Stripe Webhook Handler
├── public/
│   └── kleidung/           # Vordefinierte Kleidungsbilder
├── src/
│   ├── components/         # React Komponenten
│   ├── contexts/           # Auth Context
│   ├── pages/              # Seiten (Login, Generator, etc.)
│   └── lib/                # Supabase Client
└── ...
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth & DB)
- Stripe (Zahlungen)
- Vercel (Hosting)

## Lizenz

Privat - Alle Rechte vorbehalten
