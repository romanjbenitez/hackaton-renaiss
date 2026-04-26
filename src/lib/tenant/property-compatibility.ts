type CompatibilityShape = {
  compatibilityScore: number;
  explanation: string;
  matchPoints: string[];
  conflicts: string[];
};

type PersistedCompatibilitySource = {
  aiCompatibilityScore: number | null;
  aiCompatibilityExplanation: string | null;
  aiCompatibilityMatchPoints: string[] | null;
  aiCompatibilityConflicts: string[] | null;
} | null;

export function resolvePropertyCompatibility(
  latestApplication: PersistedCompatibilitySource,
  fallbackCompatibility: CompatibilityShape | null
) {
  if (latestApplication?.aiCompatibilityScore != null) {
    return {
      compatibilityScore: latestApplication.aiCompatibilityScore,
      explanation: latestApplication.aiCompatibilityExplanation ?? "",
      matchPoints: latestApplication.aiCompatibilityMatchPoints ?? [],
      conflicts: latestApplication.aiCompatibilityConflicts ?? [],
    } satisfies CompatibilityShape;
  }

  return fallbackCompatibility;
}
