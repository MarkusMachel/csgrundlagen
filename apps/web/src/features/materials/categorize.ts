import type { MaterialItem } from './types';

/** Tags that group content by origin rather than topic, never used as a category. */
const COLLECTION_TAGS = new Set(['ezCater prep']);

export const UNCATEGORIZED = '';

export interface MaterialCategory {
  name: string;
  /** URL fragment for the section, e.g. "async-concurrency". */
  slug: string;
  items: MaterialItem[];
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Files each material under one category: its broadest tag, i.e. the one
 * shared by the most materials, so each resource shows up in one section
 * instead of once per tag. Ties go to the alphabetically first tag.
 * Categories and their items are sorted alphabetically, like a wiki index.
 */
export function categorize(materials: MaterialItem[]): MaterialCategory[] {
  const tagCounts = new Map<string, number>();
  for (const m of materials) {
    for (const tag of m.tags) {
      if (!COLLECTION_TAGS.has(tag)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const byCategory = new Map<string, MaterialItem[]>();
  for (const m of materials) {
    const name = primaryCategory(m, tagCounts);
    byCategory.set(name, [...(byCategory.get(name) ?? []), m]);
  }

  return [...byCategory.entries()]
    .map(([name, items]) => ({
      name,
      slug: name ? slugify(name) : 'other',
      items: [...items].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => {
      if (!a.name) return 1; // "Other" goes last
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
}

function primaryCategory(m: MaterialItem, tagCounts: Map<string, number>) {
  let best = UNCATEGORIZED;
  for (const tag of m.tags) {
    if (COLLECTION_TAGS.has(tag)) continue;
    const n = tagCounts.get(tag) ?? 0;
    const bestN = tagCounts.get(best) ?? -1;
    if (n > bestN || (n === bestN && tag.localeCompare(best) < 0)) best = tag;
  }
  return best;
}
