import { buildCodecDescriptorRegistry } from '@prisma/orm-family-sql/relational-core/codec-descriptor-registry';
import type { CodecDescriptorRegistry } from '@prisma/orm-family-sql/relational-core/query-lane-context';
import { codecDescriptors } from './codecs.js';

export const citextCodecRegistry: CodecDescriptorRegistry = buildCodecDescriptorRegistry(codecDescriptors);
