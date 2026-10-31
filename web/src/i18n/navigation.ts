import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Locale-aware navigation helpers (Link, useRouter) that accept a `locale` option.
export const {Link, useRouter, usePathname, redirect, permanentRedirect} = createNavigation(routing);
