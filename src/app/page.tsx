export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grid bg-grid p-8 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper-muted">
        FitQuest
      </span>
      <h1 className="font-display text-4xl font-bold text-paper">
        Il tuo avatar, i tuoi progressi
      </h1>
      <p className="max-w-md text-paper-muted">
        Crea il tuo avatar, imposta i tuoi obiettivi, e guardalo trasformarsi
        allenamento dopo allenamento.
      </p>
      <div className="flex gap-3">
        <a
          href="/register"
          className="rounded-md bg-growth px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Inizia ora
        </a>
        <a
          href="/login"
          className="rounded-md border border-ink-line px-5 py-2.5 text-sm text-paper-muted hover:text-paper"
        >
          Accedi
        </a>
      </div>
    </main>
  );
}
