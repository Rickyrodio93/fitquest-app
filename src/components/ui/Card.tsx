interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenitore standard per le sezioni delle pagine autenticate.
 * Bordo leggero, angoli morbidi, padding generoso — niente texture
 * a griglia qui (quella resta riservata alla scheda atleta, dove
 * rinforza l'identità "diario di allenamento" senza appesantire
 * il resto dell'interfaccia).
 */
export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-xl border border-ink-line/70 bg-ink-panel p-7 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-display text-base font-semibold text-paper">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
