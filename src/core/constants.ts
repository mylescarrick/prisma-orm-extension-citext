/**
 * Identifiers shared by every layer of the extension.
 *
 * Once published, the codec id, data type id, space id and invariant ids are part of every
 * consumer's emitted contract and migration history. Never change them; add a new version instead.
 */

export const PACKAGE_NAME = 'prisma-orm-extension-citext' as const;

export const CITEXT_CODEC_ID = 'citext/citext@1' as const;

export const CITEXT_DATA_TYPE_ID = 'citext/citext' as const;

export const CITEXT_NATIVE_TYPE = 'citext' as const;

/** Extension id, PSL namespace (`citext.Citext`) and contract space id. */
export const CITEXT_SPACE_ID = 'citext' as const;

export const CITEXT_BASELINE_MIGRATION_NAME = '20261001T0000_install_citext_extension' as const;

export const CITEXT_INVARIANTS = {
  installCitext: 'citext:install-citext-v1',
} as const;
