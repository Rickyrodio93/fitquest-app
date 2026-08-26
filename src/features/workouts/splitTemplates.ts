import { SplitTemplate } from "./types";

/**
 * Split disponibili. La scelta di quale usare dipende da livello +
 * giorni/settimana desiderati (vedi selectSplitTemplate in generator.ts).
 *
 * Principio: più l'utente è esperto e ha giorni disponibili, più lo
 * split si "specializza" (full body -> upper/lower -> push/pull/legs),
 * seguendo le linee guida standard di programmazione dell'allenamento.
 */
export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    level: "BEGINNER",
    daysPerWeek: 2,
    sessions: [
      { title: "Full Body A", targetMuscleGroups: ["CHEST", "BACK", "LEGS", "CORE"] },
      { title: "Full Body B", targetMuscleGroups: ["SHOULDERS", "ARMS", "LEGS", "CORE"] },
    ],
  },
  {
    level: "BEGINNER",
    daysPerWeek: 3,
    sessions: [
      { title: "Full Body A", targetMuscleGroups: ["CHEST", "BACK", "LEGS", "CORE"] },
      { title: "Full Body B", targetMuscleGroups: ["SHOULDERS", "ARMS", "LEGS", "CORE"] },
      { title: "Full Body C", targetMuscleGroups: ["CHEST", "BACK", "LEGS", "CARDIO"] },
    ],
  },
  {
    level: "INTERMEDIATE",
    daysPerWeek: 4,
    sessions: [
      { title: "Upper A", targetMuscleGroups: ["CHEST", "BACK", "ARMS"] },
      { title: "Lower A", targetMuscleGroups: ["LEGS", "CORE"] },
      { title: "Upper B", targetMuscleGroups: ["SHOULDERS", "BACK", "ARMS"] },
      { title: "Lower B", targetMuscleGroups: ["LEGS", "CORE", "CARDIO"] },
    ],
  },
  {
    level: "INTERMEDIATE",
    daysPerWeek: 3,
    sessions: [
      { title: "Full Body A", targetMuscleGroups: ["CHEST", "BACK", "LEGS"] },
      { title: "Full Body B", targetMuscleGroups: ["SHOULDERS", "ARMS", "LEGS", "CORE"] },
      { title: "Full Body C", targetMuscleGroups: ["CHEST", "BACK", "LEGS", "CARDIO"] },
    ],
  },
  {
    level: "ADVANCED",
    daysPerWeek: 5,
    sessions: [
      { title: "Push (Petto/Spalle/Tricipiti)", targetMuscleGroups: ["CHEST", "SHOULDERS", "ARMS"] },
      { title: "Pull (Schiena/Bicipiti)", targetMuscleGroups: ["BACK", "ARMS"] },
      { title: "Legs (Gambe/Core)", targetMuscleGroups: ["LEGS", "CORE"] },
      { title: "Push (variante)", targetMuscleGroups: ["CHEST", "SHOULDERS", "ARMS"] },
      { title: "Pull (variante)", targetMuscleGroups: ["BACK", "ARMS", "CARDIO"] },
    ],
  },
  {
    level: "ADVANCED",
    daysPerWeek: 6,
    sessions: [
      { title: "Push A", targetMuscleGroups: ["CHEST", "SHOULDERS", "ARMS"] },
      { title: "Pull A", targetMuscleGroups: ["BACK", "ARMS"] },
      { title: "Legs A", targetMuscleGroups: ["LEGS", "CORE"] },
      { title: "Push B", targetMuscleGroups: ["CHEST", "SHOULDERS", "ARMS"] },
      { title: "Pull B", targetMuscleGroups: ["BACK", "ARMS", "CARDIO"] },
      { title: "Legs B", targetMuscleGroups: ["LEGS", "CORE", "CARDIO"] },
    ],
  },
];

/**
 * Seleziona lo split più adatto: prima cerca una corrispondenza esatta
 * (livello + giorni), altrimenti sceglie lo split dello stesso livello
 * con il numero di giorni più vicino a quello richiesto.
 */
export function selectSplitTemplate(level: string, daysPerWeek: number): SplitTemplate {
  const exact = SPLIT_TEMPLATES.find((t) => t.level === level && t.daysPerWeek === daysPerWeek);
  if (exact) return exact;

  const sameLevel = SPLIT_TEMPLATES.filter((t) => t.level === level);
  const pool = sameLevel.length > 0 ? sameLevel : SPLIT_TEMPLATES;

  return pool.reduce((closest, current) =>
    Math.abs(current.daysPerWeek - daysPerWeek) < Math.abs(closest.daysPerWeek - daysPerWeek)
      ? current
      : closest
  );
}
