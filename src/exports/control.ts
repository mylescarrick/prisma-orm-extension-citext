/**
 * Control-plane descriptor, registered in `prisma.config.ts`.
 *
 * citext takes no parameters, so the native type expands to itself.
 */

import type {
  CodecControlHooks,
  SqlControlExtensionDescriptor,
} from '@prisma/orm-family-sql/family/control';
import { CITEXT_CODEC_ID } from '../core/constants.js';
import { citextPackMeta } from '../core/pack-meta.js';

const citextControlPlaneHooks: CodecControlHooks = {
  expandNativeType: ({ nativeType }) => nativeType,
};

export const citextExtensionDescriptor: SqlControlExtensionDescriptor<'postgres'> = {
  ...citextPackMeta,
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
