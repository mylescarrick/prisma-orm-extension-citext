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
import { assembleDataTypes } from '@prisma/orm-framework/components/codec';
import { createPostgresCodecRegistryWithBuiltins } from '@prisma/orm-target-postgres/target/codecs';
import { postgresDataTypes } from '@prisma/orm-target-postgres/target/data-types';
import { codecDescriptors } from './core/codecs.ts';
import { citextDataTypes } from './core/data-types.ts';
import { CITEXT_CODEC_ID, CITEXT_NATIVE_TYPE } from './core/constants.ts';

// Supply the owned codec directly: registering this pack as an extension here
// would make the published contract space depend on itself.
const dataTypeLookup = assembleDataTypes([
  { id: 'postgres', dataTypes: postgresDataTypes },
  { id: 'citext', dataTypes: citextDataTypes },
]).lookup;

export const contract = defineContract({
  dataTypeLookup,
  codecLookup: createPostgresCodecRegistryWithBuiltins(codecDescriptors, dataTypeLookup),
  types: {
    [CITEXT_NATIVE_TYPE]: {
      kind: 'codec-instance',
      codecId: CITEXT_CODEC_ID,
      typeParams: {},
    },
  },
  models: {},
});

export default contract;
