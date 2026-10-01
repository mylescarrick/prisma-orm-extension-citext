import { describe, expect, test } from 'bun:test';
import type { CodecCallContext } from '@prisma/orm-framework/components/codec';
import { pgText } from '@prisma/orm-target-postgres/target/data-types';
import { citext, citextDescriptor } from '../src/core/codecs.js';
import { CITEXT_CODEC_ID, CITEXT_DATA_TYPE_ID } from '../src/core/constants.js';
import { citextDataType } from '../src/core/data-types.js';

const ctx = {} as CodecCallContext;
const codec = citextDescriptor.factory()({} as never);

describe('CitextCodec', () => {
  test('passes strings through unchanged on the wire, case included', async () => {
    expect(await codec.encode('MiXeD@Example.com', ctx)).toBe('MiXeD@Example.com');
    expect(await codec.decode('MiXeD@Example.com', ctx)).toBe('MiXeD@Example.com');
  });

  test('passes strings through unchanged in JSON', () => {
    expect(codec.encodeJson('Ada')).toBe('Ada');
    expect(codec.decodeJson('Ada')).toBe('Ada');
  });
});

describe('CitextDescriptor', () => {
  test('declares the citext codec, data type and native type', () => {
    expect(citextDescriptor.codecId).toBe(CITEXT_CODEC_ID);
    expect(citextDescriptor.dataType).toBe(citextDataType.id);
    expect(citextDescriptor.targetTypes).toEqual(['citext']);
    // The adapter casts parameters to this type. `text` here would make comparisons case-sensitive.
    expect(citextDescriptor.nativeTypeFor({ codecId: CITEXT_CODEC_ID })).toBe('citext');
  });

  test('has the same traits as pg/text@1, so every string operator applies', () => {
    expect(citextDescriptor.traits).toEqual(['equality', 'order', 'textual']);
  });

  test('renders default literals as TypeScript string literals', () => {
    expect(citextDescriptor.renderValueLiteral('anonymous')).toBe('"anonymous"');
  });
});

describe('citext() column helper', () => {
  test('packs the codec id and the citext native type with no params', () => {
    const spec = citext();
    expect(spec.codecId).toBe(CITEXT_CODEC_ID);
    expect(spec.nativeType).toBe('citext');
    expect(spec.typeParams).toBeUndefined();
  });
});

describe('citext data type', () => {
  test('takes pg/text values unchanged, so string defaults reach citext columns', () => {
    expect(String(citextDataType.id)).toBe(CITEXT_DATA_TYPE_ID);
    const cast = citextDataType.casts[pgText.id];
    expect(cast).toBeDefined();
    expect(cast?.('Hello')).toBe('Hello');
  });
});
