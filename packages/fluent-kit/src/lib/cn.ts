export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[] | Record<string, boolean | undefined | null>;

function flatten(v: ClassValue, out: string[]): void {
  if (!v && v !== 0) return;
  if (typeof v === 'string' || typeof v === 'number') { out.push(String(v)); return; }
  if (Array.isArray(v)) { for (const x of v) flatten(x, out); return; }
  if (typeof v === 'object') {
    for (const [k, on] of Object.entries(v)) if (on) out.push(k);
  }
}

/** Minimal clsx. Later args win only by ORDER, not specificity — precedence is the component's job. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  flatten(inputs, out);
  return out.join(' ');
}
