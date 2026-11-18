// Tripwire for the app/[locale]/* restructure. Guards the five invariants
// the plan's "Review Focus" names, so an unrelated refactor can't silently
// break locale routing, drop the next-intl wiring, or sweep /api under
// [locale] (which would break every webhook, cron, and OAuth callback).

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import fastGlob from 'fast-glob';

const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const appDir = resolve(repoRoot, 'src/app');

describe('i18n routing invariants', () => {
  it('app/[locale] exists and app/api is still at root', () => {
    const entries = readdirSync(appDir);
    expect(entries).toContain('[locale]');
    expect(entries).toContain('api');
    expect(statSync(resolve(appDir, '[locale]')).isDirectory()).toBe(true);
    expect(statSync(resolve(appDir, 'api')).isDirectory()).toBe(true);
    expect(existsSync(resolve(appDir, '[locale]', 'api'))).toBe(false);
  });

  it('no client file imports Link from next/link anymore', async () => {
    const files = await fastGlob(['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'], {
      cwd: repoRoot,
      absolute: true,
    });
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (/from\s+['"]next\/link['"]/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders, `files still importing next/link:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('routing config exports fr + en with fr default', async () => {
    const mod = await import('@/i18n/routing');
    expect(mod.routing.locales).toEqual(['fr', 'en']);
    expect(mod.routing.defaultLocale).toBe('fr');
  });

  it('app/[locale]/layout.tsx sets html lang from params', () => {
    const file = resolve(appDir, '[locale]', 'layout.tsx');
    const content = readFileSync(file, 'utf8');
    expect(content).toMatch(/lang=\{locale\}/);
    expect(content).not.toMatch(/lang="fr"/);
    expect(content).not.toMatch(/lang='fr'/);
  });

  it('middleware config matcher excludes /api', () => {
    const file = resolve(repoRoot, 'middleware.ts');
    const content = readFileSync(file, 'utf8');
    expect(content).toMatch(/matcher.*\?!api/);
  });
});
