import { TagColor, MenuTag } from '../types';

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badge: string;
}

export const TAG_COLOR_PALETTES: Record<TagColor, TagStyle> = {
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200 border-sky-300 dark:border-sky-700',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-200 border-orange-300 dark:border-orange-700',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200 border-teal-300 dark:border-teal-700',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200 border-red-300 dark:border-red-700',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60',
    text: 'text-fuchsia-800 dark:text-fuchsia-300',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/80 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-700',
  },
  lime: {
    bg: 'bg-lime-50 dark:bg-lime-950/60',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-200 dark:border-lime-800',
    dot: 'bg-lime-500',
    badge: 'bg-lime-100 text-lime-900 dark:bg-lime-950/80 dark:text-lime-200 border-lime-300 dark:border-lime-700',
  },
};

export const AVAILABLE_TAG_COLORS: { color: TagColor; label: string; bgSample: string }[] = [
  { color: 'amber', label: 'Amber / Gold', bgSample: 'bg-amber-500' },
  { color: 'rose', label: 'Rose / Pink', bgSample: 'bg-rose-500' },
  { color: 'emerald', label: 'Emerald / Green', bgSample: 'bg-emerald-500' },
  { color: 'purple', label: 'Purple / Violet', bgSample: 'bg-purple-500' },
  { color: 'sky', label: 'Sky / Cyan', bgSample: 'bg-sky-500' },
  { color: 'indigo', label: 'Indigo / Navy', bgSample: 'bg-indigo-500' },
  { color: 'orange', label: 'Orange / Warm', bgSample: 'bg-orange-500' },
  { color: 'teal', label: 'Teal / Sea', bgSample: 'bg-teal-500' },
  { color: 'red', label: 'Red / Spicy', bgSample: 'bg-red-500' },
  { color: 'fuchsia', label: 'Fuchsia / Magenta', bgSample: 'bg-fuchsia-500' },
  { color: 'lime', label: 'Lime / Fresh', bgSample: 'bg-lime-500' },
];

/**
 * Gets tag color styling from known tags or falls back to a deterministic color based on string hash.
 */
export function getTagStyle(tagName?: string, knownTags?: MenuTag[]): TagStyle {
  if (!tagName || typeof tagName !== 'string') {
    return TAG_COLOR_PALETTES.amber;
  }

  const cleanTagName = tagName.trim().toLowerCase();

  if (knownTags && Array.isArray(knownTags) && knownTags.length > 0) {
    const found = knownTags.find(t => t && t.name && typeof t.name === 'string' && t.name.trim().toLowerCase() === cleanTagName);
    if (found?.color && TAG_COLOR_PALETTES[found.color]) {
      return TAG_COLOR_PALETTES[found.color];
    }
  }

  // Predefined keyword color mapping
  const lower = cleanTagName;
  if (lower.includes('chef') || lower.includes('special')) return TAG_COLOR_PALETTES.amber;
  if (lower.includes('best') || lower.includes('popular') || lower.includes('love')) return TAG_COLOR_PALETTES.rose;
  if (lower.includes('organic') || lower.includes('vegan') || lower.includes('fresh') || lower.includes('green')) return TAG_COLOR_PALETTES.emerald;
  if (lower.includes('spicy') || lower.includes('hot') || lower.includes('fire') || lower.includes('chili')) return TAG_COLOR_PALETTES.red;
  if (lower.includes('wood') || lower.includes('baked') || lower.includes('oven')) return TAG_COLOR_PALETTES.orange;
  if (lower.includes('signature') || lower.includes('house') || lower.includes('artisan')) return TAG_COLOR_PALETTES.indigo;
  if (lower.includes('keto') || lower.includes('diet') || lower.includes('low')) return TAG_COLOR_PALETTES.sky;
  if (lower.includes('sea') || lower.includes('fish') || lower.includes('halal') || lower.includes('catch')) return TAG_COLOR_PALETTES.teal;
  if (lower.includes('nut') || lower.includes('allergy') || lower.includes('gluten')) return TAG_COLOR_PALETTES.purple;
  if (lower.includes('quick') || lower.includes('combo') || lower.includes('dessert')) return TAG_COLOR_PALETTES.fuchsia;
  if (lower.includes('jain') || lower.includes('pure')) return TAG_COLOR_PALETTES.lime;

  // Deterministic fallback by string hash
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorKeys: TagColor[] = ['amber', 'emerald', 'rose', 'purple', 'sky', 'indigo', 'orange', 'teal', 'red', 'fuchsia', 'lime'];
  const colorIndex = Math.abs(hash) % colorKeys.length;
  return TAG_COLOR_PALETTES[colorKeys[colorIndex]];
}
