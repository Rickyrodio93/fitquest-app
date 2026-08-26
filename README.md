# FitQuest

App fitness basata su un avatar che evolve in base ai progressi reali dell'utente
(allenamenti svolti, obiettivi raggiunti, dati sincronizzati da wearable).

## Stack

- **Next.js 14 (App Router)** + TypeScript
- **PostgreSQL** + **Prisma** ORM
- **NextAuth (Auth.js)** — autenticazione (credenziali, estendibile a social login)
- **Tailwind CSS** — styling
- **Zustand** — state management lato client (es. stato avatar in tempo reale)

## Struttura cartelle

```
prisma/
  schema.prisma          Modello dati: User, Avatar, Goal, WorkoutPlan, ecc.

src/
  app/
    (auth)/               Pagine login/registrazione
    (dashboard)/          Area autenticata: dashboard, avatar, goals, workouts
    api/auth/[...nextauth]/  Endpoint autenticazione

  features/                Logica di business divisa per dominio
    avatar/                 Motore di evoluzione dell'avatar
    goals/                  Creazione e tracking obiettivi
    workouts/               Generazione piani di allenamento
    integrations/           Sincronizzazione wearable (Apple Health, Google Health...)

  lib/
    prisma.ts               Client Prisma singleton
    auth.ts                 Configurazione NextAuth

  components/ui/            Componenti UI riutilizzabili
```

## Modello dati (concetti chiave)

- **Avatar**: non è un'immagine statica, ma un insieme di parametri
  (`muscleLevel`, `fatLevel`, `staminaLevel` da 0 a 100). Il rendering
  visivo verrà generato/scelto in base a questi valori. Ogni cambiamento
  significativo viene salvato in `AvatarStateSnapshot` per mostrare lo
  storico dei progressi ("prima/dopo").

- **BodyMetric**: dati grezzi (peso, battito, calorie, passi...) importati
  da wearable o inseriti manualmente. Fonte tracciata (`MetricSource`).

- **Goal**: obiettivi con categoria (forza, resistenza, costanza, ecc.),
  valore target/attuale, e un campo `avatarImpact` che definisce come
  l'avatar deve cambiare al completamento.

- **WorkoutPlan / WorkoutSession / Exercise**: piani di allenamento
  strutturati, generabili in base a livello utente e obiettivo.

- **WearableIntegration**: token di connessione ai servizi esterni.

- **GymCheckIn**: supporto per l'uso in palestra (check-in su postazioni condivise).

## Setup locale

```bash
npm install
cp .env.example .env       # poi compila DATABASE_URL e NEXTAUTH_SECRET
npx prisma migrate dev     # crea le tabelle nel DB
npm run dev
```

Richiede un database PostgreSQL raggiungibile (locale, Docker, o servizio
cloud come Supabase/Neon/Railway).

## Prossimi passi

1. Motore di evoluzione dell'avatar (logica che trasforma i dati in
   variazione di `muscleLevel` / `fatLevel` / `staminaLevel`)
2. Sistema obiettivi (creazione, progress tracking, notifiche completamento)
3. Generatore piani di allenamento personalizzati
4. Integrazioni wearable (Google Health Connect via API, Apple Health via
   companion app iOS — HealthKit non è accessibile da web puro)
5. UI/UX: onboarding creazione avatar, dashboard, vista avatar 2D/3D
