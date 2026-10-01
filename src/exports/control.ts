/**
 * Control-plane descriptor, registered in `prisma.config.ts`.
 *
 * It carries this package's contract space: the emitted `src/contract.json`, the baseline migration
 * that runs `CREATE EXTENSION IF NOT EXISTS citext`, and the head ref. `prisma db init`,
 * `db update` and `db migrate` in a consuming app apply that migration before any table that uses
 * a citext column. The JSON is imported rather than read from disk so it travels through the app's
 * module resolver and bundler.
 *
 * citext takes no parameters, so the native type expands to itself.
 */

import type { Contract } from '@prisma/orm-framework/contract/types';
import type {
  CodecControlHooks,
  SqlControlExtensionDescriptor,
} from '@prisma/orm-family-sql/family/control';
import type { SqlStorage } from '@prisma/orm-family-sql/contract/types';
import { contractSpaceFromJson } from '@prisma/orm-toolchain/migration-tools/spaces';
import baselineMetadata from '../../migrations/20261001T0000_install_citext_extension/migration.json' with {
  type: 'json',
};
import baselineOps from '../../migrations/20261001T0000_install_citext_extension/ops.json' with {
  type: 'json',
};
import headRef from '../../migrations/refs/head.json' with { type: 'json' };
import contractJson from '../contract.json' with { type: 'json' };
import { CITEXT_BASELINE_MIGRATION_NAME, CITEXT_CODEC_ID, CITEXT_SPACE_ID } from '../core/constants.js';
import { citextPackMeta } from '../core/pack-meta.js';

const citextControlPlaneHooks: CodecControlHooks = {
  expandNativeType: ({ nativeType }) => nativeType,
};

const citextContractSpace = contractSpaceFromJson<Contract<SqlStorage>>({
  contractJson,
  migrations: [
    {
      dirName: CITEXT_BASELINE_MIGRATION_NAME,
      metadata: baselineMetadata,
      ops: baselineOps,
    },
  ],
  headRef,
});

export const citextExtensionDescriptor: SqlControlExtensionDescriptor<'postgres'> = {
  ...citextPackMeta,
  id: CITEXT_SPACE_ID,
  contractSpace: citextContractSpace,
  types: {
    ...citextPackMeta.types,
    codecTypes: {
      ...citextPackMeta.types.codecTypes,
      controlPlaneHooks: {
        [CITEXT_CODEC_ID]: citextControlPlaneHooks,
      },
    },
  },
  create: () => ({
    familyId: 'sql' as const,
    targetId: 'postgres' as const,
  }),
};

export default citextExtensionDescriptor;
