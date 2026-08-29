import { buttonStyles } from "@/components/ui/buttonStyles";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 py-8 text-center">
      <span className="text-sm text-paper-muted">FitQuest</span>
      <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">
        Il tuo avatar, i tuoi progressi
      </h1>
      <p className="max-w-md text-paper-muted">
        Crea il tuo avatar, imposta i tuoi obiettivi, e guardalo trasformarsi
        allenamento dopo allenamento.
      </p>
      <div className="flex gap-3">
        <a href="/register" className={buttonStyles.primary}>
          Inizia ora
        </a>
        <a href="/login" className={buttonStyles.secondary}>
          Accedi
        </a>
      </div>
    </main>
  );
}
