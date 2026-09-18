/** Minimal className joiner — avoids pulling in clsx for a one-line helper. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
