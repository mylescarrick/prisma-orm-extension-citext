/**
 * Runtime-plane descriptor, registered in `db.ts`.
 */

import type { SqlRuntimeExtensionDescriptor } from '@prisma/orm-family-sql/runtime';
import { citextPackMeta } from '../core/pack-meta.ts';
import { citextCodecRegistry } from '../core/registry.ts';

export const citextRuntimeDescriptor: SqlRuntimeExtensionDescriptor<'postgres'> = {
  kind: 'extension' as const,
  id: citextPackMeta.id,
  version: citextPackMeta.version,
  familyId: 'sql' as const,
  targetId: 'postgres' as const,
  dataTypes: citextPackMeta.dataTypes,
  types: {
    codecTypes: {
      codecDescriptors: Array.from(citextCodecRegistry.values()),
    },
  },
  codecs: () => Array.from(citextCodecRegistry.values()),
  create() {
    return {
      familyId: 'sql' as const,
      targetId: 'postgres' as const,
    };
  },
};

export default citextRuntimeDescriptor;
