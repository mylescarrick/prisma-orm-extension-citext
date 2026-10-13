/**
 * Pack metadata, shared by the control, runtime and pack entry points.
 *
 * `authoring.type` registers the PSL type, written bare like core's `BigIntNumber`:
 *
 *     model User {
 *       email citext.Citext @unique
 *     }
 */
import type { CodecTypes } from '../types/codec-types.ts';
import { CITEXT_CODEC_ID, CITEXT_SPACE_ID, PACKAGE_NAME } from './constants.ts';
import { citextDataTypes } from './data-types.ts';
import { citextCodecRegistry } from './registry.ts';

const citextPackMetaBase = {
  kind: 'extension',
  id: CITEXT_SPACE_ID,
  familyId: 'sql',
  targetId: 'postgres',
  version: '0.2.0',
  capabilities: {},
  authoring: {
    type: {
      citext: {
        Citext: {
          kind: 'typeConstructor' as const,
          documentation: 'Case-insensitive text, stored as PostgreSQL citext.',
          output: { codecId: CITEXT_CODEC_ID },
        },
      },
    },
  },
  dataTypes: citextDataTypes,
  types: {
    codecTypes: {
      codecDescriptors: Array.from(citextCodecRegistry.values()),
      import: {
        package: `${PACKAGE_NAME}/codec-types`,
        named: 'CodecTypes',
        alias: 'CitextTypes',
      },
    },
  },
} as const;

/**
 * The phantom `__codecTypes` field carries the codec map's literal type into the pack ref for
 * contract-builder generics. It is never read at runtime.
 */
export const citextPackMeta: typeof citextPackMetaBase & {
  readonly __codecTypes?: CodecTypes;
} = citextPackMetaBase;
