/**
 * Classi condivise per i pulsanti, pensate per essere applicate sia a
 * <button> che <a> (serve solo la stessa className, non un componente
 * polimorfico). Tre livelli di gerarchia visiva:
 *
 * - primary: l'unica azione principale per sezione (verde pieno)
 * - secondary: azioni di supporto (bordo, sfondo trasparente)
 * - ghost: azioni terziarie/di servizio (solo testo)
 */
export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-growth px-4 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-ink-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-paper-muted disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm text-paper-muted transition-colors hover:text-paper disabled:opacity-50",
  ghostDanger:
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm text-paper-muted transition-colors hover:text-caution disabled:opacity-50",
} as const;
