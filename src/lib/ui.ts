export type SemanticTone = "neutral" | "success" | "info" | "warning" | "danger";

const surfaceToneClasses: Record<SemanticTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
};

export function getSurfaceToneClasses(tone: SemanticTone) {
  return surfaceToneClasses[tone];
}

export const inputClassName = "border-input bg-background h-11 w-full rounded-2xl border px-4";

