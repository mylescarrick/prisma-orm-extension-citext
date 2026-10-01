/**
 * Config for this package's own contract space (ADR 212, contract-space package layout).
 *
 * Used only by maintainers: `prisma contract emit` writes `src/contract.{json,d.ts}`. Consumers
 * never load this file; they get the space through the control descriptor.
 */

import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/contract.ts',
    migrations: { dir: 'migrations' },
  }),
});
