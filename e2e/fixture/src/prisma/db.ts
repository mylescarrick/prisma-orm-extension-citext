import postgres from '@prisma/orm-postgres/runtime';
import citext from 'prisma-orm-extension-citext/runtime';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
  extensions: [citext],
});
