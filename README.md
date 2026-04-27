# PAKT — Connecte les ambitieux 🔥

> Plateforme de mise en relation entre personnes ambitieuses via un système de swipe type Tinder, avec messagerie temps réel intégrée.

---

## 🚀 Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | Next.js 14 (App Router) |
| Backend | API Routes Next.js |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Realtime | Supabase Realtime |
| Upload | Supabase Storage |
| State | Zustand |
| Animations | Framer Motion |
| Style | Tailwind CSS |

---

## ⚡ Installation rapide

### 1. Clone & install

```bash
git clone <repo>
cd pakt
npm install
```

### 2. Crée ton projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New project
2. Dans **SQL Editor**, exécute le fichier `supabase/migrations/001_initial_schema.sql`
3. Dans **Storage** → New bucket :
   - `avatars` (public: ✅)
   - `messages` (public: ✅)
4. Dans **Authentication → Providers** → Active Google OAuth

### 3. Configure les variables d'environnement

```bash
cp .env.example .env.local
```

Remplis `.env.local` avec tes valeurs Supabase :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure Google OAuth (optionnel)

Dans Supabase → Authentication → Providers → Google :
- Client ID et Client Secret depuis [Google Cloud Console](https://console.cloud.google.com)
- Redirect URL : `https://<project>.supabase.co/auth/v1/callback`

### 5. Lance l'app

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Structure du projet

```
pakt/
├── app/
│   ├── (app)/                # Pages authentifiées
│   │   ├── layout.tsx        # Shell avec nav bottom
│   │   ├── swipe/page.tsx    # Page de swipe principale
│   │   ├── matches/page.tsx  # Conversations
│   │   ├── chat/[id]/page.tsx# Chat individuel
│   │   ├── profile/page.tsx  # Profil & édition
│   │   └── settings/page.tsx # Paramètres & Premium
│   ├── auth/
│   │   ├── page.tsx          # Login / Signup
│   │   └── callback/route.ts # OAuth callback
│   ├── onboarding/page.tsx   # Onboarding multi-étapes
│   ├── loading/page.tsx      # Écran de chargement
│   ├── api/
│   │   ├── swipe/route.ts    # API swipe avec limite
│   │   └── profiles/route.ts # API profils
│   └── page.tsx              # Redirect logic
├── components/
│   ├── swipe/
│   │   ├── SwipeCard.tsx     # Carte draggable
│   │   └── MatchModal.tsx    # Modal de match
│   ├── chat/
│   │   └── ChatView.tsx      # Chat complet
│   └── providers/
│       └── SupabaseProvider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Client Supabase (browser)
│   │   ├── server.ts         # Client Supabase (server)
│   │   └── types.ts          # Types TypeScript
│   ├── store.ts              # État global Zustand
│   └── utils.ts              # Utilitaires
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 🎨 Design System

| Élément | Valeur |
|---------|--------|
| Fond | `#0a0a0a` |
| Accent | `#d4a853` (Or) |
| Police | Sora |
| Mode | Dark uniquement |
| Coins | 16-24px |

---

## 🔥 Features

### Swipe
- ✅ Glisser gauche (refus) / droite (like)
- ✅ Boutons d'action visibles
- ✅ Photos multiples avec navigation
- ✅ Badge "Cette personne vous a liké"
- ✅ Limite 10 swipes/jour (plan gratuit)
- ✅ Reset automatique chaque jour

### Matchs
- ✅ Détection automatique match réciproque (trigger SQL)
- ✅ Création conversation automatique
- ✅ Animation modal de match

### Messagerie
- ✅ Messages texte temps réel
- ✅ Envoi d'images
- ✅ Messages vocaux (hold-to-record)
- ✅ Envoi de fichiers (PDF, Word, etc.)
- ✅ Conversations matchées et directes
- ✅ Indicateur de temps
- ✅ Scroll automatique

### Profil
- ✅ Photos (jusqu'à 6)
- ✅ Bio, âge, ville, intérêts
- ✅ Édition complète in-app

### Plans
- ✅ Gratuit : 10 swipes/jour
- ✅ Premium : Swipes illimités + features avancées

---

## 🔧 Déploiement (Vercel)

```bash
npm run build
vercel deploy
```

Ajoute tes variables d'environnement dans le dashboard Vercel.

---

## 📱 PWA (Mobile)

L'app est configurée comme PWA. Sur mobile :
1. Ouvre dans Safari/Chrome
2. "Partager" → "Sur l'écran d'accueil"

---

## 💳 Intégration paiement (Stripe)

Dans `app/(app)/settings/page.tsx`, la fonction `handleUpgrade` simule actuellement une mise à niveau. Pour la production :

```typescript
// Remplace le setTimeout par:
const { data } = await fetch('/api/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({ plan: 'premium' })
})
window.location.href = data.checkoutUrl
```

---

**PAKT** — *Connecte les ambitieux* ⚡
