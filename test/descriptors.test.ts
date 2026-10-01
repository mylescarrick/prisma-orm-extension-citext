import { describe, expect, test } from 'bun:test';
import type { CodecControlHooks } from '@prisma/orm-family-sql/family/control';
import packageJson from '../package.json' with { type: 'json' };
import baselineMetadata from '../migrations/20261001T0000_install_citext_extension/migration.json' with { type: 'json' };
import baselineOps from '../migrations/20261001T0000_install_citext_extension/ops.json' with { type: 'json' };
import headRef from '../migrations/refs/head.json' with { type: 'json' };
import contractJson from '../src/contract.json' with { type: 'json' };
import { CITEXT_CODEC_ID, CITEXT_INVARIANTS, PACKAGE_NAME } from '../src/core/constants.js';
import control from '../src/exports/control.js';
import pack from '../src/exports/pack.js';
import runtime from '../src/exports/runtime.js';

describe('pack metadata', () => {
  test('registers the PSL constructor citext.Citext()', () => {
    expect(pack.authoring.type.citext.Citext).toMatchObject({
      kind: 'typeConstructor',
      output: { codecId: CITEXT_CODEC_ID, nativeType: 'citext' },
    });
  });

  test('reports the package version', () => {
    expect(String(pack.version)).toBe(packageJson.version);
  });

  test('points contract.d.ts at this package for codec types', () => {
    expect(String(PACKAGE_NAME)).toBe(packageJson.name);
    expect(String(pack.types.codecTypes.import.package)).toBe(`${packageJson.name}/codec-types`);
    expect(Object.keys(packageJson.exports)).toContain('./codec-types');
  });
});

describe('runtime descriptor', () => {
  test('ships the citext codec', () => {
    expect(runtime.codecs?.().map((d) => d.codecId)).toEqual([CITEXT_CODEC_ID]);
  });
});

describe('control descriptor', () => {
  test('expands the native type to itself', () => {
    const hooks = control.types?.codecTypes?.controlPlaneHooks?.[CITEXT_CODEC_ID] as
      | CodecControlHooks
      | undefined;
    expect(
      hooks?.expandNativeType?.({ nativeType: 'citext', codecId: CITEXT_CODEC_ID } as never),
    ).toBe('citext');
  });

  test('carries a contract space', () => {
    expect(control.contractSpace).toBeDefined();
  });
});

describe('contract space', () => {
  // These hashes must agree. If src/contract.ts changes and is re-emitted without regenerating the
  // migration and head ref, apps fail at db migrate rather than here.
  const storageHash = contractJson.storage.storageHash;

  test('baseline migration ends at the emitted contract', () => {
    expect(baselineMetadata.from).toBeNull();
    expect(baselineMetadata.to).toBe(storageHash);
  });

  test('head ref points at the emitted contract with the install invariant', () => {
    expect(headRef.hash).toBe(storageHash);
    expect(headRef.invariants).toEqual([CITEXT_INVARIANTS.installCitext]);
    expect(baselineMetadata.providedInvariants).toEqual([CITEXT_INVARIANTS.installCitext]);
  });

  test('baseline migration installs citext idempotently', () => {
    const sql = baselineOps.flatMap((op) => op.execute.map((step) => step.sql));
    expect(sql).toEqual(['CREATE EXTENSION IF NOT EXISTS citext']);
  });

  test('the contract registers the citext storage type and no tables', () => {
    expect(contractJson.storage.types).toEqual({
      citext: { codecId: CITEXT_CODEC_ID, kind: 'codec-instance', nativeType: 'citext' },
    });
    expect(contractJson.storage.namespaces.public.entries.table).toEqual({});
  });
});
