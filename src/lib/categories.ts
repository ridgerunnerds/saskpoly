export const ALLOWED_CATEGORIES = ["Politics", "Weather", "Entertainment", "Other"] as const;

export const BLOCKED_CATEGORIES = ["Sports", "Football", "Hockey", "Darts", "Basketball", "Baseball", "Soccer"];

export function isSportsCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return BLOCKED_CATEGORIES.some((c) => normalized.includes(c.toLowerCase()));
}
