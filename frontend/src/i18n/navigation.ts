// Locale-aware re-exports of Next's navigation primitives. Every intra-app
// link, router.push, redirect, or pathname read in a client component MUST
// come from here (not from 'next/link' or 'next/navigation') so navigating
// preserves the current locale. The tripwire test under
// src/lib/server/observability/i18n-routing.test.ts enforces this.

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
