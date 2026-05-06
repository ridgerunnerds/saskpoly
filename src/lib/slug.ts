export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = generateSlug(title);
  let slug = base;
  let counter = 1;

  while (await exists(slug)) {
    const suffix = `-${counter}-${Math.random().toString(36).slice(2, 6)}`;
    slug = base.slice(0, 80 - suffix.length) + suffix;
    counter++;
  }

  return slug;
}
