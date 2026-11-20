// Tripwire: an icon name missing from Icon's MAP silently renders a "?"
// (HelpCircle) in production, so every literal name used in src must exist.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ICON_NAMES } from './Icon';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

const USAGE = [/<Icon\b[^>]*?\sname="([a-z0-9-]+)"/g, /\bicon: '([a-z0-9-]+)'/g];

describe('Icon', () => {
  it('maps every icon name used in the source', () => {
    const known = new Set(ICON_NAMES);
    const missing = new Set<string>();
    for (const file of sourceFiles(join(__dirname, '..'))) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of USAGE) {
        for (const match of source.matchAll(pattern)) {
          const name = match[1];
          if (name && !known.has(name)) missing.add(name);
        }
      }
    }
    expect([...missing].sort()).toEqual([]);
  });
});
