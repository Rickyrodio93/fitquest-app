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

## Setup locale con Neon (database gratuito)

### 1. Crea il database su Neon

1. Vai su [neon.com](https://neon.com) e registrati (gratuito, nessuna carta richiesta per il piano free)
2. Crea un nuovo progetto — dagli un nome tipo "fitquest"
3. Nella dashboard del progetto, copia la **connection string** mostrata (inizia con `postgresql://` e include già `?sslmode=require` alla fine — lasciala così, serve per la connessione sicura)

### 2. Configura il progetto

```bash
npm install
cp .env.example .env
```

Apri `.env` e incolla la connection string di Neon in `DATABASE_URL`:

```
DATABASE_URL="postgresql://tuo-utente:password@ep-xxxxx.neon.tech/neondb?sslmode=require"
```

Genera anche un valore per `NEXTAUTH_SECRET` (basta una stringa casuale):

```bash
# Su Mac/Linux/WSL:
openssl rand -base64 32
# Su Windows (PowerShell):
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

Incollalo in `.env` come `NEXTAUTH_SECRET`.

### 3. Crea le tabelle e popola con dati demo

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

Il seed crea un utente demo già pronto:
- **Email:** `demo@fitquest.app`
- **Password:** `demo1234`

Include avatar con storico, 3 obiettivi (2 attivi, 1 completato) e un piano di allenamento — utile per vedere subito l'app popolata invece di partire da zero.

### 4. Avvia l'app

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) e accedi con le credenziali demo, oppure registra un account nuovo.

> **Nota su Neon:** il piano gratuito "sospende" il database dopo un periodo di inattività — la prima richiesta dopo una pausa può risultare più lenta (qualche secondo) mentre si riattiva. È normale, non un errore.

## Prossimi passi

1. Motore di evoluzione dell'avatar (logica che trasforma i dati in
   variazione di `muscleLevel` / `fatLevel` / `staminaLevel`)
2. Sistema obiettivi (creazione, progress tracking, notifiche completamento)
3. Generatore piani di allenamento personalizzati
4. Integrazioni wearable (Google Health Connect via API, Apple Health via
   companion app iOS — HealthKit non è accessibile da web puro)
5. UI/UX: onboarding creazione avatar, dashboard, vista avatar 2D/3D
