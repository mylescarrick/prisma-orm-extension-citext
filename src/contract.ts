/**
 * Contract source for this package's own contract space.
 *
 * citext ships no tables. The only thing it contributes is the `citext` storage type, registered
 * here so the space's `contract.json` names it and the verifier sees `citext` as owned by this
 * space. The baseline migration in `migrations/` installs the Postgres extension that defines it.
 *
 * TypeScript rather than PSL because PSL has no surface for an extension to register a base storage
 * type, the same reason pgvector gives.
 *
 * `prisma contract emit` (the `build:contract-space` script) writes `src/contract.{json,d.ts}`,
 * which `src/exports/control.ts` imports.
 */

import { defineContract } from '@prisma/orm-postgres/contract-builder';
import { CITEXT_CODEC_ID, CITEXT_NATIVE_TYPE } from './core/constants.ts';

export const contract = defineContract({
  types: {
    [CITEXT_NATIVE_TYPE]: {
      kind: 'codec-instance',
      codecId: CITEXT_CODEC_ID,
      nativeType: CITEXT_NATIVE_TYPE,
      typeParams: {},
    },
  },
  models: {},
});

export default contract;
