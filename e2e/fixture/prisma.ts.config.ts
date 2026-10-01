import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';
import citext from 'prisma-orm-extension-citext/control';

// The TypeScript door: the same extension through the contract builder. Emit-only check.
export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/ts/contract.ts',
    extensions: [citext],
    migrations: { dir: './migrations-ts' },
    db: { connection: process.env['DATABASE_URL']! },
  }),
});
